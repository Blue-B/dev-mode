import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://nujgcyryhvogafapepyn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51amdjeXJ5aHZvZ2FmYXBlcHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3OTg0NTgsImV4cCI6MjA2MzM3NDQ1OH0.PMN8j92B3UngKfIwj9Gp5hq9TnsyF6Nv_SBhm3T3JAY"
);

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthNumber: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    profile_image: ''
  });

  // 구글 로그인으로부터 전달받은 정보 처리
  useEffect(() => {
    const initializeFormData = async () => {
      try {
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;

        if (user) {
          // 구글 로그인 사용자의 경우
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            name: user.user_metadata.full_name || '',
            profile_image: user.user_metadata.avatar_url || ''
          }));
        } else if (location.state) {
          // location state를 통해 전달된 데이터가 있는 경우
          setFormData(prev => ({
            ...prev,
            email: location.state.email || '',
            name: location.state.name || '',
            profile_image: location.state.profile_image || ''
          }));
        }
      } catch (error) {
        console.error('사용자 정보 초기화 에러:', error);
      }
    };

    initializeFormData();
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // 성별 값 검증
      if (!['male', 'female', 'other', 'none'].includes(formData.gender)) {
        throw new Error('올바른 성별을 선택해주세요.');
      }

      // 현재 로그인된 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      // 이미 로그인된 사용자가 있는 경우 (구글 로그인)
      if (user) {
        // Profiles 테이블에 사용자 정보 저장
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name: formData.name,
              phone: formData.phone,
              birth_number: formData.birthNumber,
              gender: formData.gender,
              address: formData.address,
              profile_image: formData.profile_image,
              role: 'user'
            }
          ]);

        if (profileError) {
          console.error('프로필 생성 에러:', profileError);
          throw new Error('프로필 생성 실패: ' + profileError.message);
        }
      } else {
        // 일반 회원가입
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Profiles 테이블에 사용자 정보 저장
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name: formData.name,
              phone: formData.phone,
              birth_number: formData.birthNumber,
              gender: formData.gender,
              address: formData.address,
              profile_image: formData.profile_image,
              role: 'user'
            }
          ]);

        if (profileError) {
          console.error('프로필 생성 에러:', profileError);
          throw new Error('프로필 생성 실패: ' + profileError.message);
        }
      }

      alert('회원가입이 완료되었습니다!');
      navigate('/dashboard');
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert('회원가입 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">회원가입</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* 이름 */}
          <div>
            <label className="block text-gray-700 mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름 입력"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-gray-700 mb-1">생년월일</label>
            <input
              type="text"
              name="birthNumber"
              value={formData.birthNumber}
              onChange={handleChange}
              placeholder="YYMMDD"
              maxLength="6"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-gray-700 mb-1">성별</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
              <option value="none">선택안함</option>
            </select>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-gray-700 mb-1">전화번호</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              readOnly={!!location.state} // 구글 로그인으로부터 받은 이메일인 경우 수정 불가
            />
          </div>

          {/* 비밀번호 - 구글 로그인으로부터 온 경우에는 표시하지 않음 */}
          {!location.state && (
            <div>
              <label className="block text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* 주소 */}
          <div>
            <label className="block text-gray-700 mb-1">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="주소 입력"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
