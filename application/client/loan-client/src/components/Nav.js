// Nav.js
import React from "react";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  WalletIcon,
  UserIcon,
  Cog8ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/solid";
import { NavLink, useLocation } from "react-router-dom";

const Nav = () => {
  const location = useLocation();

  // 메인 페이지에서는 Nav 숨김 처리
  if (location.pathname === "/") {
    return null;
  }

  const navItems = [
    { label: "대시보드", icon: <HomeIcon className="w-5 h-5 blacks" />, path: "/dashboard" },
    { label: "대출풀", icon: <ChartBarIcon className="w-5 h-5" />, path: "/loanpool" },
    { label: "친구", icon: <UsersIcon className="w-5 h-5" />, path: "/friend" },
    { label: "자금현황", icon: <WalletIcon className="w-5 h-5" />, path: "/financial-status" },
    { label: "내 정보", icon: <UserIcon className="w-5 h-5" />, path: "/mypage" },
  ];

  return (
    <div className="w-96  p-4 flex flex-col justify-between h-[calc(100vh-74px)] border-r">
      <div>
        {/* 상단 사용자 정보 */}
        <div className="flex items-center mb-6">
          <img
            src="https://i.pravatar.cc/100"
            alt="avatar"
            className="w-16 h-16 rounded-full mb-2  mr-4"
          />
          <div className="flex-col">
            <div className=" font-semibold">내 자금</div>
            <div className="text-sm text-gray-500">잔액: 0.00 KRW</div>
          </div>
        
        </div>

        {/* 네비게이션 목록 */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 ${
                  isActive ? "bg-gray-100 font-semibold" : ""
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 하단 설정, 도움말, 로그아웃 */}
      <div className="flex flex-col gap-1">
        <NavLink
          to="/setting"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-full ${
              isActive ? "bg-gray-100 font-semibold" : ""
            }`
          }
        >
          <Cog8ToothIcon className="w-5 h-5" />
          설정
        </NavLink>
        <button className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-full">
          <QuestionMarkCircleIcon className="w-5 h-5" />
          Help
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-full">
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500" />
          로그 아웃
        </button>
      </div>
    </div>
  );
};

export default Nav;