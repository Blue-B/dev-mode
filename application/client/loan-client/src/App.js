import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Navbar from "./components/Nav";
import MyPage from "./pages/MyPage";
import Main from "./pages/Main";
import Constract from "./pages/Constract";
import FinancialStatus from "./pages/FinancialStatus";
import Friend from "./pages/Friend";
import Loanpool from "./pages/LoanPool";
import Setting from "./pages/Setting";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function AppLayout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Main 페이지는 AppLayout 없이 바로 렌더링 */}
        <Route path="/" element={<Main />} />

        {/* MyPage만 AppLayout 안에 렌더링 */}
        <Route
          path="/mypage"
          element={
            <AppLayout>
              <MyPage />
            </AppLayout>
          }
        />
        <Route
          path="/constract"
          element={
            <AppLayout>
              <Constract />
            </AppLayout>
          }
        />
        <Route
          path="/FinancialStatus"
          element={
            <AppLayout>
              <FinancialStatus />
            </AppLayout>
          }
        />
        <Route
          path="/friend"
          element={
            <AppLayout>
              <Friend />
            </AppLayout>
          }
        />
        <Route
          path="/loanpool"
          element={
            <AppLayout>
              <Loanpool />
            </AppLayout>
          }
        />
        <Route
          path="/setting"
          element={
            <AppLayout>
              <Setting />
            </AppLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AppLayout>
              <Signup />
            </AppLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AppLayout>
              <Login />
            </AppLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;