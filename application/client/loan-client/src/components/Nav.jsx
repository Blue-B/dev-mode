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
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import avatar from "../assets/avatar.png";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://nujgcyryhvogafapepyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51amdjeXJ5aHZvZ2FmYXBlcHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3OTg0NTgsImV4cCI6MjA2MzM3NDQ1OH0.PMN8j92B3UngKfIwj9Gp5hq9TnsyF6Nv_SBhm3T3JAY"
);

const Nav = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('로그아웃 에러:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };


  const navItems = [
    { label: "대시보드", icon: <HomeIcon className="w-5 h-5" />, path: "/dashboard" },
    { label: "대출풀", icon: <ChartBarIcon className="w-5 h-5" />, path: "/loanpool" },
    { label: "친구", icon: <UsersIcon className="w-5 h-5" />, path: "/friend" },
    { label: "자금현황", icon: <WalletIcon className="w-5 h-5" />, path: "/financialstatus" },
    { label: "내 정보", icon: <UserIcon className="w-5 h-5" />, path: "/mypage" },
  ];

  return (
    <aside className="w-full max-w-[240px] flex flex-col min-h-0 h-full border-r px-4 py-6 bg-white">
      <div className="flex flex-col h-0 min-h-0 flex-1 overflow-y-auto">
        {/* 상단 사용자 정보 */}
        <div className="flex items-center mb-6">
          <img
            src={avatar}
            alt="avatar"
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <div className="font-semibold text-base">내 자금</div>
            <div className="text-sm text-gray-500">잔액: 0.00 KRW</div>
          </div>
        </div>

        {/* 네비게이션 목록 */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition ${
                  isActive ? "bg-gray-100 font-semibold" : ""
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 하단 설정/도움말/로그아웃 */}
        <div className="flex flex-col gap-1 pt-6 border-t mt-6">
          <NavLink
            to="/setting"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition ${
                isActive ? "bg-gray-100 font-semibold" : ""
              }`
            }
          >
            <Cog8ToothIcon className="w-5 h-5" />
            설정
          </NavLink>
          <button className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            Help
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-md hover:bg-red-50 transition"
          >
            <ArrowRightOnRectangleIcon 
              onClick={handleLogout}
            className="w-5 h-5 text-red-500" />
            로그 아웃
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Nav;
