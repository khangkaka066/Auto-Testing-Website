import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
// 🛠️ THÊM MỚI: Import thư viện Google
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'; 

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();


  // ⚠️ QUAN TRỌNG: Bạn cần thay chuỗi này bằng Client ID thật lấy từ Google Cloud Console
  const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  // Xử lý đăng nhập bằng Email/Password cũ
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard"); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // 🛠️ THÊM MỚI: Xử lý khi Google trả về token thành công
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Gửi token của Google xuống Backend của bạn để xác thực và tạo User
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential
      });

      if (res.data.success) {
        toast.success("Đăng nhập bằng Google thành công!");
        localStorage.setItem("token", res.data.token);
        
        // Lưu tên user vào localStorage giống như cách bạn đang gọi ở Dashboard
        if (res.data.user?.name) {
          localStorage.setItem("user_name", res.data.user.name);
        }
        
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xác thực Google tại Server thất bại");
    }
  };

  return (
    // Bọc toàn bộ form bằng Provider và cấp Client ID
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 text-center">Đăng nhập TestPilot</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 text-left">Email</label>
            <input 
              type="email" 
              required 
              className="mt-1 w-full rounded-md border p-2 bg-white text-black border-slate-200 focus:outline-none focus:border-orange-500" 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 text-left">Mật khẩu</label>
            <input 
              type="password" 
              required 
              className="mt-1 w-full rounded-md border p-2 bg-white text-black border-slate-200 focus:outline-none focus:border-orange-500" 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full rounded-md bg-orange-600 py-2 font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Đăng nhập
          </button>

          {/* 🛠️ THÊM MỚI: Đường kẻ phân cách */}
          <div className="my-4 flex items-center justify-center space-x-2">
            <span className="h-px w-full bg-slate-200"></span>
            <span className="text-sm text-slate-500">Hoặc</span>
            <span className="h-px w-full bg-slate-200"></span>
          </div>

          {/* 🛠️ THÊM MỚI: Nút Đăng nhập Google tự động sinh ra bởi thư viện */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Có lỗi xảy ra khi kết nối với Google");
              }}
              useOneTap // Hiển thị popup góc phải trên (tùy chọn)
            />
          </div>
          
          <p className="text-sm text-slate-600 text-center mt-4">
            Chưa có tài khoản?{" "}
            <span 
              onClick={() => navigate("/register")} 
              className="text-orange-600 cursor-pointer hover:underline font-medium"
            >
              Đăng ký ngay
            </span>
          </p>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}