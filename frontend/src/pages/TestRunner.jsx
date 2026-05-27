import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { ArrowLeft, UploadCloud, FileText, Play, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios"

export default function TestRunner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State quản lý file được chọn và hiệu ứng kéo thả
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      toast.success(`Đã nhận file: ${droppedFile.name}`);
    }
  };

  // --- XỬ LÝ SỰ KIỆN CHỌN FILE BẰNG NÚT BẤM ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      toast.success(`Đã chọn file: ${selectedFile.name}`);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- XỬ LÝ NÚT BẤM TEST (ĐÃ CẬP NHẬT GỌI API) ---
  const handleStartTest = async () => {
    if (!file) {
      toast.error("Vui lòng tải lên một file kịch bản để bắt đầu!");
      return;
    }
    
    setIsTesting(true);
    const token = localStorage.getItem("token");

    try {
      // Gọi API lưu lịch sử tên file
      await axios.post(
        "http://localhost:5000/api/test/history",
        { filename: file.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Giả lập thời gian hệ thống đang chạy Test
      setTimeout(() => {
        setIsTesting(false);
        toast.success("Đã chạy Test thành công và lưu vào lịch sử!");
        navigate("/dashboard"); // Chạy xong tự động quay về Dashboard xem kết quả
      }, 2000);
      
    } catch (err) {
      setIsTesting(false);
      toast.error("Có lỗi xảy ra khi lưu lịch sử test");
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
            Tải lên file kịch bản kiểm thử của bạn (VD: .js, .py, .json) để hệ thống bắt đầu phân tích và thực thi.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          
          {/* KHU VỰC KÉO THẢ FILE */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${
              file ? "border-slate-200 bg-slate-50 cursor-default" : 
              isDragging ? "border-orange-500 bg-orange-50 cursor-pointer" : "border-slate-300 hover:border-orange-400 hover:bg-slate-50 cursor-pointer"
            }`}
          >
            {/* Input file bị ẩn */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />

            {file ? (
              // Trạng thái đã có file
              <div className="flex flex-col items-center w-full">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-slate-900 truncate max-w-xs">{file.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                
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
                  Kéo thả file vào đây
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  hoặc bấm vào để chọn file từ máy tính
                </p>
                <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 border border-slate-200 rounded-full shadow-sm">
                  Hỗ trợ: .js, .ts, .py, .json
                </span>
              </>
            )}
          </div>

          {/* NÚT BẤM BẮT ĐẦU TEST */}
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              onClick={handleStartTest}
              disabled={!file || isTesting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition-all ${
                !file ? "bg-slate-300 cursor-not-allowed" : 
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