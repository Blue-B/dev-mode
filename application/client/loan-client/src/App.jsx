import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Main from "./pages/main/Main";
import ServiceIntro from "./pages/service/ServiceIntro";
import Blog from "./pages/service/Blog";
import Partners from "./pages/service/Partners";
import Careers from "./pages/service/Careers";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Inquiry from "./pages/support/Inquiry";
import Login from "./pages/main/Login";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";

// 앱의 기본 레이아웃 컴포넌트
function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><Main /></AppLayout>} />
        <Route path="/service-intro" element={<AppLayout><ServiceIntro /></AppLayout>} />
        <Route path="/blog" element={<AppLayout><Blog /></AppLayout>} />
        <Route path="/partners" element={<AppLayout><Partners /></AppLayout>} />
        <Route path="/careers" element={<AppLayout><Careers /></AppLayout>} />
        <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
        <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
        <Route path="/inquiry" element={<AppLayout><Inquiry /></AppLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      </Routes>
    </Router>
  );
}

export default App;