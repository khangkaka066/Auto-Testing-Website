import React from "react";
import API_BASE_URL from "../config";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { AuthUI } from "../components/ui/auth-fuse";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

function RegisterContent({ enableGoogle = true }) {
  const navigate = useNavigate();

  const handleSignIn = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        if (res.data.user?.name) localStorage.setItem("user_name", res.data.user.name);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate(res.data.user?.is_admin ? "/admin" : "/dashboard");
      }
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        toast.error("Email chưa được xác thực. Vui lòng kiểm tra hộp thư và click link xác thực trước khi đăng nhập.", {
          duration: 8000,
        });
      } else {
        toast.error(err.response?.data?.message || "Đăng nhập thất bại");
      }
    }
  };

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
      // Ném lỗi với message rõ ràng để SignUpForm hiển thị inline
      throw new Error(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        token: credentialResponse.credential,
      });
      if (res.data.success) {
        toast.success("Signed in with Google successfully!");
        localStorage.setItem("token", res.data.token);
        if (res.data.user?.name) localStorage.setItem("user_name", res.data.user.name);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate(res.data.user?.is_admin ? "/admin" : "/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Google authentication failed");
    }
  };

  return (
    <AuthUI
      initialMode="signup"
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      googleButton={
        enableGoogle ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("An error occurred connecting to Google")}
          />
        ) : null
      }
    />
  );
}

export default function Register() {
  const [googleClientId, setGoogleClientId] = React.useState(GOOGLE_CLIENT_ID || "");

  React.useEffect(() => {
    if (googleClientId) return undefined;

    let isMounted = true;
    axios
      .get(`${API_BASE_URL}/api/auth/google-client-config`)
      .then((res) => {
        const clientId = res.data?.google_client_id;
        if (isMounted && clientId) setGoogleClientId(clientId);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [googleClientId]);

  if (!googleClientId) {
    return <RegisterContent enableGoogle={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <RegisterContent />
    </GoogleOAuthProvider>
  );
}
