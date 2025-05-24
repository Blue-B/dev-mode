import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// 환경변수 또는 실제 발급받은 키로 대체하세요
const supabase = createClient(
  "https://nujgcyryhvogafapepyn.supabase.co", // Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51amdjeXJ5aHZvZ2FmYXBlcHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3OTg0NTgsImV4cCI6MjA2MzM3NDQ1OH0.PMN8j92B3UngKfIwj9Gp5hq9TnsyF6Nv_SBhm3T3JAY" // Supabase public anon key
);

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/signup",
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // 구글 로그인 성공 후 프로필 정보 확인
      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          // 프로필이 이미 있으면 대시보드로 이동
          navigate("/dashboard");
        } else {
          // 프로필이 없으면 회원가입 페이지로 이동
          navigate("/signup", { 
            state: { 
              email: data.user.email,
              name: data.user.user_metadata.full_name,
              profile_image: data.user.user_metadata.avatar_url
            } 
          });
        }
      }
    } catch (error) {
      alert("구글 로그인 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 이메일/비밀번호 로그인 핸들러
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // 로그인 성공 시 대시보드로 이동
      navigate("/dashboard");
    } catch (error) {
      alert("로그인 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center scale-105">
        <h1 className="text-3xl font-bold mb-3">깐부대출에 오신걸 환영합니다.</h1>
        <p className="text-base text-gray-500 mb-7">블록체인 기반 대출 시스템</p>

        <button
          className="w-full bg-gray-100 border border-gray-300 rounded-full py-3 mb-7 flex items-center justify-center hover:bg-gray-200 text-lg disabled:opacity-50"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="w-6 h-6 mr-2" viewBox="0 0 533.5 544.3">
            <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.3-4.1-50.6H272v95.8h146.9c-6.3 33.9-25 62.6-53.4 81.9v68.1h86.4c50.5-46.5 81.6-115.2 81.6-195.2z"/>
            <path fill="#34a853" d="M272 544.3c72.6 0 133.5-24 178-65.1l-86.4-68.1c-23.9 16.1-54.6 25.5-91.6 25.5-70.5 0-130.2-47.6-151.5-111.6h-89.3v69.9c44.5 88.3 135.9 149.4 240.8 149.4z"/>
            <path fill="#fbbc04" d="M120.5 324.9c-10.3-30.2-10.3-62.6 0-92.8v-69.9h-89.3c-39.2 77.8-39.2 169.9 0 247.7l89.3-69.9z"/>
            <path fill="#ea4335" d="M272 107.7c39.6 0 75.1 13.6 103.1 40.3l77.2-77.2c-48.4-44.9-112.5-70.8-180.3-70.8-104.9 0-196.3 61.1-240.8 149.4l89.3 69.9c21.3-64 81-111.6 151.5-111.6z"/>
          </svg>
          {loading ? "로그인 중..." : "구글로 계속하기"}
        </button>

        <form className="space-y-5" onSubmit={handleEmailLogin}>
          <div className="text-left">
            <label className="block text-base font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              required
            />
          </div>
          <div className="text-left">
            <label className="block text-base font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-5 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              required
            />
          </div>
          <div className="text-right text-sm">
            <NavLink to="/password" className="text-blue-500 hover:underline">비밀번호를 잊으셨나요?</NavLink>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-full text-base hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-base mt-5">
          계정이 없으신가요?{' '}
          <NavLink to="/signup" className="text-blue-500 hover:underline">회원가입하기</NavLink>
        </p>
      </div>
    </div>
  );
};

export default Login;
