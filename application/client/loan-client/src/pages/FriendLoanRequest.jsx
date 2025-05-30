import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FriendLoanRequest = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState(5);
  const [duration, setDuration] = useState(12);
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: 대출 조건, 2: 친구 선택

  const friends = [
    { name: '김철수', avatar: 'https://via.placeholder.com/40', online: true },
    { name: '이영희', avatar: 'https://via.placeholder.com/40', online: false },
    { name: '박민수', avatar: 'https://via.placeholder.com/40', online: true },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* 제목 */}
        <h2 className="text-base font-semibold text-blue-700 mb-1">친구에게 대출 요청</h2>
        <p className="text-sm text-gray-500 mb-6">신뢰할 수 있는 친구로부터 안전하게 대출을 받아보세요</p>

        {/* 단계 표시 */}
        <div className="flex items-center text-sm text-gray-400 mb-6 space-x-2">
          <span className={step === 1 ? 'text-blue-600 font-semibold' : ''}>1. 대출 조건</span>
          <span>›</span>
          <span className={step === 2 ? 'text-blue-600 font-semibold' : ''}>2. 친구 선택</span>
          <span>›</span>
          <span>3. 요청 전송</span>
        </div>

        {/* 카드 */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
          {/* STEP 1: 대출 조건 입력 */}
          {step === 1 && (
            <>
              <div>
                <label className="font-semibold block mb-1">대출 금액</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border px-4 py-2 rounded-md text-right"
                  placeholder="대출금액을 입력해주세요"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1000000, 3000000, 5000000, 10000000].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm"
                    >
                      {val.toLocaleString()}원
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">희망 이자율</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={interest}
                  onChange={e => setInterest(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1 flex justify-between">
                  <span>무이자 0%</span>
                  <span>적정 3%</span>
                  <span>권장 5%</span>
                  <span>{interest}%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">상환 기간</label>
                <select
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full border px-4 py-2 rounded-md"
                >
                  {[3, 6, 12, 24, 36].map(month => (
                    <option key={month} value={month}>{month}개월</option>
                  ))}
                  <option value={0}>직접입력</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">상환일: <span className="font-medium">2026. 5. 24.</span></p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">대출자 (보내는 사람)</label>
                  <input
                    type="text"
                    value="나"
                    disabled
                    className="w-full border px-4 py-2 rounded-md bg-gray-100 text-center"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">차입자 (받는 친구)</label>
                  <input
                    type="text"
                    value={receiver}
                    onChange={e => setReceiver(e.target.value)}
                    className="w-full border px-4 py-2 rounded-md"
                    placeholder="친구 이름을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">요청 메시지 (선택사항)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full border px-4 py-2 rounded-md"
                  placeholder="친구에게 전달할 메시지를 입력해주세요"
                  maxLength={150}
                />
              </div>

              <div className="border-t pt-4 text-sm text-gray-700 space-y-1">
                <p>대출 금액 <strong>{amount ? `${parseInt(amount).toLocaleString()}원` : '0원'}</strong></p>
                <p>연 이자율 <strong>{interest}%</strong></p>
                <p>상환 기간 <strong>{duration}개월</strong></p>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="w-1/2 py-2 rounded-md border text-gray-700 hover:bg-gray-100">
                  임시저장
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-1/2 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  다음 단계: 친구 선택
                </button>
              </div>
            </>
          )}

          {/* STEP 2: 친구 선택 */}
          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-2">대출을 요청할 친구를 선택하세요</h3>
              <ul className="divide-y">
                {friends.map(friend => (
                  <li
                    key={friend.name}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 px-2 rounded"
                    onClick={() => {
                      setReceiver(friend.name);
                      alert(`${friend.name}님에게 요청할 준비가 되었습니다.`);
                      navigate('/dashboard'); // 다음 단계로 이동
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className={`text-sm ${friend.online ? 'text-green-500' : 'text-gray-400'}`}>
                          {friend.online ? '접속 중' : '오프라인'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-blue-600">요청</span>
                  </li>
                ))}
              </ul>
              <button
                className="mt-6 w-full py-2 rounded-md border text-gray-600 hover:bg-gray-100"
                onClick={() => setStep(1)}
              >
                이전 단계로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendLoanRequest;
