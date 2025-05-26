import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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

function AppLayout({ children }) {
  const location = useLocation();
  const hideNavPaths = ["/", "/login", "/signup", "/password", "/service-intro", "/question", "/service-method", "/inquiry", "/ensuring-stability"];

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!hideNavPaths.includes(location.pathname) && <Navbar />}
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
        <Route path="/" element={
          <AppLayout>
            <Main />
          </AppLayout>
          } />

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
        <Route
          path="/password"
          element={
            <AppLayout>
              <PasswordFind />
            </AppLayout>
          }
        />
        <Route
          path="/service-intro"
          element={
          <AppLayout>
            <ServiceIntro />
          </AppLayout>
          }
        />
        <Route
          path="/service-method"
          element={
            <AppLayout>
              <ServiceMethod />
            </AppLayout>
          }
        />
        <Route
          path="/ensuring-stability"
          element={
            <AppLayout>
              <EnsuringStability />
            </AppLayout>
          }
        />
        <Route
          path="/inquiry"
          element={
            <AppLayout>
              <Inquiry />
            </AppLayout>
          }
        />
        <Route
          path="/question"
          element={
            <AppLayout>
              <Question />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;