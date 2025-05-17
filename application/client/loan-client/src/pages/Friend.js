import React from 'react';

const friends = [
  {
    name: 'Friend 1',
    lastActive: '2시간 전',
    avatar: 'https://via.placeholder.com/48?text=😀',
  },
  {
    name: 'Friend 2',
    lastActive: '하루 전',
    avatar: 'https://via.placeholder.com/48?text=🧑‍🎤',
  },
  {
    name: 'Friend 3',
    lastActive: '3일 전',
    avatar: 'https://via.placeholder.com/48?text=🧓',
  },
];

function Friend() {
  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-2">친구</h1>
      <p className="text-gray-500 mb-4">친구 리스트를 관리할 수 있습니다.</p>

      {/* 검색창 + 추가버튼 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="친구 검색"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
          친구 추가
        </button>
      </div>

      {/* 친구 리스트 */}
      <ul className="space-y-4">
        {friends.map((friend, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
          >
            <div className="flex items-center gap-4">
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{friend.name}</p>
                <p className="text-sm text-gray-500">
                  마지막 활성 시간: {friend.lastActive}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium">
              View Profile
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Friend;
