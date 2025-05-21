import React from "react";

const Dashboard = () => {
  return (
    <div className="bg-white text-gray-800 p-10 text-[17px]">
      {/* 상단 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">신용 점수</p>
          <p className="text-3xl font-bold">850 <span className="text-green-500 text-base">▲2.5%</span></p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">활성 대출</p>
          <p className="text-3xl font-bold">2 <span className="text-base">총 1,000,000 KRW</span></p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">대출 상환율</p>
          <p className="text-3xl font-bold">98%</p>
          <p className="text-xs text-gray-400">지난 12개월</p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">이용 가능한 한도</p>
          <p className="text-3xl font-bold">3,000,000 KRW</p>
          <p className="text-xs text-gray-400">최대 한도</p>
        </div>
      </div>

      {/* 친구 대출 요청 */}
      <div className="p-8 border rounded-xl mb-12">
        <h2 className="text-xl font-semibold mb-6">친구 대출 요청</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center border rounded-lg px-4 py-3">
            <input
              type="text"
              placeholder="금액을 입력하세요"
              className="flex-grow outline-none placeholder-gray-400 text-lg"
            />
            <span className="text-gray-400 ml-2">KRW</span>
          </div>
          <select className="border px-4 py-3 rounded-lg w-full text-lg">
            <option>3개월</option>
          </select>
          <input
            type="text"
            placeholder="연 이자율 입력"
            className="border px-4 py-3 rounded-lg w-full text-lg"
          />
          <select className="border px-4 py-3 rounded-lg w-full text-lg">
            <option>친구를 선택하세요</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button className="border px-6 py-2 rounded-lg">취소</button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">계약서 생성</button>
        </div>
      </div>

      {/* 최근 활동 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 border rounded-xl">
            <div className="flex items-center space-x-4">
              <img src="https://via.placeholder.com/40" className="rounded-full" alt="user1" />
              <div>
                <p className="text-base">김철수님이 대출을 요청했습니다</p>
                <p className="text-sm text-gray-500">500,000 KRW • 3개월</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <span className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-md">수락</span>
              <span className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md">거절</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-5 border rounded-xl">
            <div className="flex items-center space-x-4">
              <img src="https://via.placeholder.com/40" className="rounded-full" alt="user2" />
              <div>
                <p className="text-base">이영희님이 상환했습니다</p>
                <p className="text-sm text-gray-500">300,000 KRW</p>
              </div>
            </div>
            <span className="text-green-600 text-sm flex items-center space-x-1">
              <span className="text-xl">✔</span> <span>완료</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
