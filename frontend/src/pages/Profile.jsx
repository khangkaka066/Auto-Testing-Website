import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { User, Mail, Lock, ArrowLeft, Camera } from "lucide-react";

export default function Profile() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to use this feature");
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setFormData({
            name: res.data.user.name,
            email: res.data.user.email,
            password: "",
          });
          setAvatar(res.data.user.avatar || "");
          localStorage.setItem("user_avatar", res.data.user.avatar || "");
          localStorage.setItem("user_name", res.data.user.name || "");
          window.dispatchEvent(new Event("userUpdate"));
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load profile");
        setLoading(false);
      });
  }, [navigate]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file only!");
      return;
    }

    const token = localStorage.getItem("token");
    const data = new FormData();
    data.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post("http://localhost:5000/api/auth/avatar", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.avatar_url) {
        setAvatar(res.data.avatar_url);
        localStorage.setItem("user_avatar", res.data.avatar_url);
        window.dispatchEvent(new Event("userUpdate"));
        toast.success("Profile photo updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

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
        localStorage.setItem("user_name", formData.name);
        window.dispatchEvent(new Event("userUpdate"));
        toast.success(res.data.message);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse font-medium">Loading account information...</p>
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
          Back to Dashboard
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 text-left mb-1">Profile</h2>
          <p className="text-slate-500 text-sm text-left mb-6">Update your display name and profile photo.</p>

          <div className="flex flex-col items-center mb-6 relative">
            <div
              onClick={() => !uploading && fileInputRef.current.click()}
              className="h-24 w-24 rounded-full bg-orange-600 border-4 border-slate-100 shadow-sm flex items-center justify-center text-white font-bold text-3xl cursor-pointer relative group overflow-hidden select-none"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                formData.name ? formData.name.charAt(0).toUpperCase() : "U"
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="text-xs font-semibold text-orange-600 mt-2 hover:underline disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change profile photo"}
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 text-left flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Full name
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
                Email address (read-only)
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
                New password (leave blank to keep current)
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
              Save changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
