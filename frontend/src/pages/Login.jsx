import React from "react";
import API_BASE_URL from "../config";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { AuthUI } from "../components/ui/auth-fuse";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

const VERIFY_ERROR_MESSAGES = {
  invalid_token: 'Link xác thực không hợp lệ. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.',
  token_expired: 'Link xác thực đã hết hạn (hiệu lực 24 giờ). Vui lòng đăng ký lại.',
  missing_token: 'Link xác thực không hợp lệ.',
};

function LoginContent({ enableGoogle = true }) {
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
        toast.error('Email chưa được xác thực. Vui lòng kiểm tra hộp thư và click link xác thực trước khi đăng nhập.', {
          duration: 8000,
        });
      } else {
        toast.error(err.response?.data?.message || "Đăng nhập thất bại");
      }
    }
  };

  const handleSignUp = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
      if (res.data.success) {
        if (res.data.requiresVerification) {
          toast.info("Email xác thực đã được gửi! Vui lòng kiểm tra hộp thư và click vào link để hoàn tất đăng ký.", {
            duration: 10000,
          });
          // Ở lại trang sign-in, chờ user xác thực email
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
      initialMode="signin"
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

export default function Login() {
  const location = useLocation();
  const [googleClientId, setGoogleClientId] = React.useState(GOOGLE_CLIENT_ID || "");

  // Handle redirect from email verification link
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    const error = params.get('error');

    if (verified === 'true') {
      toast.success('🎉 Đăng ký thành công! Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để bắt đầu.', {
        duration: 8000,
      });
      window.history.replaceState({}, '', location.pathname);
    } else if (error) {
      toast.error(VERIFY_ERROR_MESSAGES[error] || 'Email verification failed. Please try again.');
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname]);

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
    return <LoginContent enableGoogle={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
