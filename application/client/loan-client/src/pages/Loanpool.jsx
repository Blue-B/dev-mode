
import React from "react";

const LoanPool = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 상단 버튼 */}
      <div className="flex justify-end gap-2 mb-6">
        <button className="flex items-center px-3 py-1.5 bg-white border text-sm text-blue-600 border-blue-600 rounded-md">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          지갑 연결됨
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">+ 새 풀 만들기</button>
      </div>

      {/* 새 대출풀 만들기 */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">새 대출풀 만들기</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">풀 이름</label>
            <input className="w-full border rounded-md p-2 text-sm" placeholder="풀 이름을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm mb-1">총 모집 금액</label>
            <input className="w-full border rounded-md p-2 text-sm" placeholder="KRW" />
          </div>
          <div>
            <label className="block text-sm mb-1">참여자 최소 예치금</label>
            <input className="w-full border rounded-md p-2 text-sm" placeholder="KRW" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">예상 이자율 범위</label>
              <input className="w-full border rounded-md p-2 text-sm" placeholder="최소 %" />
            </div>
            <div className="flex-1 mt-[1.75rem]">
              <input className="w-full border rounded-md p-2 text-sm" placeholder="최대 %" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">풀 유지 기간</label>
            <select className="w-full border rounded-md p-2 text-sm">
              <option>3개월</option>
              <option>6개월</option>
              <option>12개월</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">풀 생성하기</button>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold">활성 대출풀</h3>
        <div className="flex gap-2">
          <select className="border rounded-md p-2 text-sm">
            <option>최신순</option>
            <option>이자율순</option>
          </select>
          <select className="border rounded-md p-2 text-sm">
            <option>전체 상태</option>
            <option>모집중</option>
            <option>모집완료</option>
          </select>
        </div>
      </div>

      {/* 대출풀 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 카드 1 */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>착한 아이들 대출 A</span>
            <span className="text-blue-600">모집중</span>
          </div>
          <p className="text-sm">총 모집액 <strong>100,000,000 KRW</strong></p>
          <p className="text-sm">참여자 수 <strong>12/20</strong></p>
          <p className="text-sm">이자율 <strong>5.5%</strong></p>
          <p className="text-sm mb-4">남은 기간 <strong>23일</strong></p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm">참여하기</button>
        </div>

        {/* 카드 2 */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>직장인 대출 B</span>
            <span className="text-green-500">모집완료</span>
          </div>
          <p className="text-sm">총 모집액 <strong>50,000,000 KRW</strong></p>
          <p className="text-sm">참여자 수 <strong>20/20</strong></p>
          <p className="text-sm">이자율 <strong>4.8%</strong></p>
          <p className="text-sm mb-4">남은 기간 <strong>완료</strong></p>
          <button className="w-full bg-gray-200 text-gray-500 py-2 rounded-md text-sm cursor-not-allowed">모집 완료</button>
        </div>

        {/* 카드 3 */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>3천만원 대출 C</span>
            <span className="text-blue-600">모집중</span>
          </div>
          <p className="text-sm">총 모집액 <strong>30,000,000 KRW</strong></p>
          <p className="text-sm">참여자 수 <strong>8/15</strong></p>
          <p className="text-sm">이자율 <strong>6.2%</strong></p>
          <p className="text-sm mb-4">남은 기간 <strong>5일</strong></p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm">참여하기</button>
        </div>
      </div>
    </div>
  );
};

export default LoanPool;