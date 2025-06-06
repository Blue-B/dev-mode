// src/components/Header.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NavSmall from "./NavSmall";
import React, { useState } from "react";
import avatar from "../assets/avatar.png"; // 기본 이미지 경로를 맞게 수정하세요.
import logo from "../assets/logo2.png";

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isPublicPage = ["/", "/login", "/signup", "/service-intro", "/question", "/service-method", "/inquiry", "/ensuring-stability"].includes(location.pathname);
  const [showNavSmall, setShowNavSmall] = useState(false);

  const toggleNav = () => {
    setShowNavSmall(!showNavSmall);
  };

  return (
    <header className="relative flex items-center px-4 py-3 bg-white border-b border-gray-200 md:px-8">
      {/* 좌측 로고 */}
      <NavLink to="/" className="flex items-center text-lg font-bold text-black hover:opacity-80">
        <img src={logo} alt="깐부대출 로고" className="w-8 h-8 mr-2" />
        <span>깐부대출</span>
      </NavLink>

      {/* 공공 페이지용 메뉴 */}
      {isPublicPage && (
        <>
          <nav className="hidden md:flex items-center space-x-8 text-sm text-gray-700 ml-12">
            <NavLink to="/service-intro" className="hover:text-blue-500">서비스 소개</NavLink>
            <NavLink to="/inquiry" className="hover:text-blue-500">문의하기</NavLink>
            <NavLink to="/blog" className="hover:text-blue-500">블로그</NavLink>
            <NavLink to="/partners" className="hover:text-blue-500">제휴사</NavLink>
            <NavLink to="/careers" className="hover:text-blue-500">채용</NavLink>
          </nav>

          <div className="flex items-center justify-center space-x-3 ml-auto">
            {user ? (
              <button
                onClick={toggleNav}
                className="flex items-center"
              >
                <img
                  src={user.profilePicture || avatar}
                  alt="프로필"
                  className="w-8 h-8 rounded-full"
                />
              </button>
            ) : (
              <NavLink to="/login">
                <button className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-600 transition">
                  로그인
                </button>
              </NavLink>
            )}
          </div>

          {showNavSmall && (
            <NavSmall isVisible={showNavSmall} onClose={() => setShowNavSmall(false)} />
          )}
        </>
      )}
    </header>
  );
};

export default Header;
