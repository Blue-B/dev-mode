import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function Friend() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [myFriends, setMyFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: '',
    title: '',
    message: ''
  });
  const [timerProgress, setTimerProgress] = useState(100);

  const showNotification = (type, title, message) => {
    setModalContent({ type, title, message });
    setShowModal(true);
    setTimerProgress(100);

    const duration = 3000;
    const interval = 30;
    const steps = duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setTimerProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setShowModal(false);
          return 0;
        }
        return prev - decrement;
      });
    }, interval);
  };

  const handleFriendAdd = async () => {
    if (!searchKeyword) return;
    if (!currentUser?.id) {
      showNotification('error', '로그인 필요', '로그인이 필요합니다.');
      return;
    }

    try {
      // Supabase를 통한 친구 추가
      const { data: targetUser, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchKeyword)
        .single();

      if (searchError || !targetUser) {
        showNotification('error', '사용자 없음', '해당 이메일의 사용자를 찾을 수 없습니다.');
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('friend_user_id', targetUser.id)
        .maybeSingle();

      if (existing && existing.status === 'pending') {
        showNotification('error', '중복 요청', '이미 친구 요청을 보냈습니다.');
        return;
      }

      const { error: insertError } = await supabase.from('friends').insert([
        {
          user_id: currentUser.id,
          friend_user_id: targetUser.id,
          status: 'pending',
        },
      ]);

      if (insertError) {
        showNotification('error', '요청 실패', insertError.message);
      } else {
        showNotification('success', '요청 완료', '친구 요청을 보냈습니다!');
        setSearchKeyword('');
      }

      // 백엔드 API를 통한 친구 추가
      await axios.post('/api/friends/add', {
        userId: currentUser.id,
        friendEmail: searchKeyword,
      });
    } catch (error) {
      console.error('친구 추가 처리 중 오류:', error);
      showNotification('error', '요청 실패', '알 수 없는 오류가 발생했습니다.');
    }
  };

  const fetchReceivedRequests = async () => {
    if (!currentUser?.id) return;

    try {
      // Supabase를 통한 요청 목록 가져오기
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

      // 백엔드 API를 통한 요청 목록 가져오기
      const response = await axios.get('/api/friends', {
        params: { userId: currentUser.id, type: 'received' },
      });

      setReceivedRequests(response.data.requests || []);
    } catch (error) {
      console.error('요청 목록 처리 중 오류:', error);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser?.id) return;

    try {
      // Supabase를 통한 친구 목록 가져오기
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
        const friendsList = await Promise.all(
          data.map(async (f) => {
            const isRequester = f.user_id === currentUser.id;
            const otherUserId = isRequester ? f.friend_user_id : f.user_id;

            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', otherUserId)
              .single();

            return {
              id: f.id,
              profile: profileData,
            };
          })
        );

        setMyFriends(friendsList);
      }

      // 백엔드 API를 통한 친구 목록 가져오기
      const response = await axios.get('/api/friends', {
        params: { userId: currentUser.id, type: 'friends' },
      });

      setMyFriends(response.data.friends || []);
    } catch (error) {
      console.error('친구 목록 처리 중 오류:', error);
    }
  };

  const respondToRequest = async (friendRequestId, accept = true) => {
    try {
      // Supabase를 통한 요청 응답 처리
      const { error } = await supabase
        .from('friends')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', friendRequestId);

      if (error) {
        showNotification('error', '처리 실패', error.message);
      } else {
        showNotification('success', '요청 처리 완료', accept ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.');
        fetchReceivedRequests();
        fetchFriends();
      }

      // 백엔드 API를 통한 요청 응답 처리
      await axios.patch('/api/friends/request', {
        requestId: friendRequestId,
        accept,
      });
    } catch (error) {
      console.error('친구 요청 처리 중 오류:', error);
      showNotification('error', '처리 실패', '알 수 없는 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFriends();
      fetchReceivedRequests();
    }
  }, [currentUser]);

  return (
    <div className="p-6 bg-white rounded-md">
      <h1 className="mb-2 text-2xl font-bold">친구</h1>
      <p className="mb-4 text-gray-500">친구 리스트를 관리할 수 있습니다.</p>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이메일로 친구 추가"
            className="flex-1 ml-2 bg-transparent outline-none"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFriendAdd()}
          />
        </div>
        <button
          onClick={handleFriendAdd}
          className="flex items-center px-4 py-2 text-white transition bg-black rounded-md hover:bg-gray-800"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          친구 추가
        </button>
      </div>

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
                <p className="text-sm text-gray-500">친구 상태: 연결됨</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-full hover:bg-gray-200">
              View Profile
            </button>
          </li>
        ))}
      </ul>

      {receivedRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">받은 친구 요청</h2>
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
                    className="px-3 py-1 text-sm text-white bg-green-500 rounded-md hover:bg-green-600"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => respondToRequest(request.id, false)}
                    className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                  >
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-sm p-6 mx-4 transition-all transform bg-white rounded-lg shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-gray-200 rounded-t-lg">
              <div
                className="h-full transition-all duration-300 ease-linear bg-blue-500"
                style={{ width: `${timerProgress}%` }}
              />
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="absolute text-gray-400 top-2 right-2 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mt-1">
              {modalContent.type === 'success' ? (
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              ) : (
                <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalContent.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {modalContent.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Friend;
