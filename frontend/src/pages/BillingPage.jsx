import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, CreditCard, History, LogOut,
  LayoutDashboard, User, Menu, ChevronRight, Coins,
  TrendingUp, Package, AlertTriangle, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { billingT } from "../content/billing";

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("en-US", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const MIN_CREDITS = 4;
const PRICE_PER_CREDIT_USD = 1;

export default function BillingPage() {
  const navigate = useNavigate();
  const t = billingT;
  const [user, setUser] = useState({ name: "Developer" });
  const [avatar, setAvatar] = useState(localStorage.getItem("user_avatar") || "");
  const [initial, setInitial] = useState(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
  const [credits, setCredits] = useState(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [buying, setBuying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [creditAmount, setCreditAmount] = useState(MIN_CREDITS);

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
      toast.success(t.toasts.paymentSuccess);
      window.history.replaceState({}, "", "/billing");
    } else if (params.get("cancelled") === "1") {
      toast.info(t.toasts.paymentCancelled);
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
  }, [navigate, t.toasts.paymentCancelled, t.toasts.paymentSuccess]);

  const handleBuy = async (creditAmount) => {
    if (!creditAmount || creditAmount < MIN_CREDITS) {
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
      toast.error(err.response?.data?.message || t.toasts.checkoutFailed);
      setBuying(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_avatar");
    localStorage.removeItem("user_name");
    toast.success(t.toasts.loggedOut);
    navigate("/");
  };

  const totalSpent = transactions.filter(tx => tx.status === "completed").reduce((s, tx) => s + (tx.amount_usd || 0), 0);
  const totalCreditsBought = transactions.filter(tx => tx.status === "completed").reduce((s, tx) => s + (tx.credits_added || 0), 0);
  const usedPct = credits != null && (tokensUsed + credits) > 0
    ? Math.round((tokensUsed / (tokensUsed + credits)) * 100) : 0;
  const creditTotalUsd = creditAmount * PRICE_PER_CREDIT_USD;

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
            <h1 className="text-base font-bold text-slate-800">{t.pageTitle}</h1>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.overview.available}</p>
                <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{credits != null ? parseFloat(credits).toFixed(2) : "—"}</p>
              <div className="mt-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${usedPct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{usedPct}% {t.overview.usedPercent} · {tokensUsed.toLocaleString()} {t.overview.tokensSpent}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.overview.purchased}</p>
                <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalCreditsBought.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{transactions.filter(tx => tx.status === "completed").length} {t.overview.transactions}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.overview.spent}</p>
                <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">${totalSpent.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{t.overview.lifetimeSpend}</p>
            </div>
          </div>

          {/* Alerts */}
          {credits != null && credits < 1 && (
            <div className="mb-6 flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">{t.warnings.lowCredits}</p>
                <p className="text-xs text-orange-600 mt-0.5">{credits.toLocaleString()} {t.warnings.lowCreditsHint}</p>
              </div>
            </div>
          )}
          {!stripeEnabled && (
            <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">{t.warnings.notConfigured}</p>
                <p className="text-xs text-blue-600 mt-0.5">{t.warnings.notConfiguredHint}</p>
              </div>
            </div>
          )}

          {/* Billing options */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">{t.packages.title}</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pt-3">
              <div className="bg-white rounded-xl border-2 border-orange-400 shadow-sm p-6 flex flex-col relative overflow-visible">
                <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap bg-orange-500 text-white">
                  Monthly plan
                </span>
                <div className="relative">
                  <h3 className="text-base font-bold text-slate-800">Plus</h3>
                  <p className="text-xs text-slate-500 mt-1">Predictable monthly testing for regular users</p>
                  <div className="flex items-baseline gap-1 mt-5">
                    <span className="text-4xl font-bold text-slate-900">$10</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">15 standard test runs each billing cycle</p>
                </div>

                <ul className="relative mt-6 space-y-3 flex-1">
                  {[
                    "15 standard tests/month",
                    "Optional code fix suggestions",
                    "Better test generation engine",
                    "Extra runs continue with credits",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  className="relative mt-6 w-full py-3 rounded-xl text-sm font-bold bg-slate-200 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Subscribe coming soon
                </button>
              </div>

              <div className="bg-white rounded-xl border-2 border-violet-400 shadow-sm p-6 flex flex-col relative">
                <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap bg-violet-500 text-white">
                  Pay as you go
                </span>
                <h3 className="text-base font-bold text-slate-800">Credits</h3>
                <p className="text-xs text-slate-500 mt-1">Flexible top-ups for larger runs or extra capacity</p>
                <div className="flex items-baseline gap-1 mt-5">
                  <span className="text-4xl font-bold text-slate-900">$1</span>
                  <span className="text-slate-400 text-sm">/credit</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum purchase is {MIN_CREDITS} credits</p>

                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credit amount</p>
                      <p className="text-xs text-slate-400 mt-0.5">Credits never expire</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCreditAmount((value) => Math.max(MIN_CREDITS, value - 1))}
                        className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:border-slate-400 transition-colors"
                      >
                        -
                      </button>
                      <div className="h-9 min-w-14 px-3 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-900">
                        {creditAmount}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreditAmount((value) => value + 1)}
                        className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:border-slate-400 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Total</span>
                    <span className="text-2xl font-bold text-slate-900">${creditTotalUsd}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(creditAmount)}
                  disabled={!stripeEnabled || buying}
                  className="mt-6 w-full py-3 rounded-xl text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm shadow-orange-200"
                >
                  {buying ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {t.packages.redirecting}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      {stripeEnabled ? `Buy ${creditAmount} credits for $${creditTotalUsd}` : t.packages.notConfigured}
                    </>
                  )}
                </button>
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
                <h3 className="text-sm font-bold text-slate-800">{t.history.title}</h3>
                <p className="text-xs text-slate-400">{transactions.length} {t.history.records}</p>
              </div>
            </div>

            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.history.package}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.history.credits}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.history.amount}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.history.status}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.history.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                              <Zap className="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            <span className="font-medium text-slate-800">{tx.package_name || "Credits"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          +{(tx.credits_added || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">
                          ${(tx.amount_usd || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            tx.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              tx.status === "completed" ? "bg-emerald-500"
                              : tx.status === "pending" ? "bg-yellow-500"
                              : "bg-red-500"
                            }`} />
                            {tx.status === "completed" ? t.history.completed : tx.status === "pending" ? t.history.pending : tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(tx.created_at)}
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
