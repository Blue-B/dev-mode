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
import FriendLoanRequest from "./pages/FriendLoanRequest";

// 보호된 라우트 컴포넌트: 로그인한 사용자만 접근 가능
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();  // AuthContext에서 현재 로그인 상태 가져오기

  if (loading) {
    return <div>Loading...</div>;  // 로딩 중일 때 표시
  }
  
  // if (!user) {
  //   return <Navigate to="/login" />;  // 로그인 안 되어있으면 로그인 페이지로 강제 이동
  // }
  
  return children;  // 로그인 되어있으면 원래 보여줄 컴포넌트 표시
};

// 앱의 기본 레이아웃 컴포넌트
function AppLayout({ children }) {
  const location = useLocation();
  // 네비게이션 바를 숨길 경로들
  const hideNavPaths = ['/signup', '/login', '/password'];

  return (
    <div className="flex flex-col h-screen">
      <Header />  {/* 상단 헤더는 항상 표시 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 로그인/회원가입 페이지에서는 네비게이션 바 숨김 */}
        {!hideNavPaths.includes(location.pathname) && <Navbar />}
        <div className="flex-1 overflow-y-auto">
          {children}  {/* 실제 페이지 내용 */}
        </div>
      </div>
    </div>
  );
}

const RedirectToMain = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    // AuthProvider로 전체 앱을 감싸서 인증 상태를 전역적으로 관리
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes: 로그인 없이 접근 가능한 페이지들 */}
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/password" element={<PasswordFind />} />
          <Route path="/service-intro" element={<ServiceIntro />} />
          <Route path="/service-method" element={<ServiceMethod />} />
          <Route path="/ensuring-stability" element={<EnsuringStability />} />
          <Route path="/question" element={<Question />} />
          <Route path="/inquiry" element={<Inquiry />} />

          {/* Protected Routes: 로그인한 사용자만 접근 가능한 페이지들 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>  {/* 로그인 체크 */}
                <AppLayout>     {/* 기본 레이아웃 적용 */}
                  <Main /> {/* 실제 페이지 컴포넌트 */}
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>  {/* 로그인 체크 */}
                <AppLayout>     {/* 기본 레이아웃 적용 */}
                  <Dashboard /> {/* 실제 페이지 컴포넌트 */}
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/request"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FriendLoanRequest />
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
          <Route
            path="/friend"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Friend />
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
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;