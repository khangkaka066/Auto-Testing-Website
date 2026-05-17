import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";

export default function Profile() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này");
      navigate("/login");
      return;
    }

    // Tự động gọi API Backend để lấy dữ liệu cũ đổ vào form khi vừa vào trang
    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setFormData({
            name: res.data.user.name,
            email: res.data.user.email,
            password: "", // Không hiện mật khẩu cũ vì lý do bảo mật
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Không thể tải thông tin");
        setLoading(false);
      });
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { name: formData.name, password: formData.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/dashboard"); // Lưu xong trả về trang Dashboard chính
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thông tin thất bại");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse font-medium">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-12">
        
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Dashboard
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 text-left mb-1">Thông tin cá nhân</h2>
          <p className="text-slate-500 text-sm text-left mb-6">Cập nhật thông tin hiển thị và mật khẩu bảo mật của bạn.</p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 text-left flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={formData.name}
                className="mt-1 w-full rounded-md border p-2 bg-white text-black border-slate-200 focus:outline-none focus:border-orange-500"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 text-left flex items-center gap-1.5 select-none">
                <Mail className="h-4 w-4 text-slate-300" />
                Địa chỉ Email (Không thể chỉnh sửa)
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="mt-1 w-full rounded-md border p-2 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 text-left flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-slate-400" />
                Mật khẩu mới (Để trống nếu muốn giữ nguyên mật khẩu cũ)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                className="mt-1 w-full rounded-md border p-2 bg-white text-black border-slate-200 focus:outline-none focus:border-orange-500"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 rounded-md bg-orange-600 py-2.5 font-semibold text-white hover:bg-orange-700 transition-colors shadow-sm"
            >
              Lưu thay đổi
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}