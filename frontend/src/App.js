import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Landing from "./pages/Landing";
import Login from "./pages/Login";       
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Profile from "./pages/Profile"; 
import TestRunner from "./pages/TestRunner"; // 1. Import trang TestRunner
import TestProgress from "./pages/TestProgress";
import TestReport from "./pages/TestReport";
import PricingPage from "./pages/PricingPage";
import BillingPage from "./pages/BillingPage";
import FeaturesPage from "./pages/FeaturesPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import ChangelogPage from "./pages/ChangelogPage";
import DocsPage from "./pages/DocsPage";
import RoadmapPage from "./pages/RoadmapPage";
import AboutPage from "./pages/AboutPage";
import { Toaster } from "./components/ui/sonner";
import ContactWidget from "./components/ui/ContactWidget";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />       
          <Route path="/register" element={<Register />} /> 
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/run-test" element={<TestRunner />} /> {/* 2. Khai báo route */}
          <Route path="/test-progress/:projectId" element={<TestProgress />} />
          <Route path="/test-report/:projectId" element={<TestReport />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-left" />
      <ContactWidget />
    </div>
  );
}

export default App;
