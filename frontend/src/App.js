import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";       
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Profile from "./pages/Profile"; // 1. Import trang Profile mới vào
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
          <Route path="/profile" element={<Profile />} /> {/* 2. Khai báo route đường dẫn /profile */}
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;