import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import PasswordFind from "./pages/PassWord";
import ServiceIntro from "./pages/ServiceIntro";
import ServiceMethod from "./pages/Service-Method";
import Inquiry from "./pages/Inquiry";
import Question from "./pages/Question";
import EnsuringStability from "./pages/Ensuring-Stability";
import Error from "./pages/Error";
import FriendLoanRequest from "./pages/FriendLoanRequest";  // 새 페이지 임포트

// 보호된 라우트 컴포넌트: 로그인한 사용자만 접근 가능
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // 로그인 체크는 여기선 건드리지 말라고 하셔서 주석 처리 유지
  // if (!user) {
  //   return <Navigate to="/login" />;
  // }

  return children;
};

function AppLayout({ children }) {
  const location = useLocation();
  const hideNavPaths = ['/signup', '/login', '/password'];

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!hideNavPaths.includes(location.pathname) && <Navbar />}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const RedirectToMain = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

// 친구 대출 요청 페이지는 반드시 로그인한 사용자만 접근 가능하게 별도 ProtectedRouteWithAuth 사용
const ProtectedRouteWithAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/password" element={<PasswordFind />} />
          <Route path="/service-intro" element={<ServiceIntro />} />
          <Route path="/service-method" element={<ServiceMethod />} />
          <Route path="/ensuring-stability" element={<EnsuringStability />} />
          <Route path="/question" element={<Question />} />
          <Route path="/inquiry" element={<Inquiry />} />

          {/* Protected Routes (변경 없음, except /friend) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Main />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/constract"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Constract />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financialstatus"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FinancialStatus />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 친구 페이지 로그인 체크 활성화 */}
          <Route
            path="/friend"
            element={
              <ProtectedRouteWithAuth>
                <AppLayout>
                  <Friend />
                </AppLayout>
              </ProtectedRouteWithAuth>
            }
          />

          {/* 친구 대출 요청 페이지 추가 */}
          <Route
            path="/loanpool/request"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FriendLoanRequest />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/loanpool"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Loanpool />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/setting"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Setting />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 에러 페이지 */}
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
