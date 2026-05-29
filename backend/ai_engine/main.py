from __future__ import annotations

import json
import os
import re
import shutil
import sys
import threading
import traceback
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
AI_ENGINE_DIR = BACKEND_DIR / "ai_engine"
UI_TESTING_DIR = AI_ENGINE_DIR / "UITesting"

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR / "api_node" / ".env")

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
            "progress_percent": 10,
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


def public_job_response(job: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "success": bool(job.get("success", False)),
        "data": job,
    }


def safe_name(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "_", value).strip("._-")
    return cleaned or fallback


def ensure_safe_zip_member(member_name: str, extract_root: Path) -> Path:
    member_path = Path(member_name)
    if member_path.is_absolute() or ".." in member_path.parts:
        raise HTTPException(status_code=400, detail=f"File zip chứa đường dẫn không hợp lệ: {member_name}")

    destination = (extract_root / member_path).resolve()
    if not destination.is_relative_to(extract_root.resolve()):
        raise HTTPException(status_code=400, detail=f"File zip chứa đường dẫn không hợp lệ: {member_name}")
    return destination


def extract_zip_safely(zip_path: Path, extract_root: Path) -> int:
    try:
        with zipfile.ZipFile(zip_path) as archive:
            members = [member for member in archive.infolist() if member.filename and not member.is_dir()]
            for member in members:
                ensure_safe_zip_member(member.filename, extract_root)
            archive.extractall(extract_root)
            return len(members)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="File upload không phải zip hợp lệ")


async def save_upload_file(upload: UploadFile, target_path: Path, max_bytes: int = 200 * 1024 * 1024) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    with open(target_path, "wb") as output:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise HTTPException(status_code=413, detail="File zip vượt quá giới hạn 200MB")
            output.write(chunk)


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


def run_pipeline_job(job_id: str, payload: RunTestRequest, source_path: Path) -> None:
    jobs.update(
        job_id,
        status="running",
        progress_percent=40,
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
            progress_percent=100,
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
            progress_percent=100,
            message="AI pipeline chạy thất bại",
            finished_at=JobStore._now(),
            error=error,
        )


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "TestPilot AI Engine is running"}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/run-test")
def run_test(payload: RunTestRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    source_path = resolve_source_path(payload.source_path)
    job = jobs.create(payload, source_path)
    background_tasks.add_task(run_pipeline_job, job["job_id"], payload, source_path)
    return public_job_response(job)


@app.post("/api/run-test/upload")
async def run_uploaded_test(
    background_tasks: BackgroundTasks,
    user_id: str = Form(..., min_length=1),
    project_id: str = Form(..., min_length=1),
    base_url: Optional[str] = Form(None),
    sourceZip: UploadFile = File(...),
) -> Dict[str, Any]:
    filename = sourceZip.filename or "source.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Vui lòng upload file source code dạng .zip")

    safe_user_id = safe_name(user_id, "user")
    safe_project_id = safe_name(project_id, "project")
    upload_root = Path(os.getenv("SOURCE_WORKSPACE_BASE_PATH", "uploaded_sources"))
    archive_root = Path(os.getenv("UPLOAD_ARCHIVE_BASE_PATH", "uploaded_archives"))
    run_suffix = uuid4().hex[:12]
    source_path = upload_root / safe_user_id / safe_project_id / f"source_{run_suffix}"
    archive_path = archive_root / safe_user_id / safe_project_id / f"{run_suffix}-{safe_name(filename, 'source.zip')}"

    try:
        await save_upload_file(sourceZip, archive_path)
        source_path.mkdir(parents=True, exist_ok=True)
        extracted_count = extract_zip_safely(archive_path, source_path)
    except Exception:
        shutil.rmtree(source_path, ignore_errors=True)
        archive_path.unlink(missing_ok=True)
        raise

    payload = RunTestRequest(
        user_id=user_id,
        project_id=project_id,
        source_path=str(source_path),
        base_url=base_url,
    )
    job = jobs.create(payload, source_path.resolve())
    jobs.update(job["job_id"], extracted_count=extracted_count, source_archive_path=str(archive_path))
    job = jobs.get_by_project(project_id) or job
    background_tasks.add_task(run_pipeline_job, job["job_id"], payload, source_path.resolve())
    return public_job_response(job)


@app.get("/api/run-test/{project_id}")
def get_run_test(project_id: str) -> Dict[str, Any]:
    job = jobs.get_by_project(project_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job test cho project_id này")
    return public_job_response(job)
