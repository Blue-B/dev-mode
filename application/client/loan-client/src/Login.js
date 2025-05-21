import React from "react";

const Login = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center scale-105">
        <h1 className="text-3xl font-bold mb-3">깐부대출에 오신걸 환영합니다.</h1>
        <p className="text-base text-gray-500 mb-7">블록체인 기반 대출 시스템</p>

        <button className="w-full bg-gray-100 border border-gray-300 rounded-full py-3 mb-7 flex items-center justify-center hover:bg-gray-200 text-lg">
          <svg className="w-6 h-6 mr-2" viewBox="0 0 533.5 544.3">
            <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.3-4.1-50.6H272v95.8h146.9c-6.3 33.9-25 62.6-53.4 81.9v68.1h86.4c50.5-46.5 81.6-115.2 81.6-195.2z"/>
            <path fill="#34a853" d="M272 544.3c72.6 0 133.5-24 178-65.1l-86.4-68.1c-23.9 16.1-54.6 25.5-91.6 25.5-70.5 0-130.2-47.6-151.5-111.6h-89.3v69.9c44.5 88.3 135.9 149.4 240.8 149.4z"/>
            <path fill="#fbbc04" d="M120.5 324.9c-10.3-30.2-10.3-62.6 0-92.8v-69.9h-89.3c-39.2 77.8-39.2 169.9 0 247.7l89.3-69.9z"/>
            <path fill="#ea4335" d="M272 107.7c39.6 0 75.1 13.6 103.1 40.3l77.2-77.2c-48.4-44.9-112.5-70.8-180.3-70.8-104.9 0-196.3 61.1-240.8 149.4l89.3 69.9c21.3-64 81-111.6 151.5-111.6z"/>
          </svg>
          구글로 계속하기
        </button>

        <form className="space-y-5">
          <div className="text-left">
            <label className="block text-base font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            />
          </div>
          <div className="text-left">
            <label className="block text-base font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            />
          </div>
          <div className="text-right text-sm">
            <a href="#" className="text-blue-500 hover:underline">비밀번호를 잊으셨나요?</a>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-full text-base hover:bg-blue-600"
          >
            로그인
          </button>
        </form>

        <p className="text-base mt-5">
          계정이 없으신가요?{' '}
          <a href="#" className="text-blue-500 hover:underline">회원가입하기</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
