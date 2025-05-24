import React from "react";
import { NavLink } from "react-router-dom";
import { FaUsers, FaBolt, FaShieldAlt, FaChartLine } from "react-icons/fa";

const ServiceIntro = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white py-3 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <NavLink to="/">
            <div className="text-lg font-bold flex items-center cursor-pointer">
              <span className="text-black mr-1">◆</span>
              <span>깐부 대출</span>
            </div>
          </NavLink>
        </div>

        <div className="hidden md:flex space-x-6 text-sm">
          <NavLink to="/service-intro" className="text-gray-700 hover:text-blue-500">서비스 소개</NavLink>
          <NavLink to="/service-method" className="text-gray-700 hover:text-blue-500">서비스 방법</NavLink>
          <NavLink to="/ensuring-stability" className="text-gray-700 hover:text-blue-500">안전성 보장</NavLink>
          <NavLink to="/question" className="text-gray-700 hover:text-blue-500">자주 묻는 질문</NavLink>
          <NavLink to="/inquiry" className="text-gray-700 hover:text-blue-500">문의하기</NavLink>
        </div>

        <div className="flex space-x-3">
          <NavLink to="/login">
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium">
              로그인
            </button>
          </NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              블록체인 기반의 안전한 P2P 대출 플랫폼
            </h1>
            <p className="text-xl mb-8">
              신용점수와 상관없이 지인의 보증으로 대출이 가능하며,<br />
              스마트계약을 통해 24시간 이내 송금이 이루어집니다.
            </p>
            <NavLink
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition duration-200 inline-block"
            >
              지금 시작하기
            </NavLink>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-blue-500 mb-4">
                <FaUsers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">지인 기반 대출</h3>
              <p className="text-gray-600">
                신용점수와 무관하게 지인의 신뢰로 대출이 가능합니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-blue-500 mb-4">
                <FaBolt className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">빠른 송금</h3>
              <p className="text-gray-600">
                스마트계약으로 24시간 이내 빠른 송금이 이루어집니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-blue-500 mb-4">
                <FaShieldAlt className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">안전한 거래</h3>
              <p className="text-gray-600">
                블록체인과 스마트계약으로 모든 거래가 안전하게 보장됩니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="text-blue-500 mb-4">
                <FaChartLine className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">투명한 이자율</h3>
              <p className="text-gray-600">
                시장 상황에 맞는 공정한 이자율로 대출이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">이용 방법</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">회원가입</h3>
                <p className="text-gray-600">
                  간단한 회원가입 후 구글 계정 또는 이메일로 로그인하세요.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">지인 초대</h3>
                <p className="text-gray-600">
                  대출을 원하는 지인을 플랫폼에 초대하고 친구로 추가하세요.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">대출 신청</h3>
                <p className="text-gray-600">
                  금액, 기간, 이자율을 입력해 대출을 신청하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl text-gray-600 mb-8">
            깐부대출과 함께 안전하고 빠른 대출을 경험해보세요.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <NavLink
              to="/login"
              className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200"
            >
              로그인
            </NavLink>
            <NavLink
              to="/service-method"
              className="bg-gray-100 text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition duration-200"
            >
              자세히 알아보기
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceIntro; 