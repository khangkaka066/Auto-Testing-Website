from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Literal

import frontmatter
import lmstudio as lms
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
    def __init__(self, setting: str = "backend/ai_engine/settings_agent/Reporter.md"):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")

        try:
            with open(setting, "r", encoding="utf-8") as f:
                settings = frontmatter.load(f)
            self.model = lms.llm(settings.get("model"))
            self.system_prompt = settings.content
        except Exception:
            # Fallback nếu không có file setting
            self.model = lms.llm("qwen2.5-coder-7b-instruct")
            self.system_prompt = "Bạn là một AI QC Manager. Hãy phân tích kết quả test từ Playwright và đưa ra báo cáo tổng quan."

    @staticmethod
    def _extract_json_object(raw_text: str) -> str:
        text = (raw_text or "").strip()
        if not text: return text
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]
        return text

    def generate_report(self, executor_json_path: str) -> ReporterOutput:
        with open(executor_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        prompt = f"Phân tích kết quả chạy test sau và xuất báo cáo:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        
        response = self.model.respond(
            {
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt},
                ]
            },
            response_format=ReporterOutput,
        )
        
        content = self._extract_json_object(response.content)
        try:
            return ReporterOutput.model_validate_json(content)
        except Exception as e:
            # Retry hoặc fallback
            print(f"Lỗi parse JSON Reporter: {e}")
            return ReporterOutput(
                health_score="0/100",
                summary=ReportSummary(passed=0, failed=0, total=0, duration="0s"),
                issues=[]
            )
