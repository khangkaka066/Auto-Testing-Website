import React, { useEffect, useMemo, useRef, useState } from "react";
import API_BASE_URL from "../config";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import { toast } from "sonner";

const STATUS_META = {
  queued: {
    label: "Queued",
    icon: Circle,
    tone: "text-slate-500",
  },
  running: {
    label: "Running",
    icon: Loader2,
    tone: "text-orange-600",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "text-emerald-600",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    tone: "text-red-600",
  },
};

const STAGE_LABELS = {
  queued: "Queued",
  initializing: "Initializing",
  detector: "Detector",
  analyzer: "Analyzer",
  planner: "Planner",
  filter: "Filter",
  coder: "Coder",
  validator: "Validator",
  debugger: "Debugger",
  executor: "Executor",
  reporter: "Reporter",
  completed: "Completed",
  failed: "Failed",
};

export default function TestProgress() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const missedStatusPolls = useRef(0);
  const latestProgress = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("latest_test_progress") || "{}");
    } catch {
      return {};
    }
  }, []);
  const [runState, setRunState] = useState({
    status: "queued",
    message: "Initializing test pipeline.",
    stage: "queued",
    sub_progress: null,
    progress_percent: 10,
    project_id: projectId,
    source_path: location.state?.sourcePath || latestProgress.sourcePath || "",
  });

  const meta = useMemo(() => STATUS_META[runState.status] || STATUS_META.queued, [runState.status]);
  const StatusIcon = meta.icon;
  const progressPercent = Math.max(0, Math.min(100, runState.progress_percent || 0));
  const stageLabel = STAGE_LABELS[runState.stage] || runState.stage || "Queued";
  const subProgress = runState.sub_progress;
  const showSubProgress = runState.status === "running" && subProgress && Number(subProgress.total) > 0;
  const failureError = runState.status === "failed" ? runState.error : null;
  const subProgressPercent = showSubProgress
    ? Math.max(0, Math.min(100, subProgress.percent ?? Math.round((subProgress.completed / subProgress.total) * 100)))
    : 0;
  const subProgressCompleted = showSubProgress ? Math.max(0, Number(subProgress.completed) || 0) : 0;
  const subProgressTotal = showSubProgress ? Math.max(0, Number(subProgress.total) || 0) : 0;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to view test progress");
      navigate("/login");
      return undefined;
    }

    let isMounted = true;
    let intervalId;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/test/run/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted || !res.data.success) return;
        missedStatusPolls.current = 0;
        const data = res.data.data;
        setRunState(data);

        // Lưu kết quả vào localStorage khi pipeline hoàn thành
        if (data.status === "completed" && data.result?.final_report) {
          const report = data.result.final_report;
          localStorage.setItem("last_test_result", JSON.stringify({
            project_id:   data.project_id,
            job_id:       data.job_id,
            run_id:       data.run_id,
            finished_at:  data.finished_at,
            health_score: report.health_score,
            summary:      report.summary,
            issues:       report.issues || [],
          }));
        }
      } catch (err) {
        if (!isMounted) return;
        const statusCode = err.response?.status;
        setRunState((current) => {
          const canRetryStatus = current.status === "queued" || current.status === "running";
          if (canRetryStatus && (statusCode === 404 || !err.response)) {
            missedStatusPolls.current += 1;
            if (missedStatusPolls.current < 30) {
              return {
                ...current,
                message: "Reconnecting to the test job status...",
              };
            }
          }

          return {
            ...current,
            status: "failed",
            message: err.response?.data?.message || "Failed to load pipeline status.",
          };
        });
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [navigate, projectId]);

  const isFinished = runState.status === "completed" || runState.status === "failed";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </button>

        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
            Auto Test Progress
          </h1>
          <p className="text-slate-500 mt-2">
            {runState.project_id}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <StatusIcon className={`h-6 w-6 ${meta.tone} ${runState.status === "running" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <h2 className="text-xl font-bold text-slate-900">{meta.label}</h2>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Current stage</p>
                <p className="text-lg font-bold text-slate-900">{stageLabel}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{progressPercent}%</p>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  runState.status === "failed" ? "bg-red-500" : "bg-orange-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {showSubProgress ? (
              <div className="mt-4">
                <div className="mb-2 flex items-end justify-between gap-4 text-sm">
                  <p className="font-semibold text-orange-800">{subProgress.label}</p>
                  <p className="font-bold text-orange-800 tabular-nums">
                    {subProgressCompleted}/{subProgressTotal}
                  </p>
                </div>
                <div className="h-3 w-full rounded-full bg-orange-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${subProgressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex justify-between text-sm text-slate-500">
              <span>{runState.message}</span>
              {!isFinished ? <span className="animate-pulse">Loading...</span> : <span>{meta.label}</span>}
            </div>
          </div>

          {runState.dry_run ? (
            <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
              Running in dry-run mode — no real pipeline has been triggered.
            </div>
          ) : null}

          {runState.report_path ? (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm">
              <p className="font-semibold text-emerald-700 mb-1">Report</p>
              <p className="font-mono text-xs text-emerald-700 break-all">{runState.report_path}</p>
            </div>
          ) : null}

          {failureError ? (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold mb-1">Failure details</p>
              <p className="break-words">
                {failureError.type ? `${failureError.type}: ` : ""}
                {failureError.message || "The pipeline stopped before returning an error message."}
              </p>
            </div>
          ) : null}

          {isFinished ? (
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              {runState.status === "completed" && (runState.job_id || runState.run_id) ? (
                <button
                  onClick={() => navigate(`/test-report/${runState.project_id}`)}
                  className="bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  View report
                </button>
              ) : null}
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Workspace
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
