from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Literal, Optional, Tuple

import frontmatter
from dotenv import load_dotenv
# from openrouter import OpenRouter
import lmstudio as lms
from pydantic import BaseModel, Field

load_dotenv()

Priority = Literal["P0", "P1", "P2"]
TestScope = Literal[
    "UI Testing",
    "Functional Testing",
    "Performance Testing",
    "Responsive Testing",
    "Compatibility Testing",
    "Security Testing",
    "API Testing",
    "Navigation Testing",
    "Integration Testing",
]


class MockStrategy(BaseModel):
    type: Literal["none", "route_intercept", "service_stub", "hybrid"] = "none"
    targets: List[str] = Field(default_factory=list)
    notes: str = ""


class PassFailCriteria(BaseModel):
    pass_when: List[str] = Field(default_factory=list)
    fail_when: List[str] = Field(default_factory=list)


class PlannedTestCase(BaseModel):
    case_id: str
    title: str
    priority: Priority
    scope: TestScope
    objective: str
    preconditions: List[str] = Field(default_factory=list)
    test_data: Dict[str, Any] = Field(default_factory=dict)
    steps: List[str] = Field(default_factory=list)
    mock_strategy: MockStrategy = Field(default_factory=MockStrategy)
    criteria: PassFailCriteria = Field(default_factory=PassFailCriteria)


class PlannerOutput(BaseModel):
    planner_version: str = "1.3"
    component_name: str
    module_type: str
    impact_level: str
    should_generate_plan: bool = True
    skip_reason: str = ""
    requested_test_types: List[TestScope] = Field(default_factory=list)
    skipped_test_types: List[TestScope] = Field(default_factory=list)
    generation_notes: List[str] = Field(default_factory=list)
    test_cases: List[PlannedTestCase] = Field(default_factory=list)


class Planner:
    def __init__(self, setting: str = "backend/ai_engine/settings_agent/Planner.md"):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key is None:
            raise ValueError("API key is not found. Please import API key in file .env")

        try:
            with open(setting, "r", encoding="utf-8") as f:
                settings = frontmatter.load(f)
        except Exception as exc:
            raise FileNotFoundError("File setting is not found. Please add file setting for PlannerAgent.") from exc

        self.model = lms.llm(settings.get("model"))
        self.system_prompt = settings.content

    def _resolve_applicable_types(
        self,
        analyzer_output: Dict[str, Any],
        requested_test_types: Optional[List[TestScope]],
    ) -> Tuple[List[TestScope], List[TestScope], List[str]]:
        module_type = str(analyzer_output.get("module_type", "")).upper()
        interactive_elements = analyzer_output.get("interactive_elements", []) or []
        endpoints = analyzer_output.get("extracted_endpoints", []) or []

        requested = requested_test_types or []
        if not requested:
            requested = ["UI Testing", "Functional Testing"] if module_type == "UI" else ["API Testing", "Integration Testing"]

        capabilities: Dict[TestScope, bool] = {
            "UI Testing": module_type == "UI" and len(interactive_elements) > 0,
            "Functional Testing": module_type == "UI" or len(endpoints) > 0,
            "Performance Testing": True,
            "Responsive Testing": module_type == "UI",
            "Compatibility Testing": module_type == "UI",
            "Security Testing": len(endpoints) > 0 or module_type != "UI",
            "API Testing": len(endpoints) > 0 or module_type != "UI",
            "Navigation Testing": module_type == "UI" and len(interactive_elements) > 0,
            "Integration Testing": len(endpoints) > 0,
        }

        applicable: List[TestScope] = []
        skipped: List[TestScope] = []
        notes: List[str] = []

        for t in requested:
            if capabilities.get(t, False):
                applicable.append(t)
            else:
                skipped.append(t)
                notes.append(f"Skipped {t}: not applicable for current metadata.")

        return applicable, skipped, notes



    @staticmethod
    def _extract_json_object(raw_text: str) -> str:
        text = (raw_text or "").strip()
        if not text:
            return text
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]
        return text

    def _request_plan_from_llm(self, user_prompt: str) -> str:
        # with OpenRouter(api_key=self.api_key) as client:
        #     response = client.chat.send(
        #         model=self.model,
        #         messages=[
        #             {"role": "system", "content": self.system_prompt},
        #             {"role": "user", "content": user_prompt},
        #         ],
        #         temperature=self.temperature,
        #         max_tokens=self.max_tokens,
        #         response_format={
        #             "type": "json_schema",
        #             "json_schema": {
        #                 "name": "planner_output",
        #                 "schema_": PlannerOutput.model_json_schema(),
        #             },
        #         },
        #     )
        response = self.model.respond({"messages": [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ]}, response_format=PlannerOutput)
        content = response.content

        return content

    def _parse_or_repair_output(self, content: str) -> PlannerOutput:
        candidate = self._extract_json_object(content)
        try:
            return PlannerOutput.model_validate_json(candidate)
        except Exception as first_error:
            # Retry once with a strict JSON-fix prompt.
            repair_prompt = (
                "Fix this invalid/truncated JSON and return ONLY valid JSON that matches schema.\n"
                f"Broken JSON:\n{candidate}"
            )
            repaired = self._request_plan_from_llm(repair_prompt)
            repaired_candidate = self._extract_json_object(repaired)
            try:
                return PlannerOutput.model_validate_json(repaired_candidate)
            except Exception as second_error:
                raise ValueError(
                    "Planner received invalid JSON from LLM after one repair retry. "
                    f"First parse error: {first_error}; Second parse error: {second_error}"
                ) from second_error

    def _build_skip_output(
        self,
        analyzer_output: Dict[str, Any],
        requested_types: List[TestScope],
        skipped_types: List[TestScope],
        notes: List[str],
    ) -> PlannerOutput:
        component_name = analyzer_output.get("component_name", "UnknownComponent")
        module_type = analyzer_output.get("module_type", "Unknown")
        impact_level = analyzer_output.get("impact_level", "unknown")
        reason = "No applicable test types for this file with current user selection."

        return PlannerOutput(
            component_name=component_name,
            module_type=module_type,
            impact_level=impact_level,
            should_generate_plan=False,
            skip_reason=reason,
            requested_test_types=requested_types,
            skipped_test_types=skipped_types,
            generation_notes=[*notes, reason],
            test_cases=[],
        )

    def build_plan(
        self,
        analyzer_output: Dict[str, Any],
        requested_test_types: Optional[List[TestScope]] = None,
    ) -> PlannerOutput:
        applicable_types, skipped_types, applicability_notes = self._resolve_applicable_types(
            analyzer_output,
            requested_test_types,
        )

        original_requested = requested_test_types or []
        if not applicable_types:
            return self._build_skip_output(
                analyzer_output=analyzer_output,
                requested_types=original_requested,
                skipped_types=skipped_types,
                notes=applicability_notes,
            )

        payload: Dict[str, Any] = {
            "analyzer_output": analyzer_output,
            "requested_test_types": applicable_types,
            "original_requested_test_types": original_requested,
            "skipped_test_types": skipped_types,
            "applicability_notes": applicability_notes,
        }
        metadata_json = json.dumps(payload, ensure_ascii=False, indent=2)
        user_prompt = f"Analyzer metadata JSON:\n{metadata_json}"

        content = self._request_plan_from_llm(user_prompt)
        output = self._parse_or_repair_output(content)

        output.should_generate_plan = True
        output.skip_reason = ""
        output.requested_test_types = applicable_types
        output.skipped_test_types = skipped_types
        output.generation_notes = [*applicability_notes, *output.generation_notes]
        return output


if __name__ == "__main__":
    # sample = {
    #     "component_name": "ChatBubble",
    #     "module_type": "UI",
    #     "impact_level": "high",
    #     "interactive_elements": [
    #         {
    #             "element_type": "button",
    #             "selector": "button.btn.btn-sm.btn-outline-secondary",
    #             "purpose": "toggle chat panel visibility",
    #         }
    #     ],
    #     "extracted_endpoints": [],
    #     "dependencies": ["react", "../api/chatApi"],
    #     "has_conditional_rendering": True,
    # }
    sample = {
    "component_name": "productApi",
    "module_type": "API",
    "impact_level": "NONE",
    "interactive_elements": [],
    "extracted_endpoints": [],
    "dependencies": [
        "axios"
    ],
    "has_conditional_rendering": False
}

    planner = Planner()
    result = planner.build_plan(sample, requested_test_types=["UI Testing", "API Testing", "Navigation Testing"])
    print(result.model_dump_json(indent=2, ensure_ascii=False))
