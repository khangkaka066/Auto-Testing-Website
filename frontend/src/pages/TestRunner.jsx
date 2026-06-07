import React, { useState, useRef } from "react";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { ArrowLeft, UploadCloud, FileText, Play, X } from "lucide-react";
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
  const [testType, setTestType] = useState("UI Testing");

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

  const handleStartTest = async () => {
    if (!zipFile) {
      toast.error(t.toasts.uploadFirst);
      return;
    }

    setIsTesting(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("sourceZip", zipFile);

    try {
      const uploadRes = await axios.post(
        `${API_BASE_URL}/api/test/upload-source`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadedSource = uploadRes.data.data;

      const runRes = await axios.post(
        `${API_BASE_URL}/api/test/run`,
        {
          user_id: uploadedSource.user_id,
          project_id: uploadedSource.project_id,
          source_path: uploadedSource.source_path,
          source_name: uploadedSource.project_name,
          test_type: testType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!runRes.data.success) {
        throw new Error(runRes.data.message || "Pipeline AI chạy thất bại");
      }

      setIsTesting(false);
      toast.success(t.toasts.pipelineStarted);
      sessionStorage.setItem(
        "latest_test_progress",
        JSON.stringify({
          projectId: uploadedSource.project_id,
          sourcePath: uploadedSource.source_path,
        })
      );
      navigate(`/test-progress/${uploadedSource.project_id}`, {
        replace: true,
        state: {
          projectId: uploadedSource.project_id,
          sourcePath: uploadedSource.source_path,
        },
      });
    } catch (err) {
      setIsTesting(false);
      toast.error(err.response?.data?.message || t.toasts.uploadError);
    }
  };

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
              disabled={!zipFile || isTesting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition-all ${
                !zipFile ? "bg-slate-300 cursor-not-allowed" :
                isTesting ? "bg-orange-500 cursor-wait opacity-80" : "bg-orange-600 hover:bg-orange-700 hover:shadow-md"
              }`}
            >
              {isTesting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.starting}
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
    </div>
  );
}
