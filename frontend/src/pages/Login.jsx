import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token); // Lưu token xác thực đăng nhập
        
        // 🛠️ ĐÃ SỬA: Chuyển hướng thẳng vào trang không gian làm việc Dashboard
        navigate("/dashboard"); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
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
  );
}