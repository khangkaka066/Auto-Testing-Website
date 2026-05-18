from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, List

import frontmatter
import lmstudio as lms
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

class GeneratedSpec(BaseModel):
    spec_file: str = Field(description="Spec filename, e.g. LoginForm.spec.ts")
    content: str = Field(description="Full Playwright TypeScript test file content")
    test_case_count: int = Field(default=0)


class CoderBatchOutput(BaseModel):
    generated: List[GeneratedSpec] = Field(default_factory=list)

class Coder:
    def __init__(self, setting: str = "backend/ai_engine/settings_agent/Coder.md") -> None:
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")

        try:
            with open(setting, "r", encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except Exception as exc:
            raise FileNotFoundError("File setting is not found. Please add file setting for CoderAgent.") from exc

        self.model = lms.llm(settings.get("model"))
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
        if filtered_input.is_file():
            data = json.loads(filtered_input.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
            raise ValueError("Filtered input file must contain a JSON array.")

        if not filtered_input.is_dir():
            raise FileNotFoundError(f"Input path does not exist: {filtered_input}")

        items: List[Dict[str, Any]] = []
        for json_file in sorted(filtered_input.glob("*.json")):
            try:
                content = json.loads(json_file.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue

            if not isinstance(content, dict):
                continue

            planner_output = content
            component_name = planner_output.get("component_name") or json_file.stem
            item = {
                "source_file": json_file.name,
                "component_name": component_name,
                "requested_test_types": planner_output.get("requested_test_types", []),
                "test_case_count": len(planner_output.get("test_cases", []) or []),
                "planner_output": planner_output,
            }
            items.append(item)

        if not items:
            raise ValueError(f"No valid planner JSON files found in folder: {filtered_input}")

        return items

    def _request_codegen_from_llm(self, prompt: str) -> str:
        response = self.model.respond(
            {
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt},
                ]
            },
            response_format=CoderBatchOutput,
        )
        return response.content

    def _parse_or_repair_output(self, content: str, prompt: str) -> CoderBatchOutput:
        candidate = self._extract_json_object(content)
        try:
            return CoderBatchOutput.model_validate_json(candidate)
        except Exception as first_error:
            repair_prompt = (
                "Fix this invalid/truncated JSON and return ONLY valid JSON that matches schema.\n"
                f"Original generation prompt:\n{prompt}\n"
                f"Broken JSON:\n{candidate}"
            )
            repaired = self._request_codegen_from_llm(repair_prompt)
            repaired_candidate = self._extract_json_object(repaired)
            try:
                return CoderBatchOutput.model_validate_json(repaired_candidate)
            except Exception as second_error:
                raise ValueError(
                    "Coder received invalid JSON from LLM after one repair retry. "
                    f"First parse error: {first_error}; Second parse error: {second_error}"
                ) from second_error

    def generate_from_filtered(self, filtered_input: Path, output_dir: Path, base_url: str) -> Dict[str, Any]:
        data = self._load_input_items(filtered_input)
        output_dir.mkdir(parents=True, exist_ok=True)

        prompt_payload = {
            "base_url": base_url,
            "items": data,
            "constraints": {
                "framework": "@playwright/test",
                "language": "TypeScript",
                "one_spec_per_component": True,
                "include_real_actions": True,
            },
        }
        prompt = f"Generate Playwright spec files from this JSON payload:\n{json.dumps(prompt_payload, ensure_ascii=False, indent=2)}"

        content = self._request_codegen_from_llm(prompt)
        output = self._parse_or_repair_output(content, prompt)

        generated_manifest: List[Dict[str, Any]] = []
        for item in output.generated:
            spec_name = item.spec_file
            if not spec_name.endswith(".spec.ts"):
                spec_name = f"{self._sanitize_name(spec_name)}.spec.ts"

            spec_path = output_dir / spec_name
            spec_path.write_text(item.content.rstrip() + "\n", encoding="utf-8")

            component_name = spec_name.replace(".spec.ts", "")
            source_file = ""
            for src_item in data:
                guess_name = src_item.get("component_name") or src_item.get("planner_output", {}).get("component_name")
                if str(guess_name).lower() == component_name.lower():
                    source_file = src_item.get("source_file", "")
                    break

            generated_manifest.append(
                {
                    "component_name": component_name,
                    "source_file": source_file,
                    "spec_file": spec_name,
                    "test_case_count": item.test_case_count,
                }
            )

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