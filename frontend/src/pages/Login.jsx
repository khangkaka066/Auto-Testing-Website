import React from "react";
import API_BASE_URL from "../config";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { AuthUI } from "../components/ui/auth-fuse";

const GOOGLE_CLIENT_ID =
  "599072781636-k48pl9iogbk9qrv0c2952hgipf3ar78v.apps.googleusercontent.com";

function LoginContent() {
  const navigate = useNavigate();

  const handleSignIn = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        if (res.data.user?.name) localStorage.setItem("user_name", res.data.user.name);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign in failed");
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
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        if (res.data.user?.name) localStorage.setItem("user_name", res.data.user.name);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        });
        if (res.data.success) {
          toast.success("Signed in with Google successfully!");
          localStorage.setItem("token", res.data.token);
          if (res.data.user?.name) {
            localStorage.setItem("user_name", res.data.user.name);
          }
          navigate("/dashboard");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Google authentication failed");
      }
    },
    onError: () => toast.error("An error occurred connecting to Google"),
  });

  return (
    <AuthUI
      initialMode="signin"
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      onGoogleClick={() => googleLogin()}
    />
  );
}

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
