import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileWarning,
  XCircle,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import { toast } from "sonner";

function parseScore(value) {
  if (typeof value === "number") return Math.max(0, Math.min(100, value));
  const match = String(value || "").match(/\d+/);
  return match ? Math.max(0, Math.min(100, Number(match[0]))) : 0;
}

function scoreColors(score) {
  if (score <= 25) return {
    text: "text-red-600",
    stroke: "#dc2626",
    bg: "bg-red-50",
    border: "border-red-100",
  };
  if (score <= 50) return {
    text: "text-orange-600",
    stroke: "#ea580c",
    bg: "bg-orange-50",
    border: "border-orange-100",
  };
  if (score <= 75) return {
    text: "text-lime-600",
    stroke: "#65a30d",
    bg: "bg-lime-50",
    border: "border-lime-100",
  };
  return {
    text: "text-emerald-700",
    stroke: "#047857",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  };
}

function severityTone(severity) {
  const value = String(severity || "").toLowerCase();
  if (value.includes("critical")) return "bg-red-100 text-red-700 border-red-200";
  if (value.includes("high")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (value.includes("medium")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function loadLocalReport(projectId) {
  try {
    const saved = JSON.parse(localStorage.getItem("last_test_result") || "null");
    if (!saved) return null;
    const ids = [saved.project_id, saved.job_id, saved.run_id].filter(Boolean).map(String);
    if (projectId && ids.length > 0 && !ids.includes(String(projectId))) return null;
    return {
      project_id: saved.project_id,
      run_id: saved.run_id,
      finished_at: saved.finished_at,
      result: {
        final_report: {
          health_score: saved.health_score,
          summary: saved.summary,
          issues: saved.issues || [],
        },
      },
    };
  } catch {
    return null;
  }
}

function normalizeResultSummary(item) {
  const s = item?.result_summary;
  if (!s || s.job_state) return null;
  return {
    health_score: s.health_score ?? item.score ?? null,
    summary: {
      passed: s.passed ?? 0,
      failed: s.failed ?? 0,
      total: s.total ?? 0,
      duration: s.duration ?? null,
    },
    issues: s.issues || [],
  };
}

function reportFromHistoryItem(item) {
  const finalReport = normalizeResultSummary(item);
  if (!finalReport) return null;
  return {
    project_id: item.project_id,
    job_id: item.job_id,
    finished_at: item.end_time,
    result: { final_report: finalReport },
  };
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ScoreRing({ score }) {
  const colors = scoreColors(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative h-36 w-36 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="relative text-center">
        <p className={`text-4xl font-black tabular-nums ${colors.text}`}>{score}</p>
        <p className="text-xs font-semibold text-slate-500">/100</p>
      </div>
    </div>
  );
}

export default function TestReport() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(() => loadLocalReport(projectId));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to view the report");
      navigate("/login");
      return undefined;
    }

    let isMounted = true;

    const fetchReport = async () => {
      let nextRun = null;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/test/run/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted || !res.data.success) return;
        nextRun = res.data.data;
        setRun(nextRun);
      } catch (err) {
        const fallback = loadLocalReport(projectId);
        if (fallback) {
          nextRun = fallback;
          setRun(fallback);
        } else {
          toast.error(err.response?.data?.message || "Failed to load test report");
        }
      }

      try {
        if (!isMounted) return;
        const currentReport = nextRun?.result?.final_report;
        if (currentReport?.health_score || currentReport?.summary?.total) return;
        const res = await axios.get(`${API_BASE_URL}/api/test/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted || !res.data.success) return;
        const item = (res.data.data || []).find((entry) => String(entry.project_id) === String(projectId));
        const fromHistory = reportFromHistoryItem(item);
        if (fromHistory) setRun(fromHistory);
      } catch (err) {
        const fallback = loadLocalReport(projectId);
        if (fallback) setRun(fallback);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [projectId, navigate]);

  const report = run?.result?.final_report || {};
  const score = useMemo(() => parseScore(report.health_score), [report.health_score]);
  const summary = report.summary || {};
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const finishedAt = run?.finished_at || run?.result?.finished_at;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </button>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 text-left">
            Loading report...
          </div>
        ) : !report.health_score && !summary.total && issues.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-left">
            <h1 className="text-2xl font-bold text-slate-900">Report is not available</h1>
            <p className="mt-2 text-slate-500">The test run has not produced a final report yet.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-left">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Final test report</p>
                <h1 className="mt-2 text-3xl font-bold font-display tracking-tight text-slate-900">
                  Test Result
                </h1>
                <p className="mt-2 text-sm text-slate-500 break-all">
                  {run?.project_id || projectId}
                </p>
              </div>
              <ScoreRing score={score} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <Clock3 className="h-5 w-5 text-blue-600 mb-2" />
                <p className="text-lg font-bold text-slate-900">{summary.duration || "-"}</p>
                <p className="text-sm text-slate-500">Execution time</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-2" />
                <p className="text-2xl font-bold text-slate-900">{summary.passed ?? 0}</p>
                <p className="text-sm text-slate-500">Passed</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <XCircle className="h-5 w-5 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-slate-900">{summary.failed ?? 0}</p>
                <p className="text-sm text-slate-500">Failed</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <AlertTriangle className="h-5 w-5 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-slate-900">{summary.total ?? 0}</p>
                <p className="text-sm text-slate-500">Total tests</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-left">
              <p className="text-sm font-medium text-slate-500">Finished at</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(finishedAt)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 text-left">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Detected issues</h2>
                  <p className="text-sm text-slate-500">{issues.length} issue(s)</p>
                </div>
                <FileWarning className="h-5 w-5 text-orange-500" />
              </div>

              {issues.length > 0 ? (
                <div className="space-y-3">
                  {issues.map((issue, index) => {
                    const file = issue.file || issue.file_path || issue.source_file || issue.page || "Unknown file";
                    const title = issue.title || issue.page || `Issue ${index + 1}`;
                    return (
                      <div key={`${file}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{title}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500 break-all">{file}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${severityTone(issue.severity)}`}>
                            {issue.severity || "Info"}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {issue.error || issue.message || "No error details were provided."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  No issues were reported in the final result.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
