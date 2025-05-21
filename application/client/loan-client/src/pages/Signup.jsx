import React from 'react';

const Signup = () => {
  return (
    <>

      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">회원가입</h2>
          <form className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-gray-700 mb-1">이름</label>
              <input
                type="text"
                name="name"
                placeholder="이름 입력"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 주민등록번호 */}
            <div>
              <label className="block text-gray-700 mb-1">주민등록번호</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="ssn1"
                  placeholder="앞 6자리"
                  maxLength="6"
                  className="w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="ssn2"
                  placeholder="뒷 1자리"
                  maxLength="1"
                  className="w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-gray-700 mb-1">전화번호</label>
              <input
                type="tel"
                name="phone"
                placeholder="010-1234-5678"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                name="email"
                placeholder="example@email.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              가입하기
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
