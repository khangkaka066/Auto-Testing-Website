from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Literal

import frontmatter
# import lmstudio as lms
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

class Issue(BaseModel):
    page: str = Field(description="Đường dẫn hoặc tên component bị lỗi")
    error: str = Field(description="Mô tả ngắn gọn lỗi")
    severity: Literal["Critical", "High", "Medium", "Low"] = Field(description="Mức độ nghiêm trọng")

class ReportSummary(BaseModel):
    passed: int
    failed: int
    total: int
    duration: str

class ReporterOutput(BaseModel):
    health_score: str = Field(description="Điểm đánh giá, ví dụ: '82/100'")
    summary: ReportSummary
    issues: List[Issue] = Field(default_factory=list)

class Reporter:
    def __init__(self, setting: str = "backend/ai_engine/system_prompt/Reporter.md"):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")

        with open(setting, "r", encoding="utf-8") as f:
            settings = frontmatter.load(f)
        self.model = settings.get("model")
        self.client = OpenAI(api_key=self.api_key)
        self.system_prompt = settings.content

    @staticmethod
    def _extract_json_object(raw_text: str) -> str:
        text = (raw_text or "").strip()
        if not text: return text
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]
        return text

    def optimize_report_for_llm(self, raw_report):
        # 1. Regex để xóa toàn bộ mã màu ANSI (\x1b...)
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        
        optimized_data = {
            "summary": raw_report.get("stats", {}),
            "failed_tests": []
        }
        
        # Dùng set hoặc dict để loại bỏ các test bị lặp lại (do chạy nhiều trình duyệt/retry)
        seen_tests = set()
        
        for tc in raw_report.get("test_cases", []):
            title = tc.get("title", "").split(" > ")[-1] # Chỉ lấy tên test case cuối cùng cho ngắn gọn
            errors = tc.get("errors", [])
            
            # 2. CHỈ đưa vào LLM những test case CÓ LỖI
            if errors and title not in seen_tests:
                seen_tests.add(title)
                
                # Làm sạch chuỗi lỗi
                clean_error = ansi_escape.sub('', errors[0])
                
                # 3. Rút gọn Error (Chỉ lấy phần cốt lõi, bỏ phần Call log dài dòng)
                error_lines = clean_error.split('\n')
                core_error = []
                for line in error_lines:
                    if "Call log:" in line: # Bỏ qua toàn bộ stack trace call log phía dưới
                        break
                    if line.strip() and "Error: expect" not in line: # Bỏ dòng title error rối rắm
                        core_error.append(line.strip())
                
                optimized_data["failed_tests"].append({
                    "title": title,
                    "error_summary": "\n".join(core_error)
                })
                
        return optimized_data

    def generate_report(self, executor_json_path: str) -> ReporterOutput:
        with open(executor_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        data = self.optimize_report_for_llm(data)

        prompt = f"\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        
        # response = self.model.respond(
        #     {
        #         "messages": [
        #             {"role": "system", "content": self.system_prompt},
        #             {"role": "user", "content": prompt},
        #         ]
        #     },
        #     response_format=ReporterOutput,
        # )
        response = self.client.responses.parse(
            model=self.model,
            input=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            text_format=ReporterOutput
        )
        
        try:
            return response.output_parsed
        except Exception as e:
            print(f"Lỗi parse JSON Reporter: {e}")
            return ReporterOutput(
                health_score="0/100",
                summary=ReportSummary(passed=0, failed=0, total=0, duration="0s"),
                issues=[]
            )
