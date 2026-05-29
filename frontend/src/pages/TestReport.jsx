import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import { toast } from "sonner";

function parseScore(value) {
  if (typeof value === "number") return value;
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function scoreTone(score) {
  if (score <= 25) return "text-red-600 border-red-200 bg-red-50";
  if (score <= 50) return "text-orange-600 border-orange-200 bg-orange-50";
  if (score <= 75) return "text-lime-600 border-lime-200 bg-lime-50";
  return "text-emerald-700 border-emerald-200 bg-emerald-50";
}

function severityTone(severity) {
  const normalized = String(severity || "").toLowerCase();
  if (normalized.includes("critical")) return "bg-red-100 text-red-700";
  if (normalized.includes("high")) return "bg-orange-100 text-orange-700";
  if (normalized.includes("medium")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function TestReport() {
  const { historyId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem báo cáo");
      navigate("/login");
      return;
    }

    axios
      .get(`http://localhost:5000/api/test/report/${historyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) setPayload(res.data.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Không thể tải báo cáo"))
      .finally(() => setLoading(false));
  }, [historyId, navigate]);

  const report = payload?.report || {};
  const history = payload?.history || {};
  const score = useMemo(() => parseScore(report.health_score || history.health_score), [report.health_score, history.health_score]);
  const summary = report.summary || {};
  const issues = Array.isArray(report.issues) ? report.issues : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Workspace
        </button>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500">Đang tải báo cáo...</div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between text-left">
              <div>
                <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
                  Báo cáo kết quả Test
                </h1>
                <p className="text-slate-500 mt-2">{history.source_name || history.project_id}</p>
              </div>
              <div className={`h-28 w-28 rounded-full border-8 flex flex-col items-center justify-center ${scoreTone(score)}`}>
                <span className="text-3xl font-black tabular-nums">{score}</span>
                <span className="text-xs font-semibold">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-2" />
                <p className="text-2xl font-bold">{summary.passed ?? 0}</p>
                <p className="text-sm text-slate-500">Passed</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <XCircle className="h-5 w-5 text-red-600 mb-2" />
                <p className="text-2xl font-bold">{summary.failed ?? 0}</p>
                <p className="text-sm text-slate-500">Failed</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <AlertTriangle className="h-5 w-5 text-orange-600 mb-2" />
                <p className="text-2xl font-bold">{summary.total ?? 0}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-left">
                <Clock className="h-5 w-5 text-blue-600 mb-2" />
                <p className="text-lg font-bold">{summary.duration || "-"}</p>
                <p className="text-sm text-slate-500">Duration</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 text-left">
              <h2 className="text-xl font-bold mb-4">Vấn đề phát hiện</h2>
              <div className="space-y-3">
                {issues.length > 0 ? issues.map((issue, index) => (
                  <div key={`${issue.page}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{issue.page || `Issue ${index + 1}`}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${severityTone(issue.severity)}`}>
                        {issue.severity || "Info"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{issue.error || issue.message || "-"}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Không có issue trong báo cáo.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
