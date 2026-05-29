from __future__ import annotations

import json
import os
import sys
import threading
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
AI_ENGINE_DIR = BACKEND_DIR / "ai_engine"
UI_TESTING_DIR = AI_ENGINE_DIR / "UITesting"

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(AI_ENGINE_DIR / ".env", override=True)

if str(UI_TESTING_DIR) not in sys.path:
    sys.path.insert(0, str(UI_TESTING_DIR))
if str(AI_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_ENGINE_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


class RunTestRequest(BaseModel):
    user_id: str = Field(min_length=1)
    project_id: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    base_url: Optional[str] = None


class JobStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._latest_by_project: Dict[str, str] = {}

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create(self, payload: RunTestRequest, source_path: Path) -> Dict[str, Any]:
        job_id = str(uuid4())
        job = {
            "success": True,
            "job_id": job_id,
            "run_id": None,
            "status": "queued",
            "message": "AI pipeline đã được đưa vào hàng đợi",
            "user_id": payload.user_id,
            "project_id": payload.project_id,
            "source_path": str(source_path),
            "base_url": payload.base_url,
            "created_at": self._now(),
            "started_at": None,
            "finished_at": None,
            "result": None,
            "error": None,
        }
        with self._lock:
            self._jobs[job_id] = job
            self._latest_by_project[payload.project_id] = job_id
        return job.copy()

    def update(self, job_id: str, **changes: Any) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(changes)

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.copy() if job else None

    def get_by_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job_id = self._latest_by_project.get(project_id)
            if not job_id:
                return None
            job = self._jobs.get(job_id)
            return job.copy() if job else None


jobs = JobStore()
app = FastAPI(title="TestPilot AI Engine", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if cors_origins == "*" else [origin.strip() for origin in cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def resolve_source_path(source_path: str) -> Path:
    candidate = Path(source_path).expanduser()
    if not candidate.is_absolute():
        candidate = ROOT_DIR / candidate

    resolved = candidate.resolve()
    if not resolved.exists() or not resolved.is_dir():
        raise HTTPException(status_code=400, detail=f"source_path không tồn tại hoặc không phải thư mục: {source_path}")
    return resolved


def load_final_report(run_workspace_dir: str) -> Dict[str, Any]:
    final_report_path = Path(run_workspace_dir) / "7_reporter" / "final_report.json"
    executor_report_path = Path(run_workspace_dir) / "6_executor" / "test_report.json"

    result: Dict[str, Any] = {
        "run_workspace_dir": run_workspace_dir,
        "final_report_path": str(final_report_path) if final_report_path.exists() else None,
        "executor_report_path": str(executor_report_path) if executor_report_path.exists() else None,
        "final_report": None,
    }

    if final_report_path.exists():
        with open(final_report_path, "r", encoding="utf-8") as file:
            result["final_report"] = json.load(file)

    return result


def build_client_state(job: Dict[str, Any]) -> Dict[str, Any]:
    progress_by_status = {
        "queued": 10,
        "running": 50,
        "completed": 100,
        "failed": 100,
    }
    result = job.get("result") or {}
    final_report_path = result.get("final_report_path")
    executor_report_path = result.get("executor_report_path")

    return {
        "success": job.get("success", False),
        "job_id": job.get("job_id"),
        "run_id": job.get("run_id"),
        "status": job.get("status"),
        "message": job.get("message"),
        "progress_percent": progress_by_status.get(job.get("status"), 0),
        "stage": job.get("status"),
        "user_id": job.get("user_id"),
        "project_id": job.get("project_id"),
        "source_path": job.get("source_path"),
        "base_url": job.get("base_url"),
        "run_workspace_dir": job.get("run_workspace_dir"),
        "report_path": final_report_path or executor_report_path,
        "result": result or None,
        "error": job.get("error"),
        "created_at": job.get("created_at"),
        "started_at": job.get("started_at"),
        "finished_at": job.get("finished_at"),
    }


def response_from_job(job: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "success": bool(job.get("success")),
        "message": job.get("message") or "",
        "data": build_client_state(job),
    }


def run_pipeline_job(job_id: str, payload: RunTestRequest, source_path: Path) -> Dict[str, Any]:
    jobs.update(
        job_id,
        status="running",
        message="AI pipeline đang chạy",
        started_at=JobStore._now(),
    )

    try:
        from UITesting.UI_testing import AIPipelineOrchestrator

        base_url = payload.base_url or os.getenv("TARGET_BASE_URL", "http://localhost:5173")
        pipeline = AIPipelineOrchestrator(
            user_id=payload.user_id,
            project_id=payload.project_id,
            source_code_path=str(source_path),
        )
        jobs.update(job_id, run_id=pipeline.run_id, run_workspace_dir=pipeline.run_workspace_dir)

        pipeline.execute_pipeline(base_url=base_url)
        result = load_final_report(pipeline.run_workspace_dir)
        jobs.update(
            job_id,
            status="completed",
            message="AI pipeline đã hoàn tất",
            finished_at=JobStore._now(),
            result=result,
        )
    except Exception as exc:
        error: Dict[str, Any] = {
            "type": exc.__class__.__name__,
            "message": str(exc),
        }
        if os.getenv("AI_DEBUG", "").lower() == "true":
            error["traceback"] = traceback.format_exc()

        jobs.update(
            job_id,
            success=False,
            status="failed",
            message="AI pipeline chạy thất bại",
            finished_at=JobStore._now(),
            error=error,
        )

    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=500, detail="Không thể đọc trạng thái job sau khi chạy pipeline")
    return job


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "TestPilot AI Engine is running"}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/run-test")
def run_test(payload: RunTestRequest) -> Dict[str, Any]:
    source_path = resolve_source_path(payload.source_path)
    job = jobs.create(payload, source_path)
    finished_job = run_pipeline_job(job["job_id"], payload, source_path)
    return response_from_job(finished_job)


@app.get("/api/run-test/{project_id}")
def get_run_test(project_id: str) -> Dict[str, Any]:
    job = jobs.get_by_project(project_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job test cho project_id này")
    return response_from_job(job)
