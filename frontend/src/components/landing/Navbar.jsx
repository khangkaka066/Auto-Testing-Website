import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Plane, Settings, User, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import { toast } from "sonner";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false); // State quản lý đóng/mở dropdown avatar
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Xử lý đóng menu avatar khi bấm chuột ra ngoài vùng dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setAvatarMenuOpen(false);
    toast.success("Đã đăng xuất thành công!");
    navigate("/");
  };

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header data-testid="site-navbar" className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        
        {/* Logo thương hiệu */}
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 font-display font-bold text-lg tracking-tight text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
            <Plane className="h-4 w-4 -rotate-45" />
          </span>
          TestPilot
        </Link>

        {/* Các liên kết Menu điều hướng nội bộ */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* KHU VỰC GIAO DIỆN PHÍA BÊN PHẢI (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
          {isLoggedIn ? (
            <>
              {/* Nút kích hoạt Không gian làm việc Dashboard chính */}
              <Link to="/dashboard" className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 transition-colors mr-1">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Workspace
              </Link>

              {/* Vòng tròn Avatar người dùng kích hoạt Dropdown */}
              <button 
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="h-9 w-9 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full border-2 border-white shadow-sm flex items-center justify-center text-sm transition-all focus:outline-none"
              >
                U
              </button>

              {/* BẢNG MENU THẢ XUỐNG KHI BẤM VÀO AVATAR */}
              {avatarMenuOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md flex flex-col text-left z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1.5 text-xs text-slate-400 font-medium border-b border-slate-100 mb-1">
                    Tài khoản của bạn
                  </div>
                  
                  {/* 🛠️ ĐÃ SỬA: Chuyển hướng sang trang /profile thay vì /dashboard */}
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

        {/* Nút bấm Menu trên Mobile */}
        <button className="md:hidden p-2 -mr-2 text-slate-700" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* KHU VỰC THAY ĐỔI TRÊN ĐIỆN THOẠI (MOBILE) */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-6 py-4 flex flex-col gap-4 text-left">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">{l.label}</a>
            ))}
            <div className="h-px bg-slate-100 my-1"></div>
            {isLoggedIn ? (
              <>
                {/* 🛠️ ĐÃ SỬA: Đổi to="/dashboard" thành to="/profile" */}
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 py-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400"/> Thông tin cá nhân
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