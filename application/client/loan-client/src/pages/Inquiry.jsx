import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import ReCAPTCHA from "react-google-recaptcha";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const Inquiry = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef(null);

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
    setError(""); // 입력이 변경될 때마다 에러 메시지 초기화
  };

  // 메시지 길이 체크 함수
  const checkMessageLength = (text) => {
    return text.trim().length >= 20;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // 메시지 길이 체크
      if (!checkMessageLength(form.message)) {
        setError("문의 내용은 20자 이상 입력해주세요.");
        return;
      }

      // reCAPTCHA 검증
      const captchaToken = await recaptchaRef.current.executeAsync();
      if (!captchaToken) {
        setError("캡챠 인증이 필요합니다.");
        return;
      }

      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('로그인이 필요합니다.');
      }

      // 백엔드 API 호출
      const response = await fetch('http://localhost:8001/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...form,
          captchaToken
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '문의 접수 중 오류가 발생했습니다.');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('문의하기 에러:', err);
      if (err.message === '로그인이 필요합니다.') {
        setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      } else {
        setError(err.message || "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
                placeholder="문의 내용을 20자 이상 입력해주세요."
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              size="invisible"
              badge="bottomright"
              onError={(err) => {
                console.error('reCAPTCHA 에러:', err);
                setError('캡챠 인증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                setIsSubmitting(false);
              }}
              onExpired={() => {
                console.log('reCAPTCHA 만료됨');
                setError('캡챠 인증이 만료되었습니다. 다시 시도해주세요.');
                setIsSubmitting(false);
              }}
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "처리 중..." : "문의하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Inquiry;
