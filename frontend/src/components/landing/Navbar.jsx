import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Plane, Settings, User, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import { toast } from "sonner";
import axios from "axios"; // 🛠️ THÊM IMPORT AXIOS

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 🛠️ THÊM STATE: Lưu trữ ảnh và chữ cái đầu tên người dùng
  const [avatar, setAvatar] = useState(localStorage.getItem("user_avatar") || "");
  const [initial, setInitial] = useState(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Hàm tự động đồng bộ dữ liệu User từ Backend lên thanh Navbar
  const fetchNavbarUserData = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      axios
        .get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data.success) {
            const fetchedAvatar = res.data.user.avatar || "";
            const fetchedName = res.data.user.name || "";
            
            setAvatar(fetchedAvatar);
            setInitial(fetchedName.charAt(0).toUpperCase() || "U");
            
            // Sao lưu lại bộ nhớ đệm máy để nạp nhanh lần sau
            localStorage.setItem("user_avatar", fetchedAvatar);
            localStorage.setItem("user_name", fetchedName);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchNavbarUserData();

    // 🛠️ LẮNG NGHE: Sự kiện đồng bộ "userUpdate" phát ra từ trang Profile
    const handleUserUpdate = () => {
      setAvatar(localStorage.getItem("user_avatar") || "");
      setInitial(localStorage.getItem("user_name")?.charAt(0).toUpperCase() || "U");
    };

    window.addEventListener("userUpdate", handleUserUpdate);
    return () => window.removeEventListener("userUpdate", handleUserUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_avatar");
    localStorage.removeItem("user_name");
    setIsLoggedIn(false);
    setAvatarMenuOpen(false);
    toast.success("Đã đăng xuất thành công!");
    navigate("/");
  };

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header data-testid="site-navbar" className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        
        <a href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 font-display font-bold text-lg tracking-tight text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
            <Plane className="h-4 w-4 -rotate-45" />
          </span>
          TestPilot
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {l.label}
            </a>
          ))}
          <Link
            to="/pricing"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/story"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1.5"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Our Story
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 transition-colors mr-1">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Workspace
              </Link>

              {/* 🛠️ SỬA ĐỔI: Kiểm tra hiển thị ảnh thẻ IMG thay vì chữ U mặc định */}
              <button 
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="h-9 w-9 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sm transition-all focus:outline-none overflow-hidden"
              >
                {avatar ? (
                  <img src={avatar} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </button>

              {avatarMenuOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md flex flex-col text-left z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1.5 text-xs text-slate-400 font-medium border-b border-slate-100 mb-1">
                    Tài khoản của bạn
                  </div>
                  
                  <button onClick={() => { setAvatarMenuOpen(false); navigate("/profile"); }} className="w-full text-slate-700 hover:bg-slate-50 text-sm font-medium px-2.5 py-2 rounded-md flex items-center gap-2 transition-colors">
                    <User className="h-4 w-4 text-slate-400" />
                    Thông tin cá nhân
                  </button>
                  
                  <button onClick={() => { setAvatarMenuOpen(false); }} className="w-full text-slate-700 hover:bg-slate-50 text-sm font-medium px-2.5 py-2 rounded-md flex items-center gap-2 transition-colors">
                    <Settings className="h-4 w-4 text-slate-400" />
                    Cài đặt tài khoản
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-red-600 hover:bg-red-50 text-sm font-semibold px-2.5 py-2 rounded-md flex items-center gap-2 transition-colors">
                    <LogOut className="h-4 w-4 text-red-400" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md transition-colors">Start free</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 -mr-2 text-slate-700" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-6 py-4 flex flex-col gap-4 text-left">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">{l.label}</a>
            ))}
            <Link to="/pricing" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">Pricing</Link>
            <div className="h-px bg-slate-100 my-1"></div>
            {isLoggedIn ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 py-1 flex items-center gap-2">
                  {/* 🛠️ SỬA ĐỔI: Thêm vòng tròn thu nhỏ cho giao diện điện thoại */}
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-slate-400"/>
                  )}
                  Thông tin cá nhân
                </Link>
                
                <a href="#" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 py-1 flex items-center gap-2"><Settings className="h-4 w-4 text-slate-400"/> Cài đặt tài khoản</a>
                <button onClick={() => { setOpen(false); handleLogout(); }} className="text-sm font-semibold text-white bg-red-600 py-2 rounded-md text-center w-full mt-2">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 text-center border py-2 rounded-md">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-md text-center">Start free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}