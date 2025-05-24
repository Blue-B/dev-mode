// src/components/Header.jsx
import { NavLink, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isPublicPage = ["/", "/login", "/signup", "/service-intro","/question", "/service-method", "/inquiry", "/ensuring-stability"].includes(location.pathname);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-8 flex justify-between items-center">
      {/* 좌측 로고 */}
      <NavLink to="/" className="flex items-center text-lg font-bold text-black hover:opacity-80">
        <span className="mr-1">◆</span>
        <span>깐부대출</span>
      </NavLink>

      {/* 공공 페이지용 메뉴 */}
      {isPublicPage && (
        <>
          <nav className="hidden md:flex space-x-6 text-sm text-gray-700">
            <NavLink to="/service-intro" className="hover:text-blue-500">서비스 소개</NavLink>
            <NavLink to="/service-method" className="hover:text-blue-500">서비스 방법</NavLink>
            <NavLink to="/ensuring-stability" className="hover:text-blue-500">안전성 보장</NavLink>
            <NavLink to="/question" className="hover:text-blue-500">자주 묻는 질문</NavLink>
            <NavLink to="/inquiry" className="hover:text-blue-500">문의하기</NavLink>
          </nav>

          <div className="flex space-x-3">
            <NavLink to="/login">
              <button className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-600 transition">
                로그인
              </button>
            </NavLink>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
