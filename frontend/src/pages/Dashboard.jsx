import React, { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate, Link } from "react-router-dom";
import {
  History, Coins, Activity, FileText,
  BarChart2, CheckCircle2, XCircle, AlertTriangle, Zap,
  UploadCloud, Github as GithubLogo, X, Rocket, GitBranch,
  LayoutDashboard, User, Settings, LogOut, Menu, ChevronRight,
  TrendingUp, Clock, Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

function scoreColor(score) {
  if (score === null || score === undefined) return "border-slate-200 text-slate-400 bg-white";
  if (score <= 25) return "border-red-200 text-red-600 bg-red-50";
  if (score <= 50) return "border-orange-200 text-orange-600 bg-orange-50";
  if (score <= 75) return "border-lime-200 text-lime-600 bg-lime-50";
  return "border-emerald-200 text-emerald-700 bg-emerald-50";
}

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

function lastResultFromRun(data) {
  const report = data?.result?.final_report;
  if (!report) return null;
  return {
    project_id: data.project_id,
    job_id: data.job_id,
    run_id: data.run_id,
    finished_at: data.finished_at,
    health_score: report.health_score,
    summary: report.summary,
    issues: report.issues || [],
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState({ name: "Developer", email: "" });
  const [avatar, setAvatar] = useState(localStorage.getItem("user_avatar") || "");
  const [initial, setInitial] = useState(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
  const [historyList, setHistoryList] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [uploadMode, setUploadMode] = useState("zip");
  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

        const runRes = await axios.get(`${API_BASE_URL}/api/test/run/${latestCompleted.project_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextResult = lastResultFromRun(runRes.data.data);
        setLastResult(nextResult);
        if (nextResult) localStorage.setItem("last_test_result", JSON.stringify(nextResult));
        else localStorage.removeItem("last_test_result");
      })
      .catch(() => { setLastResult(null); localStorage.removeItem("last_test_result"); });

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
      const login = params.get("login");
      toast.success(`GitHub connected: @${login}`);
      window.history.replaceState({}, "", "/dashboard");
      const token = localStorage.getItem("token");
      if (token) {
        axios.get(`${API_BASE_URL}/api/auth/github/status`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => { if (res.data.success) setGithubStatus(res.data.data); })
          .catch(() => {});
      }
    } else if (ghStatus === "error") {
      toast.error(`GitHub connection failed: ${params.get("reason") || "unknown error"}`);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  const connectGithub = () => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_BASE_URL}/api/auth/github/connect?_token=${token}`;
  };

  const loadRepos = async () => {
    const token = localStorage.getItem("token");
    setLoadingRepos(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/github/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setRepos(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setGithubStatus({ connected: false });
        toast.error("GitHub token expired. Please reconnect.");
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setSelectedBranch(repo.default_branch || "main");
    setBranches([]);
    const token = localStorage.getItem("token");
    try {
      const [owner, name] = repo.full_name.split("/");
      const res = await axios.get(`${API_BASE_URL}/api/auth/github/repos/${owner}/${name}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setBranches(res.data.data);
    } catch {}
  };

  useEffect(() => {
    if (uploadMode === "github" && githubStatus?.connected && repos.length === 0) {
      loadRepos();
    }
  }, [uploadMode, githubStatus, repos.length]);

  const selectZip = (file) => {
    if (!file?.name.toLowerCase().endsWith(".zip")) {
      toast.error("Please select a .zip file");
      return;
    }
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

    if (uploadMode === "zip" && !zipFile) { toast.error("Please select a .zip file first"); return; }
    if (uploadMode === "github" && !selectedRepo) { toast.error("Please select a repository"); return; }

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
        }, { headers: { Authorization: `Bearer ${token}` } });

        const projectId = runRes.data.data.project_id;
        toast.success("Test pipeline started!");
        sessionStorage.setItem("latest_test_progress", JSON.stringify({ projectId, sourcePath: src.source_path }));
        navigate(`/test-progress/${projectId}`, { replace: true, state: { projectId, sourcePath: src.source_path } });
      } else {
        if (!selectedRepo) { toast.error("Please select a repository"); setIsTesting(false); return; }
        const runRes = await axios.post(`${API_BASE_URL}/api/test/run-github`, {
          repo_full_name: selectedRepo.full_name,
          branch: selectedBranch || selectedRepo.default_branch || "main",
        }, { headers: { Authorization: `Bearer ${token}` } });

        const projectId = runRes.data.data.project_id;
        toast.success(`Cloning ${selectedRepo.full_name} — pipeline started!`);
        sessionStorage.setItem("latest_test_progress", JSON.stringify({ projectId }));
        navigate(`/test-progress/${projectId}`, { replace: true, state: { projectId } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start test");
      setIsTesting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_avatar");
    localStorage.removeItem("user_name");
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const totalTests = historyList.length;
  const completedTests = historyList.filter(i => i.status === "completed").length;
  const avgScore = (() => {
    const scored = historyList.map(i => parseScore(i.score)).filter(s => s !== null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  })();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", active: true },
    { icon: History, label: "Test History", to: "#history", active: false },
    { icon: User, label: "Profile", to: "/profile", active: false },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Main Menu</p>
          )}
          {navItems.map(({ icon: Icon, label, to, active }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-900/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              {sidebarOpen && active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />}
            </Link>
          ))}

          {sidebarOpen && (
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mt-5 mb-2">Integrations</p>
          )}
          <button
            onClick={connectGithub}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150"
          >
            <GithubLogo className="h-4 w-4 shrink-0" />
            {sidebarOpen && (
              <span className="flex items-center gap-2">
                GitHub
                {githubStatus?.connected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </span>
            )}
          </button>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700/60">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                <p className="text-slate-500 text-[10px] truncate">Free plan</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded">
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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-md hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">Welcome back, {user.name}!</h1>
            <p className="text-xs text-slate-400">Manage your automated testing campaigns</p>
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
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                icon: Activity,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                label: "Total Tests Run",
                value: totalTests,
                sub: `${completedTests} completed`,
                accent: "border-l-blue-500",
              },
              {
                icon: TrendingUp,
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                label: "Average Score",
                value: avgScore !== null ? `${avgScore}/100` : "—",
                sub: avgScore !== null ? (avgScore >= 70 ? "Good health" : "Needs review") : "No data yet",
                accent: "border-l-orange-500",
              },
              {
                icon: Zap,
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
                label: "Credits Left",
                value: usageStats ? usageStats.credits.toLocaleString() : "—",
                sub: usageStats ? `${usageStats.tokens_used.toLocaleString()} used` : "Loading…",
                accent: "border-l-violet-500",
              },
              {
                icon: Shield,
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                label: "Last Score",
                value: lastResult ? `${parseScore(lastResult.health_score) ?? "—"}/100` : "—",
                sub: lastResult ? `${new Date(lastResult.finished_at).toLocaleDateString("vi-VN")}` : "Run a test first",
                accent: "border-l-emerald-500",
              },
            ].map(({ icon: Icon, iconBg, iconColor, label, value, sub, accent }) => (
              <div key={label} className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 border-l-4 ${accent}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                  <div className={`h-8 w-8 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
                <p className="text-xs text-slate-400">{sub}</p>
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
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Run Web Tests</h2>
                  <p className="text-xs text-slate-400">Upload source code to start automated AI testing</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setUploadMode("zip")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      uploadMode === "zip"
                        ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> ZIP
                  </button>
                  <button
                    onClick={() => setUploadMode("github")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      uploadMode === "github"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <GithubLogo className="h-3.5 w-3.5" /> GitHub
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* ZIP upload zone */}
                {uploadMode === "zip" && (
                  zipFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{zipFile.name}</p>
                        <p className="text-xs text-slate-500">{(zipFile.size / 1024).toFixed(1)} KB · Ready to test</p>
                      </div>
                      <button
                        onClick={() => { setZipFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
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
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? "bg-orange-100" : "bg-slate-100"}`}>
                        <UploadCloud className={`h-6 w-6 ${isDragging ? "text-orange-500" : "text-slate-400"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">
                          Drag & drop your <span className="text-orange-600 font-semibold">.zip</span> here
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">or <span className="text-orange-600 underline">browse files</span> · Max 200 MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && selectZip(e.target.files[0])}
                      />
                    </div>
                  )
                )}

                {/* GitHub panel */}
                {uploadMode === "github" && (
                  !githubStatus?.connected ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-10">
                      <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <GithubLogo className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">Connect your GitHub account</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs">TestPilot will request read access to clone public and private repos</p>
                      </div>
                      <button
                        onClick={connectGithub}
                        className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors mt-1"
                      >
                        <GithubLogo className="h-4 w-4" /> Connect GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
                        {githubStatus.avatar && (
                          <img src={githubStatus.avatar} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-slate-700">@{githubStatus.login}</span>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Connected</span>
                        <button onClick={connectGithub} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline">Reconnect</button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Repository</label>
                        <input
                          type="text"
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder={loadingRepos ? "Loading repositories…" : "Search your repos…"}
                          className="w-full rounded-t-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
                        />
                        {repos.length > 0 && (
                          <div className="max-h-36 overflow-y-auto border border-t-0 border-slate-200 rounded-b-lg divide-y divide-slate-50">
                            {repos
                              .filter(r => r.full_name.toLowerCase().includes(repoSearch.toLowerCase()))
                              .map(repo => (
                                <button
                                  key={repo.id}
                                  onClick={() => { handleSelectRepo(repo); setRepoSearch(repo.full_name); }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                    selectedRepo?.id === repo.id ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-700"
                                  }`}
                                >
                                  <span className="truncate">{repo.full_name}</span>
                                  {repo.private && <span className="text-xs text-slate-400 shrink-0 ml-2">Private</span>}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {selectedRepo && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                            <GitBranch className="h-3 w-3" /> Branch
                          </label>
                          <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
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

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-400">AI-powered test generation & execution</p>
                  <button
                    onClick={handleStartTest}
                    disabled={isTesting || (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${
                      isTesting ? "bg-orange-400 cursor-wait"
                      : (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-md active:scale-95"
                    }`}
                  >
                    <Rocket className="h-4 w-4" />
                    {isTesting ? "Starting…" : "Start Testing"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-5">

              {/* Last Test Result */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Last Test Result</h3>
                </div>
                <div className="p-5">
                  {lastResult ? (
                    <div className="space-y-3">
                      {/* Score ring */}
                      <div className="flex items-center gap-4">
                        <div className={`relative h-16 w-16 shrink-0`}>
                          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
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
                          <p className="text-xs text-slate-500 mb-0.5">Health Score</p>
                          <p className={`text-xl font-bold ${
                            parseScore(lastResult.health_score) >= 75 ? "text-emerald-600"
                            : parseScore(lastResult.health_score) >= 50 ? "text-orange-500" : "text-red-600"
                          }`}>{lastResult.health_score}</p>
                        </div>
                      </div>

                      {lastResult.summary && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
                            <p className="text-xs text-emerald-600 font-medium">Passed</p>
                            <p className="text-base font-bold text-emerald-700">{lastResult.summary.passed}</p>
                          </div>
                          <div className="rounded-lg bg-red-50 p-2.5 text-center">
                            <XCircle className="h-3.5 w-3.5 text-red-600 mx-auto mb-1" />
                            <p className="text-xs text-red-600 font-medium">Failed</p>
                            <p className="text-base font-bold text-red-700">{lastResult.summary.failed}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                            <Activity className="h-3.5 w-3.5 text-slate-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-500 font-medium">Total</p>
                            <p className="text-base font-bold text-slate-700">{lastResult.summary.total}</p>
                          </div>
                        </div>
                      )}

                      {lastResult.issues?.length > 0 && (
                        <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
                          <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> {lastResult.issues.length} Issue{lastResult.issues.length > 1 ? "s" : ""}
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
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(lastResult.finished_at).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                        <BarChart2 className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No results yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Run your first test to see stats</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage & Credits */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Usage & Credits</h3>
                </div>
                <div className="p-5">
                  {usageStats ? (() => {
                    const { tokens_used, credits } = usageStats;
                    const total = tokens_used + credits;
                    const usedPct = total > 0 ? Math.round((tokens_used / total) * 100) : 0;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 bg-violet-50 rounded-lg px-4 py-3">
                          <div>
                            <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">Available</p>
                            <p className="text-2xl font-bold text-violet-700">{credits.toLocaleString()}</p>
                            <p className="text-xs text-violet-400">credits remaining</p>
                          </div>
                          <Coins className="h-8 w-8 text-violet-200" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                            <span>Tokens used</span>
                            <span className="font-semibold text-slate-700">{tokens_used.toLocaleString()} / {total.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-violet-500 transition-all duration-700"
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{usedPct}% consumed · Free tier</p>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                        <Zap className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400">Loading usage data…</p>
                    </div>
                  )}
                </div>
              </div>

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
                  <h3 className="text-sm font-bold text-slate-800">Test History</h3>
                  <p className="text-xs text-slate-400">{totalTests} runs total</p>
                </div>
              </div>
            </div>

            {historyList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Started</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Finished</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((item) => {
                      const score = parseScore(item.score);
                      const variant = scoreBadgeVariant(score);
                      const canOpenReport = Boolean(item.project_id);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-slate-400" />
                              </div>
                              <span className="font-medium text-slate-800 truncate max-w-[180px]">{item.filename}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                            {formatDateTime(item.start_time || item.timestamp)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                            {formatDateTime(item.end_time)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              item.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "running"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                item.status === "completed" ? "bg-emerald-500"
                                : item.status === "running" ? "bg-blue-500 animate-pulse"
                                : "bg-slate-400"
                              }`} />
                              {item.status ?? "—"}
                            </span>
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
                          <td className="px-4 py-3.5">
                            {canOpenReport && (
                              <button
                                onClick={() => navigate(`/test-report/${item.project_id}`)}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                              >
                                View report <ChevronRight className="h-3 w-3" />
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
                <p className="text-sm font-medium text-slate-500">No test history yet</p>
                <p className="text-xs text-slate-400 mt-1">Run your first test to see results here</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
