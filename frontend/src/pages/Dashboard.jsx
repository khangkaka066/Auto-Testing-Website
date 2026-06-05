import React, { useCallback, useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate, Link } from "react-router-dom";
import {
  History, Coins, Activity, FileText,
  BarChart2, CheckCircle2, XCircle, AlertTriangle, Zap,
  UploadCloud, Github as GithubLogo, X, Rocket, GitBranch,
  LayoutDashboard, User, LogOut, Menu, ChevronRight,
  TrendingUp, Clock, Shield, Target, Award, CalendarDays, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/ui/LanguageToggle";
import { dashboardT } from "../i18n/dashboard";

function scoreBadgeVariant(score) {
  if (score === null || score === undefined) return { bar: "bg-slate-200", text: "text-slate-400" };
  if (score <= 25) return { bar: "bg-red-500", text: "text-red-600" };
  if (score <= 50) return { bar: "bg-orange-500", text: "text-orange-600" };
  if (score <= 75) return { bar: "bg-lime-500", text: "text-lime-600" };
  return { bar: "bg-emerald-500", text: "text-emerald-600" };
}

function parseScore(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Math.max(0, Math.min(100, Math.round(value)));
  const match = String(value).match(/\d+/);
  return match ? Math.max(0, Math.min(100, Number(match[0]))) : null;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function normalizeResultSummary(item) {
  const s = item?.result_summary;
  if (!s || s.job_state) return null;
  return {
    health_score: s.health_score ?? item.score ?? null,
    passed: s.passed ?? 0,
    failed: s.failed ?? 0,
    total: s.total ?? 0,
    duration: s.duration ?? null,
    issues_count: s.issues_count ?? (Array.isArray(s.issues) ? s.issues.length : 0),
    issues: s.issues || [],
  };
}

function lastResultFromHistory(item) {
  if (!item) return null;
  const s = normalizeResultSummary(item);
  if (s) {
    return {
      project_id: item.project_id,
      finished_at: item.end_time,
      health_score: s.health_score,
      summary: { passed: s.passed, failed: s.failed, total: s.total, duration: s.duration },
      issues: s.issues || [],
    };
  }
  return null;
}

function lastResultFromRun(data) {
  const report = data?.result?.final_report;
  if (!report) return null;
  return {
    project_id: data.project_id,
    finished_at: data.finished_at,
    health_score: report.health_score,
    summary: report.summary,
    issues: report.issues || [],
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { lang } = useLanguage();
  const t = dashboardT[lang];

  const [user, setUser] = useState({ name: "Developer", email: "" });
  const [avatar, setAvatar] = useState(localStorage.getItem("user_avatar") || "");
  const [initial, setInitial] = useState(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
  const [historyList, setHistoryList] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [uploadMode, setUploadMode] = useState("zip");
  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testType, setTestType] = useState("UI Testing");

  const [githubStatus, setGithubStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const name = localStorage.getItem("user_name") || "Developer";
    setUser({ name, email: "" });
    setAvatar(localStorage.getItem("user_avatar") || "");
    setInitial(name.charAt(0).toUpperCase());

    axios.get(`${API_BASE_URL}/api/test/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.data.success) return;
        const history = res.data.data || [];
        setHistoryList(history);

        const latestCompleted = history.find(item => item.status === "completed" && item.project_id);
        if (!latestCompleted) { setLastResult(null); localStorage.removeItem("last_test_result"); return; }

        // Ưu tiên lấy từ result_summary (persist trong DB), fallback sang job store
        const fromSummary = lastResultFromHistory(latestCompleted);
        if (fromSummary) {
          setLastResult(fromSummary);
          localStorage.setItem("last_test_result", JSON.stringify(fromSummary));
          return;
        }

        try {
          const runRes = await axios.get(`${API_BASE_URL}/api/test/run/${latestCompleted.project_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const nextResult = lastResultFromRun(runRes.data.data);
          setLastResult(nextResult);
          if (nextResult) localStorage.setItem("last_test_result", JSON.stringify(nextResult));
          else localStorage.removeItem("last_test_result");
        } catch {
          setLastResult(null);
          localStorage.removeItem("last_test_result");
        }
      })
      .catch(() => { setLastResult(null); localStorage.removeItem("last_test_result"); });

    axios.get(`${API_BASE_URL}/api/test/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setDashboardStats(res.data.data); })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/auth/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setUsageStats(res.data.data); })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/auth/github/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setGithubStatus(res.data.data); })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghStatus = params.get("github");
    if (ghStatus === "connected") {
      toast.success(`${t.toasts.githubConnected}: @${params.get("login")}`);
      window.history.replaceState({}, "", "/dashboard");
      const token = localStorage.getItem("token");
      if (token) {
        axios.get(`${API_BASE_URL}/api/auth/github/status`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => { if (res.data.success) setGithubStatus(res.data.data); })
          .catch(() => {});
      }
    } else if (ghStatus === "error") {
      toast.error(`${t.toasts.githubFailed}: ${params.get("reason") || "unknown error"}`);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [t.toasts.githubConnected, t.toasts.githubFailed]);

  const connectGithub = () => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_BASE_URL}/api/auth/github/connect?_token=${token}`;
  };

  const loadRepos = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoadingRepos(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/github/repos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setRepos(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) { setGithubStatus({ connected: false }); toast.error(t.toasts.githubExpired); }
    } finally { setLoadingRepos(false); }
  }, [t.toasts.githubExpired]);

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setSelectedBranch(repo.default_branch || "main");
    setBranches([]);
    const token = localStorage.getItem("token");
    try {
      const [owner, name] = repo.full_name.split("/");
      const res = await axios.get(`${API_BASE_URL}/api/auth/github/repos/${owner}/${name}/branches`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setBranches(res.data.data);
    } catch {}
  };

  useEffect(() => {
    if (uploadMode === "github" && githubStatus?.connected && repos.length === 0) loadRepos();
  }, [uploadMode, githubStatus?.connected, repos.length, loadRepos]);

  const selectZip = (file) => {
    if (!file?.name.toLowerCase().endsWith(".zip")) { toast.error(t.toasts.selectZip); return; }
    setZipFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) selectZip(e.dataTransfer.files[0]);
  };

  const handleStartTest = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    if (uploadMode === "zip" && !zipFile) { toast.error(t.toasts.selectZipFirst); return; }
    if (uploadMode === "github" && !selectedRepo) { toast.error(t.toasts.selectRepo); return; }

    setIsTesting(true);
    try {
      if (uploadMode === "zip") {
        const form = new FormData();
        form.append("sourceZip", zipFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/test/upload-source`, form, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const src = uploadRes.data.data;
        const runRes = await axios.post(`${API_BASE_URL}/api/test/run`, {
          user_id: src.user_id,
          project_id: src.project_id,
          source_path: src.source_path,
          source_archive_path: src.source_archive_path,
          source_name: src.project_name,
          test_type: testType,
        }, { headers: { Authorization: `Bearer ${token}` } });
        const projectId = runRes.data.data.project_id;
        toast.success(t.toasts.pipelineStarted);
        sessionStorage.setItem("latest_test_progress", JSON.stringify({ projectId, sourcePath: src.source_path }));
        navigate(`/test-progress/${projectId}`, { replace: true, state: { projectId, sourcePath: src.source_path } });
      } else {
        const runRes = await axios.post(`${API_BASE_URL}/api/test/run-github`, {
          repo_full_name: selectedRepo.full_name,
          branch: selectedBranch || selectedRepo.default_branch || "main",
          test_type: testType,
        }, { headers: { Authorization: `Bearer ${token}` } });
        const projectId = runRes.data.data.project_id;
        toast.success(`Cloning ${selectedRepo.full_name} — ${t.toasts.cloningStarted}`);
        sessionStorage.setItem("latest_test_progress", JSON.stringify({ projectId }));
        navigate(`/test-progress/${projectId}`, { replace: true, state: { projectId } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t.toasts.startFailed);
      setIsTesting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_avatar");
    localStorage.removeItem("user_name");
    toast.success(t.nav.loggedOut);
    navigate("/");
  };

  const ds = dashboardStats;

  const statCards = [
    {
      icon: Activity, iconBg: "bg-blue-100", iconColor: "text-blue-600",
      label: t.stats.totalTests, value: ds ? ds.total_tests : historyList.length,
      sub: ds ? `${ds.completed_tests} ${t.stats.completed}` : "—",
      accent: "border-l-blue-500",
    },
    {
      icon: Target, iconBg: "bg-orange-100", iconColor: "text-orange-600",
      label: t.stats.successRate, value: ds ? `${ds.success_rate}%` : "—",
      sub: ds ? `${ds.failed_tests} ${t.stats.failed}` : t.stats.loading,
      accent: "border-l-orange-500",
    },
    {
      icon: TrendingUp, iconBg: "bg-indigo-100", iconColor: "text-indigo-600",
      label: t.stats.avgScore, value: ds?.avg_score != null ? `${ds.avg_score}/100` : "—",
      sub: ds?.avg_score != null ? (ds.avg_score >= 70 ? t.stats.goodHealth : t.stats.needsReview) : "No data",
      accent: "border-l-indigo-500",
    },
    {
      icon: Award, iconBg: "bg-yellow-100", iconColor: "text-yellow-600",
      label: t.stats.bestScore, value: ds?.best_score != null ? `${ds.best_score}/100` : "—",
      sub: t.stats.allTimeHigh,
      accent: "border-l-yellow-500",
    },
    {
      icon: CalendarDays, iconBg: "bg-teal-100", iconColor: "text-teal-600",
      label: t.stats.thisMonth, value: ds ? ds.tests_this_month : "—",
      sub: ds ? `${ds.tests_this_week} this week` : t.stats.loading,
      accent: "border-l-teal-500",
    },
    {
      icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
      label: t.stats.totalPassed, value: ds ? ds.total_passed.toLocaleString() : "—",
      sub: ds ? `${ds.total_failed} ${t.stats.failed} across all tests` : t.stats.loading,
      accent: "border-l-emerald-500",
    },
    {
      icon: Clock, iconBg: "bg-slate-100", iconColor: "text-slate-600",
      label: t.stats.avgDuration, value: ds?.avg_duration_sec != null ? formatDuration(ds.avg_duration_sec) : "—",
      sub: t.stats.perTestRun,
      accent: "border-l-slate-400",
    },
    {
      icon: Zap, iconBg: "bg-violet-100", iconColor: "text-violet-600",
      label: t.stats.creditsLeft, value: usageStats ? usageStats.credits.toLocaleString() : "—",
      sub: usageStats ? `${usageStats.tokens_used.toLocaleString()} used` : t.stats.loading,
      accent: "border-l-violet-500",
    },
  ];

  const mainRef = useRef(null);

  const scrollToHistory = () => {
    const el = document.getElementById("history");
    if (el && mainRef.current) {
      mainRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    }
  };


  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="h-16 flex items-center px-4 border-b border-slate-700/60 gap-3 overflow-hidden">
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo.png" alt="TestPilot" className="h-8 w-8 rounded-md group-hover:scale-105 transition-transform shrink-0" />
            {sidebarOpen && (
              <span className="font-bold text-white text-base tracking-tight group-hover:text-orange-400 transition-colors whitespace-nowrap">
                TestPilot
              </span>
            )}
          </a>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarOpen && <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Main Menu</p>}

          {/* Dashboard */}
          <Link to="/dashboard"
            className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150 bg-orange-600 text-white shadow-sm shadow-orange-900/30 ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">{t.nav.dashboard}</span>}
            {sidebarOpen && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
          </Link>

          {/* Test History */}
          <div
            onClick={scrollToHistory}
            className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 cursor-pointer ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}
          >
            <History className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">{t.nav.testHistory}</span>}
            {sidebarOpen && historyList.length > 0 && (
              <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                {historyList.length}
              </span>
            )}
          </div>

          {/* Profile */}
          <Link to="/profile"
            className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}
          >
            <User className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">{t.nav.profile}</span>}
          </Link>

          {/* Billing */}
          <Link to="/billing"
            className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">{t.nav.billing}</span>}
            {sidebarOpen && usageStats && usageStats.credits < 100_000 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">Low</span>
            )}
          </Link>

        </nav>

        <div className="p-3 border-t border-slate-700/60">
          {sidebarOpen && (
            <div className="mb-2 flex justify-center">
              <LanguageToggle className="border-slate-700 bg-slate-800" />
            </div>
          )}
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{t.nav.freePlan}</p>
              </div>
              <button onClick={handleLogout} title={t.nav.signOut} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-md hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">{t.welcome}, {user.name}!</h1>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {githubStatus?.connected && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-full">
                <GithubLogo className="h-3.5 w-3.5" />
                <span>@{githubStatus.login}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
            )}
            <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
              <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user.name}</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6">

          {/* Low credits warning */}
          {usageStats && usageStats.credits < 100_000 && (
            <div className="mb-5 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-orange-800">{t.credits.warning} — {usageStats.credits.toLocaleString()} {t.credits.remaining}</p>
                <p className="text-xs text-orange-600 mt-0.5">{t.credits.hint}</p>
              </div>
              <Link to="/billing"
                className="shrink-0 flex items-center gap-1.5 bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" /> {t.credits.topUp}
              </Link>
            </div>
          )}

          {/* ── Stats grid (8 cards, 4 per row) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ icon: Icon, iconBg, iconColor, label, value, sub, accent }) => (
              <div key={label} className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 border-l-4 ${accent}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
                  <div className={`h-8 w-8 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
                <p className="text-xs text-slate-400 truncate">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Run Web Tests ── */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <Rocket className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-slate-800">{t.runTests.title}</h2>
                  <p className="text-xs text-slate-400">{t.runTests.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setUploadMode("zip")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      uploadMode === "zip" ? "bg-orange-600 text-white border-orange-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> {t.runTests.zip}
                  </button>
                  <button onClick={() => setUploadMode("github")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      uploadMode === "github" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <GithubLogo className="h-3.5 w-3.5" /> {t.runTests.github}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {uploadMode === "zip" && (
                  zipFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{zipFile.name}</p>
                        <p className="text-xs text-slate-500">{(zipFile.size / 1024).toFixed(1)} KB · {t.runTests.readyToTest}</p>
                      </div>
                      <button onClick={() => { setZipFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-all ${
                        isDragging ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isDragging ? "bg-orange-100" : "bg-slate-100"}`}>
                        <UploadCloud className={`h-6 w-6 ${isDragging ? "text-orange-500" : "text-slate-400"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">
                          {t.runTests.dragDrop.split(".zip")[0]}<span className="text-orange-600 font-semibold">.zip</span>{t.runTests.dragDrop.split(".zip")[1]}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.runTests.or} <span className="text-orange-600 underline">{t.runTests.browseFiles}</span> · {t.runTests.maxSize}</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="hidden"
                        onChange={(e) => e.target.files?.[0] && selectZip(e.target.files[0])} />
                    </div>
                  )
                )}

                {uploadMode === "github" && (
                  !githubStatus?.connected ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-10">
                      <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <GithubLogo className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">{t.runTests.connectGithub}</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{t.runTests.githubPermission}</p>
                      </div>
                      <button onClick={connectGithub}
                        className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors mt-1"
                      >
                        <GithubLogo className="h-4 w-4" /> {t.runTests.connectBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
                        {githubStatus.avatar && <img src={githubStatus.avatar} alt="" className="h-6 w-6 rounded-full" />}
                        <span className="text-sm font-medium text-slate-700">@{githubStatus.login}</span>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{t.runTests.connected}</span>
                        <button onClick={connectGithub} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline">{t.runTests.reconnect}</button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t.runTests.repository}</label>
                        <input type="text" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder={loadingRepos ? t.runTests.loadingRepos : t.runTests.searchRepos}
                          className="w-full rounded-t-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
                        />
                        {repos.length > 0 && (
                          <div className="max-h-36 overflow-y-auto border border-t-0 border-slate-200 rounded-b-lg divide-y divide-slate-50">
                            {repos.filter(r => r.full_name.toLowerCase().includes(repoSearch.toLowerCase())).map(repo => (
                              <button key={repo.id} onClick={() => { handleSelectRepo(repo); setRepoSearch(repo.full_name); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                  selectedRepo?.id === repo.id ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-700"
                                }`}
                              >
                                <span className="truncate">{repo.full_name}</span>
                                {repo.private && <span className="text-xs text-slate-400 shrink-0 ml-2">{t.runTests.private}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedRepo && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                            <GitBranch className="h-3 w-3" /> {t.runTests.branch}
                          </label>
                          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
                          >
                            {(branches.length > 0 ? branches : [selectedRepo.default_branch || "main"]).map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* Test type selector */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">{t.runTests.testType}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "UI Testing", label: t.runTests.uiTesting, desc: t.runTests.uiUx },
                      { value: "API Testing", label: t.runTests.apiTesting, desc: t.runTests.endpoints },
                      { value: "Functional Testing", label: t.runTests.functionalTesting, desc: t.runTests.function },
                    ].map((testTypeOpt) => (
                      <button
                        key={testTypeOpt.value}
                        type="button"
                        onClick={() => setTestType(testTypeOpt.value)}
                        className={`flex flex-col items-start px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                          testType === testTypeOpt.value
                            ? "border-orange-500 bg-orange-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className={`text-xs font-bold leading-tight ${testType === testTypeOpt.value ? "text-orange-700" : "text-slate-700"}`}>
                          {testTypeOpt.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{testTypeOpt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-400">{t.runTests.aiPowered}</p>
                  <button onClick={handleStartTest}
                    disabled={isTesting || (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${
                      isTesting ? "bg-orange-400 cursor-wait"
                      : (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-md active:scale-95"
                    }`}
                  >
                    <Rocket className="h-4 w-4" />
                    {isTesting ? t.runTests.starting : t.runTests.startTesting}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Last Test Result ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t.lastResult.title}</h3>
              </div>
              <div className="p-5 flex-1">
                {lastResult ? (
                  <div className="space-y-3">
                    {/* Score ring */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0">
                        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none"
                            stroke={parseScore(lastResult.health_score) >= 75 ? "#10b981" : parseScore(lastResult.health_score) >= 50 ? "#f97316" : "#ef4444"}
                            strokeWidth="3"
                            strokeDasharray={`${(parseScore(lastResult.health_score) ?? 0) * 0.942} 94.2`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{parseScore(lastResult.health_score) ?? "—"}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">{t.lastResult.healthScore}</p>
                        <p className={`text-xl font-bold ${
                          parseScore(lastResult.health_score) >= 75 ? "text-emerald-600"
                          : parseScore(lastResult.health_score) >= 50 ? "text-orange-500" : "text-red-600"
                        }`}>{lastResult.health_score}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {parseScore(lastResult.health_score) >= 75 ? t.lastResult.healthy : parseScore(lastResult.health_score) >= 50 ? t.lastResult.fair : t.lastResult.critical}
                        </p>
                      </div>
                    </div>

                    {lastResult.summary && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
                          <p className="text-xs text-emerald-600 font-medium">{t.lastResult.passed}</p>
                          <p className="text-base font-bold text-emerald-700">{lastResult.summary.passed ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-2.5 text-center">
                          <XCircle className="h-3.5 w-3.5 text-red-600 mx-auto mb-1" />
                          <p className="text-xs text-red-600 font-medium">{t.lastResult.failed}</p>
                          <p className="text-base font-bold text-red-700">{lastResult.summary.failed ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                          <Activity className="h-3.5 w-3.5 text-slate-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-500 font-medium">{t.lastResult.total}</p>
                          <p className="text-base font-bold text-slate-700">{lastResult.summary.total ?? 0}</p>
                        </div>
                      </div>
                    )}

                    {lastResult.summary?.duration && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{t.lastResult.duration} <span className="font-semibold text-slate-700">{lastResult.summary.duration}</span></span>
                      </div>
                    )}

                    {lastResult.issues?.length > 0 && (
                      <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
                        <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> {lastResult.issues.length} {t.lastResult.issues}
                        </p>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {lastResult.issues.map((issue, i) => (
                            <p key={i} className="text-xs text-orange-700 truncate">
                              <span className="font-semibold">{issue.severity}: </span>{issue.error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {lastResult.finished_at && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 border-t pt-2">
                        <Clock className="h-3 w-3" />
                        {new Date(lastResult.finished_at).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                      <BarChart2 className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{t.lastResult.noResults}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.lastResult.noResultsHint}</p>
                  </div>
                )}
              </div>

              {/* Credits mini section */}
              {usageStats && (
                <div className="px-5 pb-5">
                  <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-violet-600" />
                        <span className="text-xs font-semibold text-violet-700">{t.stats.creditsLeft}</span>
                      </div>
                      <span className="text-sm font-bold text-violet-700">{usageStats.credits.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-violet-100 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${usageStats.tokens_used + usageStats.credits > 0 ? Math.round((usageStats.tokens_used / (usageStats.tokens_used + usageStats.credits)) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-violet-400 mt-1">{usageStats.tokens_used.toLocaleString()} tokens used</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Test History Table ── */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="history">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t.history.title}</h3>
                  <p className="text-xs text-slate-400">{historyList.length} {t.history.runs}</p>
                </div>
              </div>
              {ds && (
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{ds.completed_tests} {t.history.completed}</span>
                  <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-400" />{ds.failed_tests} {t.history.failed}</span>
                  <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-blue-400" />{ds.success_rate}% {t.history.success}</span>
                </div>
              )}
            </div>

            {historyList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left border-b border-slate-100">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[35%]">{t.history.project}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[18%]">{t.history.started}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[10%]">{t.history.duration}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[12%]">{t.history.status}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[13%]">{t.history.passedFailed}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[10%]">{t.history.score}</th>
                      <th className="px-4 py-3 w-[2%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => {
                      const summary = normalizeResultSummary(item);
                      const score = parseScore(item.score ?? summary?.health_score);
                      const variant = scoreBadgeVariant(score);
                      const canOpenReport = Boolean(item.project_id);

                      const durationSec = item.start_time && item.end_time
                        ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 1000)
                        : null;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate max-w-[200px]">{item.filename}</p>
                                {summary?.issues_count > 0 && (
                                  <p className="text-[10px] text-orange-500 flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle className="h-2.5 w-2.5" />{summary.issues_count} issue{summary.issues_count > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                            {formatDateTime(item.start_time || item.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                            {durationSec && durationSec > 0 && durationSec < 3600 ? formatDuration(durationSec) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              item.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "running" ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.status === "failed" ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                item.status === "completed" ? "bg-emerald-500"
                                : item.status === "running" ? "bg-blue-500 animate-pulse"
                                : item.status === "failed" ? "bg-red-500"
                                : "bg-slate-400"
                              }`} />
                              {item.status ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {summary ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-emerald-600 font-semibold">{summary.passed ?? 0}✓</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-red-500 font-semibold">{summary.failed ?? 0}✗</span>
                                <span className="text-slate-400">of {summary.total ?? 0}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {score !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${variant.bar}`} style={{ width: `${score}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${variant.text}`}>{score}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {canOpenReport && (
                              <button onClick={() => navigate(`/test-report/${item.project_id}`)}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap"
                              >
                                {t.history.report} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <History className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">{t.history.empty}</p>
                <p className="text-xs text-slate-400 mt-1">{t.history.emptyHint}</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
