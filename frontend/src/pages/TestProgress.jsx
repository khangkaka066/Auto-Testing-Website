import React, { useEffect, useMemo, useState } from "react";
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

export default function TestProgress() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
    progress_percent: 10,
    project_id: projectId,
    source_path: location.state?.sourcePath || latestProgress.sourcePath || "",
  });

  const meta = useMemo(() => STATUS_META[runState.status] || STATUS_META.queued, [runState.status]);
  const StatusIcon = meta.icon;
  const progressPercent = Math.max(0, Math.min(100, runState.progress_percent || 0));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to view test progress");
      navigate("/login");
      return undefined;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/test/run/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted || !res.data.success) return;
        const data = res.data.data;
        setRunState(data);

        // Lưu kết quả vào localStorage khi pipeline hoàn thành
        if (data.status === "completed" && data.result?.final_report) {
          const report = data.result.final_report;
          localStorage.setItem("last_test_result", JSON.stringify({
            project_id:   data.project_id,
            run_id:       data.run_id,
            finished_at:  data.finished_at,
            health_score: report.health_score,
            summary:      report.summary,
            issues:       report.issues || [],
          }));
        }
      } catch (err) {
        if (!isMounted) return;
        setRunState((current) => ({
          ...current,
          status: "failed",
          message: err.response?.data?.message || "Failed to load pipeline status.",
        }));
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 2000);

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
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  runState.status === "failed" ? "bg-red-500" : "bg-orange-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-sm text-slate-500">
              <span>{runState.message}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-700 mb-1">Stage</p>
              <p className="font-mono text-xs text-slate-500 break-all">{runState.stage || "-"}</p>
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

          {isFinished ? (
            <div className="mt-8 flex justify-end">
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
