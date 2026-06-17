import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import {
  LayoutDashboard, Users, CreditCard, MessageSquare, LogOut,
  TrendingUp, DollarSign, Activity, Star, Send, X, RefreshCw,
  ChevronLeft, ChevronRight, Headphones, Search, AlertCircle,
  UserPlus, TestTube, ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VND_PER_USD = 25_000; // 1 credit = 25,000 VND = $1 USD

function fmt(n, opts = {}) {
  return Number(n || 0).toLocaleString("en-US", opts);
}
function fmtUsd(vnd) {
  const usd = Number(vnd || 0) / VND_PER_USD;
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function vndToUsd(vnd) {
  return Number(vnd || 0) / VND_PER_USD;
}
function fmtDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
}
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  const colors = {
    orange: { bg: "from-orange-500 to-orange-600", light: "bg-orange-50 text-orange-600" },
    blue:   { bg: "from-blue-500 to-blue-600",     light: "bg-blue-50 text-blue-600" },
    green:  { bg: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 text-emerald-600" },
    purple: { bg: "from-purple-500 to-purple-600",  light: "bg-purple-50 text-purple-600" },
    pink:   { bg: "from-pink-500 to-pink-600",      light: "bg-pink-50 text-pink-600" },
  };
  const c = colors[color] || colors.orange;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {(sub || trend != null) && (
          <div className="flex items-center gap-2 mt-1">
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
            {trend != null && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, limit, onPage }) {
  const maxPage = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 px-1 mt-3">
      <span>{fmt(Math.min((page - 1) * limit + 1, total))}–{fmt(Math.min(page * limit, total))} / {fmt(total)}</span>
      <div className="flex gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => onPage(page + 1)} disabled={page >= maxPage}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ status }) {
  const map = {
    completed: "bg-emerald-100 text-emerald-700", succeeded: "bg-emerald-100 text-emerald-700",
    active: "bg-blue-100 text-blue-700", pending: "bg-amber-100 text-amber-700",
    unread: "bg-blue-100 text-blue-700", read: "bg-slate-100 text-slate-500",
    closed: "bg-slate-100 text-slate-500", failed: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500", running: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatValue ? formatValue(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stats, statsLoading }) {
  const [chartData, setChartData]       = useState([]);
  const [activity, setActivity]         = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    setLoadingChart(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/charts`, { headers: authHeader() }),
      axios.get(`${API_BASE_URL}/api/admin/recent-activity`, { headers: authHeader() }),
    ]).then(([chartRes, actRes]) => {
      setChartData(chartRes.data.data || []);
      setActivity(actRes.data.data || null);
    }).catch(err => console.error("chart/activity error:", err.response?.data || err.message))
      .finally(() => setLoadingChart(false));
  }, []);

  const completedTx   = stats?.totalTransactions || 0;
  const avgRevenue    = completedTx > 0 ? Math.round((stats?.totalRevenue || 0) / completedTx) : 0;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" color="orange"
          value={fmtUsd(stats?.totalRevenue)} sub={`Avg: ${fmtUsd(avgRevenue)} / tx`} />
        <StatCard icon={Users}      label="Total Users" color="blue"
          value={fmt(stats?.totalUsers)} sub="registered accounts" />
        <StatCard icon={Activity}   label="Total Tests" color="green"
          value={fmt(stats?.totalTests)} sub="test runs" />
        <StatCard icon={Star}       label="Feedback Received" color="purple"
          value={fmt(stats?.totalReviews)} sub="contacts & reviews" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CreditCard} label="Total Transactions" color="pink"
          value={fmt(stats?.totalTransactions)} sub="all statuses" />
        <StatCard icon={Zap}        label="Credits Sold" color="orange"
          value={fmt(stats?.totalCredits)} sub="credits" />
        <StatCard icon={TestTube}   label="Revenue / User" color="blue"
          value={stats?.totalUsers > 0 ? fmtUsd((stats?.totalRevenue || 0) / stats.totalUsers) : "$0.00"}
          sub="average per user" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        {/* User growth */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">User Growth</h3>
              <p className="text-xs text-slate-400 mt-0.5">New accounts in the last 6 months</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          {loadingChart ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-slate-300 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#userGrad)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue growth */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Revenue Growth</h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenue (USD) in the last 6 months</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          {loadingChart ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-slate-300 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={v => { const u = v / VND_PER_USD; return u >= 1000 ? `$${(u / 1000).toFixed(0)}K` : `$${u.toFixed(0)}`; }} />
                <Tooltip content={<ChartTooltip formatValue={fmtUsd} />} />
                <Bar dataKey="revenue" name="Revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-3 gap-5">
        {/* Recent users */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-500" /> New Users
          </h3>
          <div className="space-y-2.5">
            {(activity?.recentUsers || []).map(u => (
              <div key={u.id} className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(u.name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.name || "–"}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
              </div>
            ))}
            {!activity && <p className="text-xs text-slate-400">Loading…</p>}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-500" /> Recent Transactions
          </h3>
          <div className="space-y-2.5">
            {(activity?.recentTransactions || []).map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.user?.name || t.user?.email || "–"}</p>
                  <p className="text-xs text-slate-400">{t.package_name || "–"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-orange-600">{fmtUsd(t.amount_usd)}</p>
                  <Badge status={t.status} />
                </div>
              </div>
            ))}
            {!activity && <p className="text-xs text-slate-400">Loading…</p>}
          </div>
        </div>

        {/* Recent tests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Recent Tests
          </h3>
          <div className="space-y-2.5">
            {(activity?.recentTests || []).map(t => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-700 truncate font-mono">{(t.project_id || t.id || "").slice(0, 12)}…</p>
                <Badge status={t.status} />
              </div>
            ))}
            {!activity && <p className="text-xs text-slate-400">Loading…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: authHeader(), params: { page, limit: LIMIT },
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("getUsers error:", err.response?.data || err.message);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? data.filter(u => (u.name + u.email).toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name / email…"
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-xs text-slate-400 ml-auto">{fmt(total)} users</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">Credits</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-300" />Loading…
              </td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">No data</td></tr>
            )}
            {!loading && filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800">{u.name || "–"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(u.credits)}</td>
                <td className="px-4 py-3">
                  {u.is_pro ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <svg className="h-3 w-3 fill-amber-500" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Pro
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400">Free</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.is_admin
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Admin</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">User</span>}
                </td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}

// ─── Transactions tab ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/transactions`, {
        headers: authHeader(), params: { page, limit: LIMIT },
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("getTransactions error:", err.response?.data || err.message);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = data.filter(t => t.status === "completed" || t.status === "succeeded")
    .reduce((s, t) => s + (Number(t.amount_usd) || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Transaction History</h3>
          <p className="text-xs text-slate-400 mt-0.5">This page: {fmtUsd(totalRevenue)}</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Package</th>
              <th className="px-4 py-3 text-right">Amount (VND)</th>
              <th className="px-4 py-3 text-right">Credits</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-300" />Loading…
              </td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">No transactions</td></tr>
            )}
            {!loading && data.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{t.users?.name || "–"}</p>
                  <p className="text-xs text-slate-400">{t.users?.email || ""}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.package_name || "–"}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{fmt(t.amount_usd)}</td>
                <td className="px-4 py-3 text-right font-mono text-orange-600 font-semibold">{fmt(t.credits_added)}</td>
                <td className="px-4 py-3"><Badge status={t.status} /></td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}

// ─── Reviews tab ──────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reviews`, {
        headers: authHeader(), params: { page, limit: LIMIT },
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("getReviews error:", err.response?.data || err.message);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Reviews & Contact</h3>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(total)} responses</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100">
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Full Name</th>
              <th className="px-4 py-3 text-left">Email / Phone</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-300" />Loading…
              </td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">No responses yet</td></tr>
            )}
            {!loading && data.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors align-top">
                <td className="px-4 py-3 font-medium text-slate-800">{r.name || "–"}</td>
                <td className="px-4 py-3 text-slate-500">
                  <p>{r.email || "–"}</p>
                  {r.phone && <p className="text-xs text-slate-400">{r.phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{r.subject || "–"}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs">
                  <p className="line-clamp-2">{r.message || r.content || "–"}</p>
                </td>
                <td className="px-4 py-3"><Badge status={r.status || "unread"} /></td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}

// ─── Chat tab ─────────────────────────────────────────────────────────────────

function ChatTab() {
  const [sessions, setSessions]    = useState([]);
  const [activeSession, setActive] = useState(null);
  const [messages, setMessages]    = useState([]);
  const [reply, setReply]          = useState("");
  const [sending, setSending]      = useState(false);
  const [loadingSessions, setLS]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const loadSessions = useCallback(async () => {
    setLS(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/chat/sessions`, { headers: authHeader() });
      setSessions(res.data.data || []);
    } catch {} finally { setLS(false); }
  }, []);

  const loadMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/chat/messages/${sessionId}`, { headers: authHeader() });
      setMessages(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSessions();
    const t = setInterval(loadSessions, 6000);
    return () => clearInterval(t);
  }, [loadSessions]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (!activeSession) return;
    loadMessages(activeSession.id);
    pollRef.current = setInterval(() => loadMessages(activeSession.id), 3000);
    return () => clearInterval(pollRef.current);
  }, [activeSession, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !activeSession || sending) return;
    setSending(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/chat/reply`,
        { session_id: activeSession.id, content: text },
        { headers: authHeader() }
      );
      setReply("");
      await loadMessages(activeSession.id);
    } catch {} finally { setSending(false); }
  };

  const handleClose = async (session) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/chat/sessions/${session.id}/close`, {}, { headers: authHeader() });
      if (activeSession?.id === session.id) setActive(null);
      loadSessions();
    } catch {}
  };

  const activeSessions = sessions.filter(s => s.status === "active");
  const closedSessions = sessions.filter(s => s.status === "closed");

  return (
    <div className="flex gap-4 h-[calc(100vh-240px)] min-h-[500px]">
      <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-800">Chat Sessions</span>
            {activeSessions.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">{activeSessions.length}</span>
            )}
          </div>
          <button onClick={loadSessions} className="p-1.5 rounded-lg hover:bg-slate-100">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loadingSessions ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {activeSessions.length === 0 && closedSessions.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <p className="text-xs text-center px-4">No chat sessions yet.<br/>Customers will appear here when they request support.</p>
            </div>
          )}
          {activeSessions.map(s => (
            <SessionItem key={s.id} session={s} isActive={activeSession?.id === s.id}
              onClick={() => setActive(s)} onClose={() => handleClose(s)} />
          ))}
          {closedSessions.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Closed</p>
            </div>
          )}
          {closedSessions.map(s => (
            <SessionItem key={s.id} session={s} isActive={activeSession?.id === s.id}
              onClick={() => setActive(s)} onClose={null} />
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Headphones className="h-12 w-12 opacity-20" />
            <p className="text-sm">Select a chat session to view messages</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeSession.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`}>
                  {(activeSession.user_name || "K")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{activeSession.user_name || "Guest"}</p>
                  {activeSession.user_email && <p className="text-xs text-slate-400">{activeSession.user_email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={activeSession.status} />
                {activeSession.status === "active" && (
                  <button onClick={() => handleClose(activeSession)}
                    className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:border-red-200 transition-colors">
                    <X className="h-3 w-3" /> Close Chat
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400 pt-8">No messages yet</p>
              )}
              {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
              <div ref={bottomRef} />
            </div>

            {activeSession.status === "active" ? (
              <div className="flex items-end gap-2 px-3 py-3 border-t border-slate-100 bg-white">
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a reply… (Enter to send)" rows={1}
                  className="flex-1 resize-none text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 max-h-24 overflow-y-auto"
                  style={{ minHeight: "40px" }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"; }}
                />
                <button onClick={handleSend} disabled={!reply.trim() || sending}
                  className="h-10 w-10 flex-shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">Chat session closed</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SessionItem({ session, isActive, onClick, onClose }) {
  return (
    <div onClick={onClick}
      className={`px-3 py-2.5 cursor-pointer flex items-start gap-2 hover:bg-slate-50 transition-colors ${isActive ? "bg-orange-50 border-l-2 border-orange-500" : ""}`}>
      <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${session.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`}>
        {(session.user_name || "G")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-800 truncate">{session.user_name || "Guest"}</p>
          {session.status === "active" && <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0 ml-1 animate-pulse" />}
        </div>
        {session.user_email && <p className="text-xs text-slate-400 truncate">{session.user_email}</p>}
        <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(session.updated_at)}</p>
      </div>
      {onClose && (
        <button onClick={e => { e.stopPropagation(); onClose(); }}
          className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors flex-shrink-0">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isAdmin = msg.role === "admin";
  return (
    <div className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"} items-end`}>
      <div className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${isAdmin ? "bg-orange-500" : "bg-slate-600"}`}>
        {isAdmin ? "A" : (msg.sender_name?.[0] || "K").toUpperCase()}
      </div>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isAdmin ? "bg-orange-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"}`}>
        {msg.content}
        <p className={`text-[10px] mt-1 ${isAdmin ? "text-orange-200" : "text-slate-400"}`}>
          {isAdmin ? (msg.sender_name || "Admin") : (msg.sender_name || "Guest")} · {fmtDate(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",     label: "Overview",      icon: LayoutDashboard },
  { id: "users",        label: "Users",         icon: Users },
  { id: "transactions", label: "Transactions",  icon: CreditCard },
  { id: "reviews",      label: "Reviews",      icon: Star },
  { id: "chat",         label: "Live Chat",    icon: Headphones },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats]         = useState(null);
  const [statsLoading, setSL]     = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    setSL(true);
    axios.get(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setStats(res.data.data); setSL(false); })
      .catch(err => {
        setSL(false);
        if (err.response?.status === 401 || err.response?.status === 403) setAuthError(true);
      });
  }, [navigate]);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">Your account does not have admin privileges.</p>
          <button onClick={() => navigate("/dashboard")}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-56 bg-slate-900 flex flex-col z-30">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">TestPilot</p>
              <p className="text-[10px] text-orange-400 mt-0.5 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${active ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
                {tab.id === "chat" && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <button onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="h-4 w-4" /> User Dashboard
          </button>
          <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 p-6 min-h-screen">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "overview"     && "System-wide overview of TestPilot"}
              {activeTab === "users"        && "List of all registered users"}
              {activeTab === "transactions" && "Payment transaction history"}
              {activeTab === "reviews"      && "Feedback and reviews from customers"}
              {activeTab === "chat"         && "Customer support via live chat"}
            </p>
          </div>
          {statsLoading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
        </div>

        {activeTab === "overview"     && <OverviewTab stats={stats} statsLoading={statsLoading} />}
        {activeTab === "users"        && <UsersTab />}
        {activeTab === "transactions" && <TransactionsTab />}
        {activeTab === "reviews"      && <ReviewsTab />}
        {activeTab === "chat"         && <ChatTab />}
      </main>
    </div>
  );
}
