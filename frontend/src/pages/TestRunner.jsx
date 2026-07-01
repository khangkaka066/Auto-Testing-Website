import React, { useState, useRef } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { ArrowLeft, UploadCloud, FileText, Play, X, Zap, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useT } from "../lib/i18n";

export default function TestRunner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { testRunnerT: t } = useT("testing");

  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [testType, setTestType] = useState("UI Testing");

  // Credit estimate dialog state
  const [showEstimateDialog, setShowEstimateDialog] = useState(false);
  const [estimateData, setEstimateData] = useState(null);
  const [pendingUploadedSource, setPendingUploadedSource] = useState(null);

  const TEST_TYPES = [
    {
      value: "UI Testing",
      label: t.types[0].label,
      desc: t.types[0].desc,
    },
    {
      value: "API Testing",
      label: t.types[1].label,
      desc: t.types[1].desc,
    },
    {
      value: "Functional Testing",
      label: t.types[2].label,
      desc: t.types[2].desc,
    },
  ];

  const isZipFile = (file) => file && file.name.toLowerCase().endsWith(".zip");

  const setSelectedZip = (file) => {
    if (!isZipFile(file)) {
      toast.error(t.toasts.selectZip);
      return;
    }
    setZipFile(file);
    toast.success(`${t.toasts.fileSelected}: ${file.name}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedZip(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedZip(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setZipFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step 1: upload zip + estimate → show dialog
  const handleStartTest = async () => {
    if (!zipFile) {
      toast.error(t.toasts.uploadFirst);
      return;
    }

    setIsEstimating(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("sourceZip", zipFile);

    let uploadedSource = null;
    try {
      console.log("[handleStartTest] uploading zip...");
      const uploadRes = await axios.post(
        `${API_BASE_URL}/api/test/upload-source`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      uploadedSource = uploadRes.data.data;
      console.log("[handleStartTest] upload ok, source_path:", uploadedSource.source_path);
    } catch (err) {
      console.error("[handleStartTest] upload failed:", err);
      toast.error(err.response?.data?.message || t.toasts.uploadError);
      setIsEstimating(false);
      return;
    }

    let estData = null;
    try {
      console.log("[handleStartTest] calling /estimate...");
      const estimateRes = await axios.post(
        `${API_BASE_URL}/api/test/estimate`,
        { source_path: uploadedSource.source_path },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      estData = estimateRes.data.data;
      console.log("[handleStartTest] estimate ok:", estData);
    } catch (err) {
      console.warn("[handleStartTest] estimate failed (will show basic dialog):", err?.response?.data || err.message);
    }

    setPendingUploadedSource(uploadedSource);
    setEstimateData(estData);
    setShowEstimateDialog(true);
    setIsEstimating(false);
  };

  // Step 2: user confirmed → run pipeline
  const handleConfirmTest = async () => {
    if (!pendingUploadedSource) return;
    setShowEstimateDialog(false);
    setIsTesting(true);
    const token = localStorage.getItem("token");

    try {
      const runRes = await axios.post(
        `${API_BASE_URL}/api/test/run`,
        {
          user_id: pendingUploadedSource.user_id,
          project_id: pendingUploadedSource.project_id,
          source_path: pendingUploadedSource.source_path,
          source_name: pendingUploadedSource.project_name,
          test_type: testType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!runRes.data.success) {
        throw new Error(runRes.data.message || "Pipeline AI chạy thất bại");
      }

      toast.success(t.toasts.pipelineStarted);
      sessionStorage.setItem(
        "latest_test_progress",
        JSON.stringify({
          projectId: pendingUploadedSource.project_id,
          sourcePath: pendingUploadedSource.source_path,
        })
      );
      navigate(`/test-progress/${pendingUploadedSource.project_id}`, {
        replace: true,
        state: {
          projectId: pendingUploadedSource.project_id,
          sourcePath: pendingUploadedSource.source_path,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || t.toasts.uploadError);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCancelTest = () => {
    setShowEstimateDialog(false);
    setEstimateData(null);
    setPendingUploadedSource(null);
  };

  const isLoading = isEstimating || isTesting;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToWorkspace}
        </button>

        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
            {t.title}
          </h1>
          <p className="text-slate-500 mt-2">
            {t.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !zipFile && fileInputRef.current.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${
              zipFile ? "border-slate-200 bg-slate-50 cursor-default" :
              isDragging ? "border-orange-500 bg-orange-50 cursor-pointer" : "border-slate-300 hover:border-orange-400 hover:bg-slate-50 cursor-pointer"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileSelect}
            />

            {zipFile ? (
              <div className="flex flex-col items-center w-full">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-slate-900 truncate max-w-xs">{zipFile.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {(zipFile.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="mt-4 flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                  {t.dropzone.remove}
                </button>
              </div>
            ) : (
              <>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? "bg-orange-200 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  {t.dropzone.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {t.dropzone.subtitle}
                </p>
                <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 border border-slate-200 rounded-full shadow-sm">
                  {t.dropzone.supported}
                </span>
              </>
            )}
          </div>

          {/* Test type selector */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">{t.testType}</p>
            <div className="grid grid-cols-3 gap-3">
              {TEST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTestType(t.value)}
                  className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all ${
                    testType === t.value
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className={`text-sm font-semibold ${testType === t.value ? "text-orange-700" : "text-slate-800"}`}>
                    {t.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              onClick={handleStartTest}
              disabled={!zipFile || isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition-all ${
                !zipFile ? "bg-slate-300 cursor-not-allowed" :
                isLoading ? "bg-orange-500 cursor-wait opacity-80" : "bg-orange-600 hover:bg-orange-700 hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEstimating ? "Đang phân tích..." : t.starting}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  {t.startBtn}
                </>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* Credit Estimate Dialog */}
      {showEstimateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelTest} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm Testing</h2>
                <p className="text-sm text-slate-500">
                  {estimateData ? "Credit estimate before running" : "Confirm before running"}
                </p>
              </div>
            </div>

            {estimateData ? (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Estimated credits</span>
                  <span className="text-sm font-bold text-orange-600">
                    {estimateData.estimated_credits.min.toFixed(3)} – {estimateData.estimated_credits.max.toFixed(3)}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Your credits</span>
                  <span className={`text-sm font-bold ${estimateData.sufficient ? "text-green-600" : "text-red-600"}`}>
                    {estimateData.current_credits.toFixed(3)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600">
                  This test will consume your credits. Do you want to continue?
                </p>
              </div>
            )}

            {estimateData && !estimateData.sufficient && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Insufficient credits</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You may not have enough credits to complete this test. Please top up.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelTest}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              {estimateData && !estimateData.sufficient ? (
                <button
                  onClick={() => { handleCancelTest(); navigate("/billing"); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-sm font-semibold text-white transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Top up credits
                </button>
              ) : (
                <button
                  onClick={handleConfirmTest}
                  disabled={isTesting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Testing
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
