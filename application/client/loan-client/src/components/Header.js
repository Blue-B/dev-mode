// Header.js
import React from "react";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isMainPage = location.pathname === "/";

  return (
    <header
    className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-white border-b ${
        isMainPage ? "rounded-xl border border-gray-300 mt-2 mx-2" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.1583 7.7087C13.4526 7.6454 13.5621 7.68626 13.586 7.69776C13.5958 7.7183 13.6182 7.78563 13.6027 7.9445C13.5802 8.17513 13.4834 8.5015 13.2857 8.91C12.8933 9.721 12.1695 10.721 11.1952 11.6952C10.221 12.6695 9.22103 13.3933 8.40999 13.7857C8.00149 13.9834 7.67513 14.0802 7.44449 14.1027C7.28566 14.1182 7.21833 14.0958 7.19776 14.086C7.18626 14.0621 7.14539 13.9526 7.20869 13.6583C7.28536 13.3018 7.48959 12.8219 7.83456 12.2605C8.25246 11.5805 8.84986 10.8248 9.58733 10.0873C10.3248 9.34986 11.0805 8.75243 11.7605 8.33453C12.3219 7.9896 12.8018 7.78536 13.1583 7.7087ZM1.47059 10.2467L6.25319 15.0293C6.62706 15.4032 7.13419 15.4726 7.57386 15.4297C8.01946 15.3863 8.50489 15.221 8.99073 14.9859C9.96836 14.5129 11.0872 13.6889 12.138 12.638C13.1889 11.5872 14.0129 10.4684 14.4859 9.49073C14.721 9.0049 14.8863 8.51946 14.9297 8.07386C14.9726 7.6342 14.9032 7.12706 14.5293 6.7532L9.74673 1.97059C9.28419 1.50806 8.62546 1.50854 8.09533 1.62255C7.53599 1.74284 6.91109 2.02803 6.27983 2.41597C5.49923 2.89568 4.66266 3.56114 3.86189 4.3619C3.06114 5.16263 2.39568 5.99923 1.91597 6.77983C1.52803 7.4111 1.24284 8.036 1.12255 8.59533C1.00854 9.12546 1.00806 9.7842 1.47059 10.2467Z" fill="#141414"/>
        </svg>
        <span className="text-xl">
        </span>
        <h1 className="text-lg font-bold">깐부 대출</h1>
      </div>

      {isMainPage ? (
        <nav className="flex gap-6 text-sm text-gray-700 font-medium">
          <a href="#">서비스 소개</a>
          <a href="#">사용 방법</a>
          <a href="#">안전성 보장</a>
          <a href="#">자주 묻는 질문</a>
          <a href="#">문의하기</a>
          <button className="ml-4 px-4 py-1 text-white bg-blue-500 rounded-full hover:bg-blue-600">
            로그인
          </button>
        </nav>
      ) : null}
    </header>
  );
};

export default Header;