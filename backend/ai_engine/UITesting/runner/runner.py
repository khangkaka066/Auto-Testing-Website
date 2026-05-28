from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
import re

class Runner:
    """Execute generated Playwright specs and create a user-facing summary report."""

    def run_specs(
        self,
        specs_dir: Path,
        report_file: Path,
        working_dir: Path | None = None,
        base_url: str | None = None,
    ) -> Dict[str, Any]:
        # if not specs_dir.exists() or not specs_dir.is_dir():
        #     raise FileNotFoundError(f"Specs directory not found: {specs_dir}")

        run_dir = Path(working_dir).resolve() if working_dir else Path.cwd()
        report_file.parent.mkdir(parents=True, exist_ok=True)

        json_report_path = (report_file.parent / "playwright-report.json").resolve()

        cmd: List[str] = [
            "npx",
            "playwright",
            "test",
            "--reporter=json",
        ]

        env = {**dict(**__import__("os").environ)}
        if base_url:
            env["BASE_URL"] = base_url

        result = subprocess.run(
            cmd,
            cwd=str(run_dir),
            env=env,
            text=True,
            capture_output=True,
            encoding="utf-8",
        )

        # raw_output = result.stdout.strip()
        # if raw_output:
        #     json_report_path.write_text(raw_output + "\n", encoding="utf-8")
        raw_stdout = result.stdout or ""
        stderr_log = result.stderr or ""

        # --- BẮT JSON AN TOÀN TỪ STDOUT BẰNG REGEX ---
        match = re.search(r'\{\n\s*"config":', raw_stdout)
        json_start_idx = match.start() if match else -1
        
        raw_output = ""
        if json_start_idx != -1:
            json_data = raw_stdout[json_start_idx:].strip()
            json_report_path.write_text(json_data, encoding="utf-8")
            raw_output = json_data
        else:
            raw_output = raw_stdout.strip()
            if raw_output.startswith("{"):
                json_report_path.write_text(raw_output, encoding="utf-8")
            else:
                if raw_output:
                    print("⚠️ CẢNH BÁO: Playwright trả về nội dung không phải JSON!")
                    print(raw_stdout[:500] + "...(bị cắt dở)")

        summary = self._build_summary(
            return_code=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
            json_report_path=json_report_path,
            specs_dir=specs_dir,
        )

        report_file.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        return summary

    def _build_summary(
        self,
        return_code: int,
        stdout: str,
        stderr: str,
        json_report_path: Path,
        specs_dir: Path,
    ) -> Dict[str, Any]:
        summary: Dict[str, Any] = {
            "runner_version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "specs_dir": str(specs_dir),
            "status": "passed" if return_code == 0 else "failed",
            "return_code": return_code,
            "stats": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "timed_out": 0,
                "duration_ms": 0,
            },
            "test_cases": [],
            "stderr": stderr.strip(),
        }

        if not stdout.strip():
            return summary

        try:
            data = json.loads(stdout)
        except json.JSONDecodeError:
            summary["stderr"] = (summary["stderr"] + "\nUnable to parse Playwright JSON output.").strip()
            return summary

        suites = data.get("suites", []) or []
        test_cases: List[Dict[str, Any]] = []

        def walk_suite(suite: Dict[str, Any], parent_title: str = "") -> None:
            current_title = " > ".join(filter(None, [parent_title, suite.get("title", "")])).strip(" >")
            for spec in suite.get("specs", []) or []:
                spec_title = spec.get("title", "")
                full_title = " > ".join(filter(None, [current_title, spec_title])).strip(" >")
                tests = spec.get("tests", []) or []
                for test in tests:
                    outcome = (test.get("outcome") or "unknown").lower()
                    duration_ms = sum((r.get("duration") or 0) for r in (test.get("results") or []))
                    errors = []
                    for r in test.get("results") or []:
                        err = r.get("error")
                        if err and isinstance(err, dict):
                            message = err.get("message") or ""
                            if message:
                                errors.append(message.strip())
                    test_cases.append(
                        {
                            "title": full_title,
                            "status": outcome,
                            "duration_ms": duration_ms,
                            "errors": errors,
                        }
                    )

            for child in suite.get("suites", []) or []:
                walk_suite(child, current_title)

        for s in suites:
            walk_suite(s)

        total = len(test_cases)
        failed = sum(1 for t in test_cases if len(t.get("errors", [])) > 0)
        passed = total - failed
        skipped = sum(1 for t in test_cases if t["status"] == "skipped")
        timed_out = sum(1 for t in test_cases if t["status"] == "timedout")

        playwright_stats = data.get("stats", {})
        actual_duration = playwright_stats.get("duration")

        if actual_duration is None:
            actual_duration = sum(t["duration_ms"] for t in test_cases)

        summary["stats"] = {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "timed_out": timed_out,
            "duration_ms": int(actual_duration),
        }
        summary["test_cases"] = test_cases
        summary["raw_report_path"] = str(json_report_path)
        return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run generated Playwright specs and export summary report.")
    parser.add_argument("--specs-dir", default="backend/ai_engine/coder_outputs", help="Directory containing *.spec.ts files")
    parser.add_argument("--report-file", default="backend/ai_engine/runner_outputs/test_report.json", help="Output report file path")
    parser.add_argument("--working-dir", default=".", help="Working directory where Playwright command will run")
    parser.add_argument("--base-url", default=None, help="Optional BASE_URL for test runtime")
    args = parser.parse_args()

    runner = Runner()
    summary = runner.run_specs(
        specs_dir=Path(args.specs_dir),
        report_file=Path(args.report_file),
        working_dir=Path(args.working_dir),
        base_url=args.base_url,
    )
    print(
        f"Runner completed: status={summary['status']}, "
        f"total={summary['stats']['total']}, passed={summary['stats']['passed']}, failed={summary['stats']['failed']}"
    )


if __name__ == "__main__":
    main()
