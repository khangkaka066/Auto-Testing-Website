import React, { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, CreditCard, History, LogOut,
  LayoutDashboard, User, Menu, ChevronRight, Coins,
  TrendingUp, Package, AlertTriangle, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PRICE_PER_CREDIT_VND = 25_000;
const MIN_CREDITS = 4;

export default function BillingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Developer" });
  const [avatar, setAvatar] = useState(localStorage.getItem("user_avatar") || "");
  const [initial, setInitial] = useState(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
  const [credits, setCredits] = useState(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [buying, setBuying] = useState(false);
  const [creditAmount, setCreditAmount] = useState(MIN_CREDITS);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const name = localStorage.getItem("user_name") || "Developer";
    setUser({ name });
    setAvatar(localStorage.getItem("user_avatar") || "");
    setInitial(name.charAt(0).toUpperCase());

    // Check success/cancel từ Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast.success("Payment successful! Credits have been added to your account.");
      window.history.replaceState({}, "", "/billing");
    } else if (params.get("cancelled") === "1") {
      toast.info("Payment cancelled.");
      window.history.replaceState({}, "", "/billing");
    }

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_BASE_URL}/api/auth/stats`, { headers })
      .then(r => { if (r.data.success) { setCredits(r.data.data.credits); setTokensUsed(r.data.data.tokens_used); } })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/billing/packages`, { headers })
      .then(r => { if (r.data.success) setStripeEnabled(r.data.stripe_enabled); })
      .catch(() => {});

    axios.get(`${API_BASE_URL}/api/billing/transactions`, { headers })
      .then(r => { if (r.data.success) setTransactions(r.data.data); })
      .catch(() => {});
  }, [navigate]);

  const handleBuy = async () => {
    if (creditAmount < MIN_CREDITS) {
      toast.error(`Minimum purchase is ${MIN_CREDITS} credits`);
      return;
    }
    const token = localStorage.getItem("token");
    setBuying(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/billing/create-checkout`,
        { credit_amount: creditAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start checkout");
      setBuying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_avatar");
    localStorage.removeItem("user_name");
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const totalSpentVnd = transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.amount_vnd || t.amount_usd * 25_000 || 0), 0);
  const totalCreditsBought = transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.credits_added || 0), 0);
  const creditsUsed = tokensUsed / 500_000;
  const usedPct = credits != null && (creditsUsed + credits) > 0
    ? Math.round((creditsUsed / (creditsUsed + credits)) * 100) : 0;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center px-4 border-b border-slate-700/60 overflow-hidden">
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo.png" alt="TestPilot" className="h-8 w-8 rounded-md group-hover:scale-105 transition-transform shrink-0" />
            {sidebarOpen && <span className="font-bold text-white text-base tracking-tight group-hover:text-orange-400 transition-colors whitespace-nowrap">TestPilot</span>}
          </a>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarOpen && <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Main Menu</p>}

          <Link to="/dashboard" className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">Dashboard</span>}
          </Link>

          <Link to="/billing" className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium bg-orange-600 text-white shadow-sm transition-all ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}>
            <CreditCard className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">Billing</span>}
            {sidebarOpen && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
          </Link>

          <Link to="/profile" className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${sidebarOpen ? "gap-3 px-3" : "justify-center px-0"}`}>
            <User className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap flex-1">Profile</span>}
          </Link>
        </nav>

        <div className="p-3 border-t border-slate-700/60">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                <p className="text-slate-500 text-[10px]">Free plan</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors">
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">Billing & Credits</h1>
            <p className="text-xs text-slate-400">Manage your credit balance and transactions</p>
          </div>
          <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
            <div className="h-8 w-8 bg-orange-600 text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user.name}</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-violet-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available Credits</p>
                <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{credits != null ? parseFloat(credits).toFixed(2) : "—"}</p>
              <div className="mt-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${usedPct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{usedPct}% used this cycle</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Purchased</p>
                <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{parseFloat(totalCreditsBought).toFixed(2)} <span className="text-base font-medium text-slate-400">cr</span></p>
              <p className="text-xs text-slate-400 mt-1">{transactions.filter(t => t.status === "completed").length} completed transactions</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spent</p>
                <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalSpentVnd.toLocaleString("vi-VN")} <span className="text-base font-medium text-slate-400">₫</span></p>
              <p className="text-xs text-slate-400 mt-1">Lifetime spend</p>
            </div>
          </div>

          {/* Alerts */}
          {credits != null && credits < 1 && (
            <div className="mb-6 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Credits running low</p>
                <p className="text-xs text-orange-600 mt-0.5">You have <strong>{parseFloat(credits).toFixed(2)}</strong> credits left. Top up now to avoid test interruptions.</p>
              </div>
            </div>
          )}
          {!stripeEnabled && (
            <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Payment not configured</p>
                <p className="text-xs text-blue-600 mt-0.5">Add <code className="bg-blue-100 px-1 rounded">STRIPE_SECRET_KEY</code> and <code className="bg-blue-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code> to backend <code className="bg-blue-100 px-1 rounded">.env</code> to enable payments.</p>
              </div>
            </div>
          )}

          {/* Top up — 2-column layout */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Top Up Credits</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: input form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <p className="text-xs text-slate-500 mb-5">
                  Choose how many credits to add to your account. <span className="font-medium text-slate-700">Minimum {MIN_CREDITS} credits</span> per purchase.
                </p>

                <label className="block text-xs font-semibold text-slate-600 mb-2">Number of credits</label>
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setCreditAmount(v => Math.max(MIN_CREDITS, v - 1))}
                    className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xl font-bold transition-colors select-none"
                  >−</button>
                  <input
                    type="number"
                    min={MIN_CREDITS}
                    value={creditAmount}
                    onChange={e => setCreditAmount(Math.max(MIN_CREDITS, parseInt(e.target.value) || MIN_CREDITS))}
                    className="flex-1 text-center text-2xl font-bold text-slate-800 border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    onClick={() => setCreditAmount(v => v + 1)}
                    className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xl font-bold transition-colors select-none"
                  >+</button>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-6">
                  {[4, 10, 20, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => setCreditAmount(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        creditAmount === n
                          ? "bg-orange-600 text-white border-orange-600"
                          : "border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
                      }`}
                    >{n}</button>
                  ))}
                </div>

                {/* Price summary */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between py-3.5 px-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl mb-4">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Total</p>
                      <p className="text-2xl font-bold text-slate-900">{(creditAmount * PRICE_PER_CREDIT_VND).toLocaleString("vi-VN")} ₫</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{creditAmount} <span className="text-sm font-medium">credits</span></p>
                      <p className="text-[11px] text-slate-400">25,000 ₫ / credit</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={!stripeEnabled || buying}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm shadow-orange-200"
                  >
                    {buying ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Redirecting to checkout…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {stripeEnabled ? "Pay now" : "Payment not configured"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: what you get */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-orange-400" />
                  </div>
                  <h3 className="text-sm font-bold">What you get</h3>
                </div>

                <ul className="space-y-3.5 flex-1">
                  {[
                    { icon: "✦", label: "AI-powered test generation", sub: "Playwright scripts created automatically from your source code" },
                    { icon: "✦", label: "All test types included", sub: "UI, API, and Functional testing in one run" },
                    { icon: "✦", label: "Detailed test reports", sub: "Health score, pass/fail breakdown, and prioritized bug list" },
                    { icon: "✦", label: "Credits never expire", sub: "Use them at your own pace, no monthly reset" },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-orange-400 text-xs mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-5 border-t border-slate-700">
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-3">With {creditAmount} credit{creditAmount !== 1 ? "s" : ""} you can run approximately</p>
                  <p className="text-3xl font-bold text-white">{Math.floor(creditAmount / 1.5)} <span className="text-base font-medium text-slate-400">test runs</span></p>
                  <p className="text-[11px] text-slate-500 mt-1">Based on average project size</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="h-8 w-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Transaction History</h3>
                <p className="text-xs text-slate-400">{transactions.length} records</p>
              </div>
            </div>

            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                              <Zap className="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            <span className="font-medium text-slate-800">{t.package_name || "Credits"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">
                          +{parseFloat(t.credits_added || 0).toFixed(2)} cr
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">
                          {t.amount_vnd
                            ? t.amount_vnd.toLocaleString("vi-VN") + " ₫"
                            : t.amount_usd != null ? "$" + parseFloat(t.amount_usd).toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            t.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : t.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              t.status === "completed" ? "bg-emerald-500"
                              : t.status === "pending" ? "bg-yellow-500"
                              : "bg-red-500"
                            }`} />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <History className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No transactions yet</p>
                <p className="text-xs text-slate-400 mt-1">Your purchase history will appear here</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
