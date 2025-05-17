import React from 'react';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';


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
    <div className="p-6 bg-white rounded-md">
      <h1 className="text-2xl font-bold mb-2">친구</h1>
      <p className="text-gray-500 mb-4">친구 리스트를 관리할 수 있습니다.</p>

      {/* 검색창 + 추가버튼 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="친구 검색"
                className="flex-1 ml-2 outline-none bg-transparent"
            />
        </div>
        <button className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
            <UserPlusIcon className="w-5 h-5 mr-2" />
            친구 추가
        </button>
      </div>

      {/* 친구 리스트 */}
      <ul className="space-y-4">
        {friends.map((friend, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-4 rounded-md"
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
            <button className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm font-medium">
              View Profile
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Friend;
