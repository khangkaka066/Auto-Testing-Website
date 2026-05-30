import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { Play, Settings, History, Shield, Activity, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Developer", email: "" });
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to access this page");
      navigate("/login");
      return;
    }

    setUser({ name: localStorage.getItem("user_name") || "Developer", email: "" });

    axios
      .get(`${API_BASE_URL}/api/test/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setHistoryList(res.data.data);
        }
      })
      .catch((err) => console.log("Failed to load history:", err));
  }, [navigate]);

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

          {/* Run tests */}
          <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-orange-500 transition-colors">
            <div className="text-left">
              <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Play className="h-5 w-5 fill-orange-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Run Web Tests</h2>
              <p className="text-slate-500 text-sm">Run automated tests including speed analysis, security scanning, and visual regression.</p>
            </div>
            <button
              onClick={() => navigate("/run-test")}
              className="mt-6 w-full md:w-auto self-start bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start Testing
            </button>
          </div>

          {/* Server status */}
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

          {/* Test history */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left hover:border-slate-300 transition-colors flex flex-col h-72">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <History className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Test History</h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {historyList.length > 0 ? (
                historyList.map((item) => (
                  <div key={item.id} className="border border-slate-100 bg-slate-50 p-3 rounded-lg flex items-start gap-3 hover:bg-slate-100 transition-colors cursor-pointer">
                    <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.filename}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center mt-6">No history yet. Run your first test!</p>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left hover:border-slate-300 transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1">Security</h3>
            <p className="text-slate-500 text-sm">Manage API keys and access tokens for CI/CD integration (GitHub, Jenkins).</p>
          </div>

          {/* Project settings */}
          <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm text-left hover:border-slate-300 transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-4">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1">Project Settings</h3>
            <p className="text-slate-500 text-sm">Configure default test domains and device profiles.</p>
          </div>

        </div>
      </main>
    </div>
  );
}
