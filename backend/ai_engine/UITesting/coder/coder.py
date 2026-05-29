from __future__ import annotations

import argparse
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Tuple

import frontmatter
# import lmstudio as lms
from openai import OpenAI
from tqdm import tqdm
from dotenv import load_dotenv
from pydantic import BaseModel, Field

try:
    from utils.ai_runtime import get_max_workers, read_cache, retry_call, stable_hash, write_cache
except ImportError:
    from backend.ai_engine.utils.ai_runtime import get_max_workers, read_cache, retry_call, stable_hash, write_cache

load_dotenv()
AGENT_DIR = Path(__file__).resolve().parents[1]

class GeneratedSpec(BaseModel):
    spec_file: str = Field(description="Spec filename, e.g. LoginForm.spec.ts")
    content: str = Field(description="Full Playwright TypeScript test file content")
    test_case_count: int = Field(default=0)


class CoderBatchOutput(BaseModel):
    generated: List[GeneratedSpec] = Field(default_factory=list)


FORBIDDEN_CODE_PATTERNS = [
    "document.body.innerHTML",
    "addEventListener(",
    "page.$$eval(",
    ".evaluateAll(",
    "MouseEvent",
    "KeyboardEvent",
    "EventListener",
    "jest.",
    "sinon.",
    "vi.",
    "mount(",
    "render(",
    "screen.",
    "as any",
]


class Coder:
    def __init__(self, setting: str | None = None) -> None:
        setting = setting or str(AGENT_DIR / "coder" / "Coder.md")
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")

        try:
            with open(setting, "r", encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except Exception as exc:
            raise FileNotFoundError("File setting is not found. Please add file setting for CoderAgent.") from exc

        # self.model = lms.llm(settings.get("model"))
        self.model = settings.get('model')
        self.client = OpenAI(api_key=self.api_key)
        self.system_prompt = settings.content

    @staticmethod
    def _sanitize_name(value: str) -> str:
        cleaned = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in value.strip())
        cleaned = cleaned.strip("_")
        return cleaned or "generated"

    @staticmethod
    def _extract_json_object(raw_text: str) -> str:
        text = (raw_text or "").strip()
        if not text:
            return text
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return text[start : end + 1]
        return text

    def _load_input_items(self, filtered_input: Path) -> List[Dict[str, Any]]:
        """Load each filtered planner JSON file and keep only minimal fields required for code generation.
        This function now returns a list where each entry corresponds to a single component's test plan.
        """
        if not filtered_input.exists():
            raise FileNotFoundError(f"Input path does not exist: {filtered_input}")

        items: List[Dict[str, Any]] = []
        # If a single JSON file is passed, treat it as one item
        if filtered_input.is_file():
            try:
                content = json.loads(filtered_input.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in {filtered_input}: {e}")
            if isinstance(content, dict):
                component_name = content.get("component_name") or filtered_input.stem
                items.append({
                    "source_file": filtered_input.name,
                    "component_name": component_name,
                    "test_cases": content.get("test_cases", []),
                    "planner_output": content,
                })
            elif isinstance(content, list):
                # legacy support – list of items
                for entry in content:
                    if isinstance(entry, dict):
                        component_name = entry.get("component_name") or "generated"
                        items.append({
                            "source_file": filtered_input.name,
                            "component_name": component_name,
                            "test_cases": entry.get("test_cases", []),
                            "planner_output": entry,
                        })
            return items

        # Directory case – iterate over each JSON file
        for json_file in sorted(filtered_input.glob("*.json")):
            try:
                content = json.loads(json_file.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            if not isinstance(content, dict):
                continue
            component_name = content.get("component_name") or json_file.stem
            items.append({
                "source_file": json_file.name,
                "component_name": component_name,
                "test_cases": content.get("test_cases", []),
                "planner_output": content,
            })

        if not items:
            raise ValueError(f"No valid planner JSON files found in folder: {filtered_input}")
        return items

    def _request_codegen_from_llm(self, prompt: str) -> str:
        response = retry_call(
            lambda: self.client.responses.parse(
                model=self.model,
                input=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                text_format=CoderBatchOutput
            )
        )
        return response.output_parsed

    def _validate_generated_output(self, output: CoderBatchOutput) -> List[str]:
        violations: List[str] = []
        if len(output.generated) != 1:
            violations.append("Output must contain exactly one generated spec file.")

        for gen in output.generated:
            if not gen.content.strip():
                violations.append(f"{gen.spec_file}: content is empty.")
            for pattern in FORBIDDEN_CODE_PATTERNS:
                if pattern in gen.content:
                    violations.append(f"{gen.spec_file}: forbidden pattern `{pattern}` found.")
        return violations

    def _repair_policy_violations(
        self,
        output: CoderBatchOutput,
        original_prompt: str,
        violations: List[str],
    ) -> CoderBatchOutput:
        repair_payload = {
            "violations": violations,
            "original_prompt": original_prompt,
            "generated_output": output.model_dump(),
        }
        repair_prompt = (
            "Rewrite the generated Playwright spec to fix every violation below. "
            "Return ONLY JSON matching the CoderBatchOutput schema. "
            "Do not use fake DOM, component mounting, browser event listeners, implicit any, or forbidden patterns.\n"
            f"{json.dumps(repair_payload, ensure_ascii=False, indent=2)}"
        )
        repaired = self._request_codegen_from_llm(repair_prompt)
        repaired_output = self._parse_or_repair_output(repaired, repair_prompt)
        remaining_violations = self._validate_generated_output(repaired_output)
        if remaining_violations:
            raise ValueError("Coder repair still violates policy: " + "; ".join(remaining_violations))
        return repaired_output

    def _parse_or_repair_output(self, content: Any, prompt: str) -> CoderBatchOutput:
        # 1. Nếu LLM đã trả về chuẩn Object Pydantic -> Thành công, không cần sửa, trả về luôn!
        if isinstance(content, CoderBatchOutput):
            return content
            
        # 2. Nếu trả về string (hoặc fallback), thử extract JSON và tự validate
        candidate = self._extract_json_object(str(content))
        try:
            return CoderBatchOutput.model_validate_json(candidate)
        except Exception as first_error:
            # 3. CHỈ VÀO ĐÂY KHI CÓ LỖI: Gọi LLM để sửa lại (Auto-Healing)
            print(f"[Coder] Phát hiện JSON lỗi format từ LLM. Đang tiến hành tự động sửa chữa...")
            repair_prompt = (
                "Fix this invalid/truncated JSON and return ONLY valid JSON that matches schema.\n"
                f"Original generation prompt:\n{prompt}\n"
                f"Broken JSON:\n{candidate}"
            )
            repaired = self._request_codegen_from_llm(repair_prompt)
            
            # Tương tự, nếu bản sửa lỗi đã là Object thì trả về luôn
            if isinstance(repaired, CoderBatchOutput):
                return repaired
                
            repaired_candidate = self._extract_json_object(str(repaired))
            try:
                return CoderBatchOutput.model_validate_json(repaired_candidate)
            except Exception as second_error:
                raise ValueError(
                    "Coder received invalid JSON from LLM after one repair retry. "
                    f"First parse error: {first_error}; Second parse error: {second_error}"
                ) from second_error

    def generate_from_filtered(
        self,
        filtered_input: Path,
        output_dir: Path,
        base_url: str,
        cache_dir: Path | None = None,
        progress_callback=None,
    ) -> Dict[str, Any]:
        """Generate Playwright spec files **one per filtered plan file**.
        This method now loads each planner JSON individually, builds a tiny prompt containing only the relevant test cases
        and calls the LLM for each component. The result is written to `output_dir` and a manifest is returned.
        """
        items = self._load_input_items(filtered_input)
        output_dir.mkdir(parents=True, exist_ok=True)

        cache_path = cache_dir or (output_dir / ".cache")
        if not items:
            manifest = {
                "input": str(filtered_input),
                "output_dir": str(output_dir),
                "generated_count": 0,
                "generated": [],
            }
            (output_dir / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
            return manifest

        def generate_one(index: int, item: Dict[str, Any]) -> Tuple[int, Dict[str, Any], CoderBatchOutput]:
            planner_output = item.get("planner_output", {})
            prompt_payload = {
                "base_url": base_url,
                "component": {
                    "name": item["component_name"],
                    "source_file": planner_output.get("file_path", ""),
                    "module_type": planner_output.get("module_type", ""),
                    "impact_level": planner_output.get("impact_level", ""),
                    "generation_notes": planner_output.get("generation_notes", []),
                    "test_cases": item["test_cases"],
                },
                "constraints": {
                    "framework": "@playwright/test",
                    "language": "TypeScript",
                    "include_real_actions": True,
                    "compile_first": True,
                    "no_fake_dom": True,
                },
            }
            prompt = (
                "Generate one conservative Playwright E2E spec file (TypeScript) for the component below. "
                "Prioritize TypeScript compilation and real app interactions over complex behavior. "
                "Return ONLY JSON matching the CoderBatchOutput schema.\n"
                f"{json.dumps(prompt_payload, ensure_ascii=False, indent=2)}"
            )

            cache_key = stable_hash({
                "stage": "coder",
                "model": self.model,
                "system_prompt": self.system_prompt,
                "base_url": base_url,
                "item": item,
            })
            cached = read_cache(cache_path, cache_key)
            if cached:
                return index, item, CoderBatchOutput.model_validate(cached)

            try:
                content = self._request_codegen_from_llm(prompt)
                output = self._parse_or_repair_output(content, prompt)
                violations = self._validate_generated_output(output)
                if violations:
                    output = self._repair_policy_violations(output, prompt, violations)
                write_cache(cache_path, cache_key, output.model_dump())
                return index, item, output
            except Exception as exc:
                print(f"[Coder] Lỗi khi sinh spec cho {item['source_file']}: {exc}")
                return index, item, CoderBatchOutput(generated=[])

        generated_outputs: List[Tuple[int, Dict[str, Any], CoderBatchOutput]] = []
        max_workers = min(get_max_workers(), len(items))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(generate_one, index, item) for index, item in enumerate(items)]
            completed = 0
            if progress_callback:
                progress_callback(completed, len(futures))
            for future in tqdm(as_completed(futures), total=len(futures), desc="Generating specs"):
                result = future.result()
                generated_outputs.append(result)
                completed += 1
                if progress_callback:
                    progress_callback(completed, len(futures), result[1].get("source_file", ""))
        generated_outputs.sort(key=lambda output_item: output_item[0])

        generated_manifest: List[Dict[str, Any]] = []
        used_spec_names: set[str] = set()
        for _, item, output in generated_outputs:
            # Write each generated spec file
            for gen in output.generated:
                spec_name = gen.spec_file
                if not spec_name.endswith(".spec.ts"):
                    spec_name = f"{self._sanitize_name(spec_name)}.spec.ts"
                if spec_name in used_spec_names:
                    source_stem = self._sanitize_name(Path(item["source_file"]).stem)
                    spec_name = f"{source_stem}_{spec_name}"
                used_spec_names.add(spec_name)
                spec_path = output_dir / spec_name
                spec_path.write_text(gen.content.rstrip() + "\n", encoding="utf-8")
                generated_manifest.append({
                    "component_name": item["component_name"],
                    "source_file": item["source_file"],
                    "spec_file": spec_name,
                    "test_case_count": gen.test_case_count,
                })

        manifest = {
            "input": str(filtered_input),
            "output_dir": str(output_dir),
            "generated_count": len(generated_manifest),
            "generated": generated_manifest,
        }
        (output_dir / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Playwright spec files from filtered planner outputs.")
    parser.add_argument(
        "--filtered-input",
        default="backend/ai_engine/planner_outputs",
        help="Input path for coder: either a filtered JSON array file or a folder containing planner JSON files",
    )
    parser.add_argument("--output-dir", default="backend/ai_engine/coder_outputs", help="Directory to write generated Playwright specs")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Base URL for page.goto in tests")
    args = parser.parse_args()

    coder = Coder()
    manifest = coder.generate_from_filtered(
        filtered_input=Path(args.filtered_input),
        output_dir=Path(args.output_dir),
        base_url=args.base_url,
    )
    print(f"Generated {manifest['generated_count']} spec files in {manifest['output_dir']}")


if __name__ == "__main__":
    main()
