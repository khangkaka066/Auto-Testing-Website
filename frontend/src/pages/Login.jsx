import React from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { AuthUI } from "../components/ui/auth-fuse";

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function LoginContent() {
  const navigate = useNavigate();

  const handleSignIn = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign in failed");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post("http://localhost:5000/api/auth/google", {
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
