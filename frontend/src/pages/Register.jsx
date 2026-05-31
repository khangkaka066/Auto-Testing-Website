import React from "react";
import API_BASE_URL from "../config";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AuthUI } from "../components/ui/auth-fuse";

export default function Register() {
  const navigate = useNavigate();

  const handleSignUp = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      if (res.data.success) {
        if (res.data.requiresVerification) {
          toast.info("Email xác thực đã được gửi! Vui lòng kiểm tra hộp thư và click vào link để hoàn tất đăng ký.", {
            duration: 10000,
          });
          navigate("/login");
        } else {
          toast.success(res.data.message);
          localStorage.setItem("token", res.data.token);
          if (res.data.user?.name) localStorage.setItem("user_name", res.data.user.name);
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return <AuthUI initialMode="signup" onSignUp={handleSignUp} />;
}
