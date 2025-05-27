import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const Inquiry = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 로그인된 유저 정보 자동 입력
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setForm((prev) => ({
          ...prev,
          name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          email: user.email || ""
        }));
      }
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 실제로는 서버로 문의 내용 전송 필요
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">1:1 문의하기</h1>
        {submitted ? (
          <div className="text-center">
            <p className="text-blue-600 font-semibold mb-4">문의가 정상적으로 접수되었습니다.</p>
            <p className="text-gray-500 text-sm">빠른 시일 내에 답변드리겠습니다.</p>
            <NavLink to="/" className="inline-block mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition">메인으로 돌아가기</NavLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-8 rounded-xl shadow">
            <div>
              <label className="block text-gray-700 mb-1">이름</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                readOnly={!!form.name}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                readOnly={!!form.email}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">문의 내용</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              문의하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Inquiry;
