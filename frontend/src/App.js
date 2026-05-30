import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";       
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Profile from "./pages/Profile"; 
import TestRunner from "./pages/TestRunner"; // 1. Import trang TestRunner
import TestProgress from "./pages/TestProgress";
<<<<<<< HEAD
import TestReport from "./pages/TestReport";
=======
import PricingPage from "./pages/PricingPage";
>>>>>>> e702576315e3fafcd977835b0c1704e8db1c3369
import { Toaster } from "./components/ui/sonner";
import ChatWidget from "./components/ui/ChatWidget";

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
<<<<<<< HEAD
          <Route path="/test-report/:historyId" element={<TestReport />} />
=======
          <Route path="/pricing" element={<PricingPage />} />
>>>>>>> e702576315e3fafcd977835b0c1704e8db1c3369
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-left" />
      <ChatWidget />
    </div>
  );
}

export default App;
