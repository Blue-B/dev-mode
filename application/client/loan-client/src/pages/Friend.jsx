import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function Friend() {
  //친구추가용
  const [searchKeyword, setSearchKeyword] = React.useState('');
  //친구목록불러오기용
  const [myFriends, setMyFriends] = useState([]);
  //친구요청목록 불러오기
  const [receivedRequests, setReceivedRequests] = useState([]);
  //현재 로그인한 유저
  const [currentUser, setCurrentUser] = useState(null);

  //친구요청 수락/거절
  const respondToRequest = async (friendRequestId, accept = true) => {
  const { error } = await supabase
    .from('friends')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', friendRequestId);

  if (error) {
    alert('처리 실패: ' + error.message);
  } else {
    alert(accept ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.');
    fetchReceivedRequests(); // 리스트 갱신
    fetchFriends(); // 친구 목록도 갱신
  }
};

//친구요청목록 불러오기
const fetchReceivedRequests = async () => {
  if (!currentUser?.id) return;

  const { data, error } = await supabase
    .from('friends')
    .select(`
      id,
      user_id,
      profiles:user_id ( email, name )
    `)
    .eq('friend_user_id', currentUser.id)
    .eq('status', 'pending');

  if (error) {
    console.error('요청 목록 불러오기 실패:', error);
  } else {
    setReceivedRequests(data);
  }
};

//친구목록불러오기
const fetchFriends = async () => {
  if (!currentUser?.id) return;

  const { data, error } = await supabase
  .from('friends')
  .select(`
    id,
    user_id,
    friend_user_id,
    profiles:friend_user_id ( email, name )
  `)
  .or(`user_id.eq.${currentUser.id},friend_user_id.eq.${currentUser.id}`)
  .eq('status', 'accepted');


  if (error) {
    console.error('친구 목록 불러오기 실패:', error);
  } else {
    // ✅ 내 user_id가 friends.friend_user_id일 때, user_id로 상대방 조회해야 하므로 보정
    const friendsList = await Promise.all(
      data.map(async (f) => {
        const isRequester = f.user_id === currentUser.id;

        // 상대방 ID 결정
        const otherUserId = isRequester ? f.friend_user_id : f.user_id;

        // 상대방 프로필 가져오기
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', otherUserId)
          .single();

        return {
          id: f.id,
          profile: profileData, // 상대방 프로필 정보
        };
      })
    );

    setMyFriends(friendsList);
  }
};

//친구추가
 const handleFriendAdd = async () => {
  if (!searchKeyword) return;
  if (!currentUser?.id) return alert('로그인이 필요합니다.');

  const { data: targetUser, error: searchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', searchKeyword)
    .single();

  if (searchError || !targetUser) {
    return alert('해당 이메일의 사용자를 찾을 수 없습니다.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('friend_user_id', targetUser.id)
    .maybeSingle();

  if (existing && existing.status === 'pending') {
    return alert('이미 친구 요청을 보냈습니다.');
  }

  const { error: insertError } = await supabase.from('friends').insert([
    {
      user_id: currentUser.id,
      friend_user_id: targetUser.id,
      status: 'pending',
    },
  ]);

  if (insertError) {
    alert('친구 요청 실패: ' + insertError.message);
  } else {
    alert('친구 요청을 보냈습니다!');
    setSearchKeyword('');
  }
};
  //user 설정(로그인)
  useEffect(() => {
  const fetchUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (user) setCurrentUser(user);
  };
  fetchUser();
}, []);

//user가 설정된 후에 실행되어야 함
useEffect(() => {
  if (currentUser?.id) {
    fetchFriends();
    fetchReceivedRequests();
  }
}, [currentUser]);

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
          placeholder="이메일로 친구 추가"
          className="flex-1 ml-2 outline-none bg-transparent"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFriendAdd()}
        />
      </div>
      <button
        onClick={handleFriendAdd}
        className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
      >
        <UserPlusIcon className="w-5 h-5 mr-2" />
        친구 추가
      </button>
    </div>

    {/* 친구 리스트 */}
    <ul className="space-y-4">
      {myFriends.map((friend, index) => (
        <li
          key={friend.id || index}
          className="flex items-center justify-between p-4 rounded-md"
        >
          <div className="flex items-center gap-4">
            <img
              src={`https://via.placeholder.com/48?text=${friend.profile?.name?.[0] || '🙂'}`}
              alt={friend.profile?.name || '친구'}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium">
                {friend.profile?.name || friend.profile?.email || '이름 없음'}
              </p>
              <p className="text-sm text-gray-500">
                친구 상태: 연결됨
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm font-medium">
            View Profile
          </button>
        </li>
      ))}
    </ul>

    {/* 받은 친구 요청 */}
    {receivedRequests.length > 0 && (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">받은 친구 요청</h2>
        <ul className="space-y-4">
          {receivedRequests.map((request) => (
            <li
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-md"
            >
              <div>
                <p className="font-medium">
                  {request.profiles?.name || request.profiles?.email}
                </p>
                <p className="text-sm text-gray-500">친구 요청 도착</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respondToRequest(request.id, true)}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                >
                  수락
                </button>
                <button
                  onClick={() => respondToRequest(request.id, false)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  거절
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

}

export default Friend;
