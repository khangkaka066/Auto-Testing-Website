import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List


def _sanitize_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "_", value.strip())
    return cleaned.strip("_") or "generated"


def _extract_selector(step: str) -> str:
    marker = "selector:"
    low = step.lower()
    idx = low.find(marker)
    if idx == -1:
        return ""
    return step[idx + len(marker):].strip().strip(".`\"")


def _step_to_playwright(step: str, test_data: Dict[str, Any]) -> List[str]:
    line = step.strip()
    low = line.lower()
    selector = _extract_selector(line)

    if "type" in low or "input" in low or "fill" in low:
        value = test_data.get("sample_input", "test-input")
        if selector:
            return [f"await page.locator('{selector}').fill({json.dumps(str(value))});"]
    if "click" in low or "perform interaction" in low or "trigger" in low:
        if selector:
            return [f"await page.locator('{selector}').click();"]
    if "visible" in low:
        if selector:
            return [f"await expect(page.locator('{selector}')).toBeVisible();"]
        return [f"// TODO: assertion detail needed for step: {json.dumps(line)}"]
    if "assert" in low:
        return [f"// TODO: implement assert from step: {json.dumps(line)}"]

    return [f"// TODO: map step -> playwright: {json.dumps(line)}"]


def _mock_lines(mock_strategy: Dict[str, Any]) -> List[str]:
    mtype = str(mock_strategy.get("type", "none")).lower()
    targets = mock_strategy.get("targets", []) or []
    if mtype != "route_intercept" or not targets:
        return []

    lines: List[str] = []
    for target in targets:
        lines.extend(
            [
                f"await page.route('**{target}**', async (route) => {{",
                "  await route.fulfill({",
                "    status: 200,",
                "    contentType: 'application/json',",
                "    body: JSON.stringify({ ok: true, mocked: true }),",
                "  });",
                "});",
            ]
        )
    return lines


def _build_test_block(case: Dict[str, Any]) -> str:
    title = case.get("title", "Generated test case")
    test_data = case.get("test_data", {}) or {}
    steps = case.get("steps", []) or []
    criteria = (case.get("criteria", {}) or {}).get("pass_when", []) or []
    mock_strategy = case.get("mock_strategy", {}) or {}

    lines = [f"test({json.dumps(title)}, async ({{ page }}) => {{"]
    lines.extend([f"  {l}" for l in _mock_lines(mock_strategy)])

    for step in steps:
        for cmd in _step_to_playwright(str(step), test_data):
            lines.append(f"  {cmd}")

    for check in criteria:
        lines.append(f"  // pass criteria: {check}")

    lines.append("});")
    return "\n".join(lines)


def generate_spec_content(component_name: str, planner_output: Dict[str, Any], base_url: str) -> str:
    test_cases = planner_output.get("test_cases", []) or []
    header = [
        "import { test, expect } from '@playwright/test';",
        "",
        f"test.describe({json.dumps(component_name)}, () => {{",
        f"  test.beforeEach(async ({{ page }}) => {{ await page.goto({json.dumps(base_url)}); }});",
        "",
    ]

    blocks = []
    for case in test_cases:
        block = _build_test_block(case)
        blocks.append("\n".join(["  " + ln for ln in block.splitlines()]))

    footer = ["});", ""]
    return "\n".join(header + blocks + footer)


def generate_from_filtered(filtered_file: Path, output_dir: Path, base_url: str) -> Dict[str, Any]:
    data = json.loads(filtered_file.read_text(encoding="utf-8"))
    output_dir.mkdir(parents=True, exist_ok=True)

    generated: List[Dict[str, Any]] = []

    for item in data:
        planner_output = item.get("planner_output", {}) or {}
        test_cases = planner_output.get("test_cases", []) or []
        if not test_cases:
            continue

        component_name = item.get("component_name") or planner_output.get("component_name") or "component"
        file_stem = _sanitize_name(component_name)
        spec_name = f"{file_stem}.spec.ts"
        spec_path = output_dir / spec_name

        content = generate_spec_content(component_name, planner_output, base_url)
        spec_path.write_text(content, encoding="utf-8")

        generated.append(
            {
                "component_name": component_name,
                "source_file": item.get("source_file", ""),
                "spec_file": spec_name,
                "test_case_count": len(test_cases),
            }
        )

    manifest = {
        "input": str(filtered_file),
        "output_dir": str(output_dir),
        "generated_count": len(generated),
        "generated": generated,
    }
    (output_dir / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    # parser = argparse.ArgumentParser(description="Generate Playwright spec files from filtered planner outputs.")
    # parser.add_argument("--filtered-input", required=True, help="Path to filtered_for_coder.json from filter_tc.py")
    # parser.add_argument("--output-dir", required=True, help="Directory to write generated Playwright specs")
    # parser.add_argument("--base-url", default="http://localhost:3000", help="Base URL for page.goto in tests")
    # args = parser.parse_args()

    manifest = generate_from_filtered(
        filtered_file=Path("backend/ai_engine/filter_outputs/fitered_outputs.json"),
        output_dir=Path("backend/ai_engine/coder_outputs"),
        base_url="http://localhost:3000",
    )
    print(f"Generated {manifest['generated_count']} spec files in {manifest['output_dir']}")


if __name__ == "__main__":
    main()
