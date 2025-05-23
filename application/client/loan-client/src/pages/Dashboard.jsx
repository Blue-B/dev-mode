import React, { useState } from "react";

const initialActivities = [
  {
    id: 1,
    user: "김철수",
    type: "request",
    amount: "500,000 KRW",
    period: "3개월",
    status: null, // null | 'accepted' | 'rejected'
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: 2,
    user: "이영희",
    type: "repay",
    amount: "300,000 KRW",
    status: "done",
    avatar: "https://via.placeholder.com/40",
  },
];

const Dashboard = () => {
  const [activities, setActivities] = useState(initialActivities);

  const handleAction = (id, action) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: action } : item
      )
    );
  };

  return (
    <div className="bg-white text-gray-800 p-10 text-[17px]">
      {/* 상단 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">신용 점수</p>
          <p className="text-3xl font-bold">850</p>
          <p className="text-base text-green-500 mt-2">▲2.5%</p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">활성 대출</p>
          <p className="text-3xl font-bold">2</p>
          <p className="text-base mt-2">총 1,000,000 KRW</p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">대출 상환율</p>
          <p className="text-3xl font-bold">98%</p>
          <p className="text-base text-gray-400">지난 12개월</p>
        </div>
        <div className="p-6 border rounded-xl">
          <p className="text-sm text-gray-500">이용 가능한 한도</p>
          <p className="text-2xl font-bold">3,000,000 KRW</p>
          <p className="text-base text-gray-400">최대 한도</p>
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
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            계약서 생성
          </button>
        </div>
      </div>

      {/* 최근 활동 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-5 border rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={activity.avatar}
                  className="rounded-full"
                  alt={activity.user}
                />
                <div>
                  {activity.type === "request" ? (
                    <>
                      <p className="text-base">
                        {activity.user}님이 대출을 요청했습니다
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.amount} • {activity.period}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base">{activity.user}님이 상환했습니다</p>
                      <p className="text-sm text-gray-500">{activity.amount}</p>
                    </>
                  )}
                </div>
              </div>
              {/* 수락/거절/완료 버튼 */}
              {activity.type === "request" ? (
                activity.status === null ? (
                  <div className="flex space-x-2">
                    <button
                      className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-md hover:bg-green-100 transition"
                      onClick={() => handleAction(activity.id, "accepted")}
                    >
                      수락
                    </button>
                    <button
                      className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition"
                      onClick={() => handleAction(activity.id, "rejected")}
                    >
                      거절
                    </button>
                  </div>
                ) : activity.status === "accepted" ? (
                  <span className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-md">
                    수락됨
                  </span>
                ) : (
                  <span className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md">
                    거절됨
                  </span>
                )
              ) : (
                <span className="text-green-600 text-sm flex items-center space-x-1">
                  <span className="text-xl">✔</span> <span>완료</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
