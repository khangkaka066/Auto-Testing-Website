import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, List


def has_usable_test_cases(payload: Dict[str, Any]) -> bool:
    should_generate = payload.get("should_generate_plan", False)
    test_cases = payload.get("test_cases", [])
    return bool(should_generate and isinstance(test_cases, list) and len(test_cases) > 0)


def filter_planner_outputs(input_dir: Path, output_file: Path) -> List[Dict[str, Any]]:
    selected: List[Dict[str, Any]] = []

    for json_file in sorted(input_dir.glob("*.json")):
        try:
            data = json.loads(json_file.read_text(encoding="utf-8"))
        except Exception:
            continue

        if has_usable_test_cases(data):
            selected.append(
                {
                    "source_file": json_file.name,
                    "component_name": data.get("component_name", ""),
                    "requested_test_types": data.get("requested_test_types", []),
                    "test_case_count": len(data.get("test_cases", [])),
                    "planner_output": data,
                }
            )

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")
    return selected


def main() -> None:
    parser = argparse.ArgumentParser(description="Filter planner JSON outputs to only files containing usable test cases.")
    parser.add_argument("--input-dir", required=True, help="Directory containing planner JSON outputs")
    parser.add_argument("--output-file", required=True, help="Path for filtered JSON output")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_file = Path(args.output_file)

    selected = filter_planner_outputs(input_dir=input_dir, output_file=output_file)
    print(f"Filtered {len(selected)} planner files with usable test cases -> {output_file}")


if __name__ == "__main__":
    main()