import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { ArrowLeft, UploadCloud, FileText, Play, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios"

export default function TestRunner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State quản lý file zip source code được chọn và hiệu ứng kéo thả
  const [zipFile, setZipFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const isZipFile = (file) => file && file.name.toLowerCase().endsWith(".zip");

  const setSelectedZip = (file) => {
    if (!isZipFile(file)) {
      toast.error("Vui lòng chọn file source code dạng .zip");
      return;
    }

    setZipFile(file);
    toast.success(`Đã chọn file: ${file.name}`);
  };

  // --- XỬ LÝ SỰ KIỆN KÉO THẢ FILE ---
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

  // --- XỬ LÝ SỰ KIỆN CHỌN FILE BẰNG NÚT BẤM ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedZip(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setZipFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- XỬ LÝ NÚT BẤM TEST (ĐÃ CẬP NHẬT GỌI API) ---
  const handleStartTest = async () => {
    if (!zipFile) {
      toast.error("Vui lòng tải lên file source code dạng .zip để bắt đầu!");
      return;
    }
    
    setIsTesting(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("sourceZip", zipFile);

    try {
      // Upload file zip source code, backend sẽ lưu và giải nén vào workspace/<user_id>
      const uploadRes = await axios.post(
        "http://localhost:5000/api/test/upload-source",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadedSource = uploadRes.data.data;

      // Gọi API lưu lịch sử source vừa upload
      await axios.post(
        "http://localhost:5000/api/test/history",
        { filename: zipFile.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Kích hoạt pipeline AI với folder source vừa giải nén
      await axios.post(
        "http://localhost:5000/api/run-test",
        {
          user_id: uploadedSource.user_id,
          project_id: uploadedSource.project_id,
          source_path: uploadedSource.source_path,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsTesting(false);
      toast.success("Đã bắt đầu pipeline test!");
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
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi upload source code");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Workspace
        </button>

        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
            Khởi chạy Auto Test
          </h1>
          <p className="text-slate-500 mt-2">
            Tải lên file .zip chứa source code để hệ thống lưu vào workspace, giải nén và chuẩn bị phân tích kiểm thử.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          
          {/* KHU VỰC KÉO THẢ FILE */}
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
            {/* Input file bị ẩn */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileSelect} 
            />

            {zipFile ? (
              // Trạng thái đã có file
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
                  Xóa file này
                </button>
              </div>
            ) : (
              // Trạng thái chưa có file chờ kéo thả
              <>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? "bg-orange-200 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Kéo thả file .zip source code vào đây
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  hoặc bấm vào để chọn file zip từ máy tính
                </p>
                <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 border border-slate-200 rounded-full shadow-sm">
                  Hỗ trợ: .zip
                </span>
              </>
            )}
          </div>

          {/* NÚT BẤM BẮT ĐẦU TEST */}
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
                  Đang khởi động...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  Bắt đầu Test
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
