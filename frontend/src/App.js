import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";       
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Profile from "./pages/Profile"; 
import TestRunner from "./pages/TestRunner"; // 1. Import trang TestRunner
import TestProgress from "./pages/TestProgress";
import PricingPage from "./pages/PricingPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />       
          <Route path="/register" element={<Register />} /> 
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/run-test" element={<TestRunner />} /> {/* 2. Khai báo route */}
          <Route path="/test-progress/:projectId" element={<TestProgress />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
