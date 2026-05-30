import React, { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import {
  History, Coins, Activity, FileText,
  BarChart2, CheckCircle2, XCircle, AlertTriangle, Zap,
  UploadCloud, Github as GithubLogo, X, Rocket, GitBranch,
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

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState({ name: "Developer", email: "" });
  const [historyList, setHistoryList] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  // ── Run Web Tests state ──────────────────────────────────────
  const [uploadMode, setUploadMode] = useState("zip"); // "zip" | "github"
  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // ── GitHub state ──────────────────────────────────────────────
  const [githubStatus, setGithubStatus] = useState(null);  // { connected, login, avatar }
  const [repos, setRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);   // { full_name, default_branch, ... }
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [loadingRepos, setLoadingRepos] = useState(false);

  // ── Load persisted data ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("last_test_result");
      if (saved) setLastResult(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setUser({ name: localStorage.getItem("user_name") || "Developer", email: "" });

    axios.get(`${API_BASE_URL}/api/test/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setHistoryList(res.data.data); })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/auth/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setUsageStats(res.data.data); })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/auth/github/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data.success) setGithubStatus(res.data.data); })
      .catch(() => {});
  }, [navigate]);

  // Kiểm tra query param sau khi GitHub callback
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

  // ── GitHub helpers ────────────────────────────────────────────
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
  }, [uploadMode, githubStatus]);

  // ── ZIP handlers ─────────────────────────────────────────────
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

  // ── Start test ───────────────────────────────────────────────
  const handleStartTest = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    if (uploadMode === "zip" && !zipFile) {
      toast.error("Please select a .zip file first");
      return;
    }
    if (uploadMode === "github" && !selectedRepo) {
      toast.error("Please select a repository");
      return;
    }

    setIsTesting(true);
    try {
      if (uploadMode === "zip") {
        const form = new FormData();
        form.append("sourceZip", zipFile);

        const uploadRes = await axios.post(`${API_BASE_URL}/api/test/upload-source`, form, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const src = uploadRes.data.data;

        await axios.post(`${API_BASE_URL}/api/test/history`, { filename: zipFile.name },
          { headers: { Authorization: `Bearer ${token}` } });

        const runRes = await axios.post(`${API_BASE_URL}/api/test/run`, {
          user_id: src.user_id,
          project_id: src.project_id,
          source_path: src.source_path,
          source_archive_path: src.source_archive_path,
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

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-slate-500 mt-1">Manage your automated testing campaigns.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Run Web Tests (inline uploader) ── */}
          <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">Run Web Tests</h2>
                <p className="text-slate-500 text-xs mt-0.5">Upload your source code to start automated AI testing</p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setUploadMode("zip")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  uploadMode === "zip"
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <UploadCloud className="h-4 w-4" /> Upload ZIP
              </button>
              <button
                onClick={() => setUploadMode("github")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  uploadMode === "github"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <GithubLogo className="h-4 w-4" /> GitHub Repo
              </button>
            </div>

            {/* ZIP upload zone */}
            {uploadMode === "zip" && (
              zipFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{zipFile.name}</p>
                    <p className="text-xs text-slate-500">{(zipFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => { setZipFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
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
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 cursor-pointer transition-all ${
                    isDragging ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-400 hover:bg-slate-50"
                  }`}
                >
                  <UploadCloud className={`h-8 w-8 ${isDragging ? "text-orange-500" : "text-slate-300"}`} />
                  <p className="text-sm font-medium text-slate-600">
                    Drag & drop <span className="text-orange-600">.zip</span> here, or <span className="text-orange-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Max 200 MB</p>
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
                // Chưa kết nối
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 py-8">
                  <GithubLogo className="h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-600 font-medium">Connect GitHub to browse your repositories</p>
                  <p className="text-xs text-slate-400 text-center px-8">TestPilot will request read access to clone public and private repos</p>
                  <button
                    onClick={connectGithub}
                    className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors mt-1"
                  >
                    <GithubLogo className="h-4 w-4" /> Connect GitHub
                  </button>
                </div>
              ) : (
                // Đã kết nối — hiện danh sách repo
                <div className="space-y-3">
                  {/* Connected badge */}
                  <div className="flex items-center gap-2 text-sm">
                    {githubStatus.avatar && (
                      <img src={githubStatus.avatar} alt="" className="h-6 w-6 rounded-full" />
                    )}
                    <span className="font-medium text-slate-700">@{githubStatus.login}</span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Connected</span>
                    <button onClick={connectGithub} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline">Reconnect</button>
                  </div>

                  {/* Repo search + select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Repository</label>
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder={loadingRepos ? "Loading repositories…" : "Search your repos…"}
                      className="w-full rounded-t-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white"
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

                  {/* Branch select */}
                  {selectedRepo && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white"
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

            {/* Start button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleStartTest}
                disabled={isTesting || (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${
                  isTesting ? "bg-orange-400 cursor-wait opacity-80"
                  : (uploadMode === "zip" && !zipFile) || (uploadMode === "github" && (!githubStatus?.connected || !selectedRepo))
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 hover:shadow-md"
                }`}
              >
                <Rocket className="h-4 w-4" />
                {isTesting ? "Starting…" : "Start Testing"}
              </button>
            </div>
          </div>

          {/* ── Server Status ── */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left">
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold mb-2">Server Status</h2>
            <div className="space-y-3 mt-4 text-sm text-slate-600">
              <div className="flex justify-between border-b pb-1">
                <span>Backend:</span>
                <span className="text-green-600 font-semibold">Stable</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Environment:</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">development</span>
              </div>
            </div>
          </div>

          {/* ── Test History ── */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left flex flex-col h-72">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <History className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Test History</h3>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {historyList.length > 0 ? historyList.map((item) => (
                <div key={item.id} className="border border-slate-100 bg-slate-50 p-3 rounded-lg flex items-start gap-3 hover:bg-slate-100 transition-colors">
                  <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.filename}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center mt-6">No history yet. Run your first test!</p>
              )}
            </div>
          </div>

          {/* ── Usage & Credits ── */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Usage & Credits</h3>
            </div>
            {usageStats ? (() => {
              const { tokens_used, credits } = usageStats;
              const total = tokens_used + credits;
              const usedPct = total > 0 ? Math.round((tokens_used / total) * 100) : 0;
              return (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" /> Tokens spent
                      </span>
                      <span className="font-semibold text-slate-800">{tokens_used.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${usedPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{usedPct}% of total credits used</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-violet-600 mb-0.5">Available Credits</p>
                      <p className="text-2xl font-bold text-violet-700">{credits.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-violet-200" />
                  </div>
                  <p className="text-xs text-slate-400">1 credit = 1 token · Free tier: {total.toLocaleString()} tokens</p>
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center h-28 text-center">
                <Zap className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Loading usage data…</p>
              </div>
            )}
          </div>

          {/* ── Last Test Result ── */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <BarChart2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Last Test Result</h3>
            </div>
            {lastResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Health Score</span>
                  <span className={`text-lg font-bold ${
                    parseInt(lastResult.health_score) >= 80 ? "text-emerald-600"
                    : parseInt(lastResult.health_score) >= 50 ? "text-orange-500"
                    : "text-red-600"
                  }`}>{lastResult.health_score}</span>
                </div>
                {lastResult.summary && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-lg bg-emerald-50 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">Passed</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">{lastResult.summary.passed}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs font-medium text-red-700">Failed</span>
                      </div>
                      <p className="text-lg font-bold text-red-700">{lastResult.summary.failed}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Activity className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-600">Total</span>
                      </div>
                      <p className="text-lg font-bold text-slate-700">{lastResult.summary.total}</p>
                    </div>
                  </div>
                )}
                {lastResult.summary?.duration && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium text-slate-700">{lastResult.summary.duration}</span>
                  </div>
                )}
                {lastResult.issues?.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                      Issues ({lastResult.issues.length})
                    </p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {lastResult.issues.map((issue, i) => (
                        <div key={i} className="text-xs text-slate-600 flex items-start gap-1">
                          <span className={`shrink-0 font-semibold ${
                            issue.severity === "Critical" ? "text-red-600"
                            : issue.severity === "High" ? "text-orange-600"
                            : "text-yellow-600"
                          }`}>{issue.severity}:</span>
                          <span className="truncate">{issue.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lastResult.finished_at && (
                  <p className="text-xs text-slate-400 border-t pt-2">
                    Last run: {new Date(lastResult.finished_at).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center">
                <BarChart2 className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No test results yet.</p>
                <p className="text-xs text-slate-400">Run your first test to see stats here.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
