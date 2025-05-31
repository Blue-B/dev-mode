import React, {useState, useEffect, useMemo} from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAcceptedFriendsWithWallets, createLoan, getUserWalletAddress } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; 
import { createClient } from '@supabase/supabase-js';
import {v4 as uuidv4} from 'uuid';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
// 임차인이랑 차입자 바뀜, 자금 유동이 안됨
const FriendLoanRequest = () => {
  const navigate = useNavigate();
  const {user} = useAuth();

  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState(5);

  const [duration, setDuration] = useState(12);
  const [customDuration, setCustomDuration] = useState('');

  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: 대출 조건, 2: 친구 선택
  const [friendWallets, setFriendWallets] = useState([]);
  const [userWalletAddress, setUserWalletAddress] = useState('');

  useEffect(() => {
    const fetchUserWallet = async () => {
        if (!user?.id) return;

        try {
        const wallet = await getUserWalletAddress(user.id);
        setUserWalletAddress(wallet);
        } catch (err) {
        console.error('🔍 사용자 지갑 주소 조회 실패:', err.message);
        alert(err.message);
        }
    };

    fetchUserWallet();
  }, [user?.id]);


  useEffect(() => {
    const loadFriendWallets = async () => {
        try {
            const profiles = await fetchAcceptedFriendsWithWallets(user?.id, supabase);
            setFriendWallets(profiles);
        } catch (err) {
            console.error(err.message);
        }
    };

    loadFriendWallets();
  }, [user?.id]);

  // 대출 종료일 계산 함수 (위로 올리되 사용은 아래에서)
  const calculateEndDate = (startDate, months) => {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + months);
  return end;
  };

  const formattedEndDate = useMemo(() => {
    const months = duration === 0 ? parseInt(customDuration) || 0 : duration;
    const endDate = calculateEndDate(new Date(), months);
    return `${endDate.getFullYear()}. ${endDate.getMonth() + 1}. ${endDate.getDate()}.`;
  }, [duration, customDuration]);


  // 대출 요청 생성
  const handleCreateLoan = async (lenderWalletId) => {
    try {
      if (!userWalletAddress || !lenderWalletId || !amount || !duration || !interest) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      if (userWalletAddress === lenderWalletId) {
        alert('대출자와 차입자는 같은 지갑일 수 없습니다.');
        return;
      }

      const loanId = uuidv4();
      const months = duration === 0 ? parseInt(customDuration) : duration;
      const endDate = calculateEndDate(new Date(), months);

      const loanData = {
        id: loanId,
        lender: lenderWalletId,  // 빌려주는 사람
        borrower: userWalletAddress,  // 채무자
        amount: parseInt(amount),
        interestRate: parseFloat(interest),
        durationDays: months * 30,
        endDateTimestamp: endDate.getTime(),
        message,
      };


      await createLoan(loanData);

      alert('대출 요청이 생성되었습니다.');
      navigate('/dashboard');
    } catch (error) {
      console.error('대출 생성 실패:', error);
      alert('대출 생성 실패: ' + (error?.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50">
      <div className="max-w-xl mx-auto">
        {/* 제목 */}
        <h2 className="mb-1 text-base font-semibold text-blue-700">친구에게 대출 요청</h2>
        <p className="mb-6 text-sm text-gray-500">신뢰할 수 있는 친구로부터 안전하게 대출을 받아보세요</p>

        {/* 단계 표시 */}
        <div className="flex items-center mb-6 space-x-2 text-sm text-gray-400">
          <span className={step === 1 ? 'text-blue-600 font-semibold' : ''}>1. 대출 조건</span>
          <span>›</span>
          <span className={step === 2 ? 'text-blue-600 font-semibold' : ''}>2. 친구 선택</span>
          <span>›</span>
          <span>3. 요청 전송</span>
        </div>

        {/* 카드 */}
        <div className="p-6 space-y-6 bg-white shadow-md rounded-xl">
          {/* STEP 1: 대출 조건 입력 */}
          {step === 1 && (
            <>
              <div>
                <label className="block mb-1 font-semibold">대출 금액</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2 text-right border rounded-md"
                  placeholder="대출금액을 입력해주세요"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1000000, 3000000, 5000000, 10000000].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      {val.toLocaleString()}원
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">희망 이자율</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={interest}
                  onChange={e => setInterest(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>무이자 0%</span>
                  <span>적정 3%</span>
                  <span>권장 5%</span>
                  <span>{interest}%</span>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">상환 기간</label>
                <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-md"
                    >
                    {[3, 6, 12, 24, 36].map(month => (
                        <option key={month} value={month}>{month}개월</option>
                    ))}
                    <option value={0}>직접입력</option>
                  </select>

                    {duration === 0 && (
                    <input
                        type="number"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        placeholder="개월 수 직접 입력"
                        className="w-full px-3 py-2 mt-2 border rounded-md"
                    />
                    )}


                <p className="mt-1 text-sm text-gray-500">
                상환일: <span className="font-medium">{formattedEndDate}</span>
                </p>

                </div>

              <div>
                <label className="block mb-1 font-semibold">요청 메시지 (선택사항)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="친구에게 전달할 메시지를 입력해주세요"
                  maxLength={150}
                />
              </div>

              <div className="pt-4 space-y-1 text-sm text-gray-700 border-t">
                <p>대출 금액 <strong>{amount ? `${parseInt(amount).toLocaleString()}원` : '0원'}</strong></p>
                <p>연 이자율 <strong>{interest}%</strong></p>
                <p>
                  상환 기간{' '}
                  <strong>
                    {duration === 0
                      ? `${customDuration || 0}개월`
                      : `${duration}개월`}
                  </strong>
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="w-1/2 py-2 text-gray-700 border rounded-md hover:bg-gray-100">
                  임시저장
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-1/2 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  다음 단계: 친구 선택
                </button>
              </div>
            </>
          )}

          {/* STEP 2: 친구 선택 */}
          {step === 2 && (
            <>
              <h3 className="mb-2 text-lg font-semibold">대출을 요청할 친구를 선택하세요</h3>
             {friendWallets.length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-500">
                    친구가 없습니다. 친구를 추가해보세요.
                </p>
                ) : (
                  <ul className="divide-y">
                    {friendWallets.map(friend => (
                      <li
                        key={friend.id}
                        className="flex items-center justify-between px-2 py-3 rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => handleCreateLoan(friend.wallet_id)}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{friend.name}</p>
                            <p className="text-sm text-gray-400">{friend.email}</p>
                          </div>
                        </div>
                        <span className="text-sm text-blue-600">요청</span>
                      </li>
                    ))}
                  </ul>
                )}

              <button
                className="w-full py-2 mt-6 text-gray-600 border rounded-md hover:bg-gray-100"
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