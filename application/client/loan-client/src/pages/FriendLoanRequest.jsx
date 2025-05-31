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

export default function LoanRequest() {
  const navigate = useNavigate();
  const {user} = useAuth();

  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState(5);

  const [duration, setDuration] = useState(12);
  const [customDuration, setCustomDuration] = useState('');

  const [receiver, setReceiver] = useState('');
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
  const handleCreateLoan = async (borrowerWalletId) => {
    try {
      if (!userWalletAddress || !borrowerWalletId || !amount || !duration || !interest) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      if (userWalletAddress === borrowerWalletId) {
        alert('대출자와 차입자는 같은 지갑일 수 없습니다.');
        return;
      }

      const loanId = uuidv4();
      const months = duration === 0 ? parseInt(customDuration) : duration;
      const endDate = calculateEndDate(new Date(), months);

      const loanData = {
        id: loanId,
        lender: userWalletAddress,
        borrower: borrowerWalletId,
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
    <div className="min-h-screen bg-gray-50" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div className="p-6 bg-white">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">친구에게 대출 요청</h1>
        </div>
        <p className="text-sm text-gray-600 ml-11">신뢰할 수 있는 친구로부터 안전하게 대출을 받아보세요</p>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
            <span className={`ml-2 text-sm font-semibold ${currentStep === 1 ? 'text-blue-500' : 'text-gray-400'}`}>대출 조건</span>
          </div>
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
            <span className={`ml-2 text-sm ${currentStep === 2 ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>친구 선택</span>
          </div>
          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
            <span className={`ml-2 text-sm ${currentStep === 3 ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>요청 전송</span>
          </div>
        </div>
        </div>

      {/* Main Content */}
      <div className="p-6 pb-32">
        {/* Step 1: Loan Conditions */}
        {currentStep === 1 && (
          <>
            {/* Loan Amount Card */}
            <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden">
              <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">대출 금액</span>
                </div>
              </div>

              <div className="p-6">
                {/* Loan Amount Input */}
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">대출 금액</span>
                  </div>

                  <div className="mb-4">
                <input
                      type="text"
                      value={loanAmount || ""}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="대출할 금액을 입력해주세요"
                      className="w-full text-right text-gray-600 border-0 border-b-2 border-gray-200 pb-2 focus:outline-none focus:border-blue-500 bg-transparent text-lg placeholder-gray-400"
                    />
                    <div className="text-right text-sm text-blue-500 mt-1">KRW</div>
                  </div>

                  {/* Amount Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      className="bg-blue-50 text-blue-600 py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => selectAmount(1000000)}
                    >
                      1,000,000원
                    </button>
                    <button
                      className="bg-blue-50 text-blue-600 py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => selectAmount(3000000)}
                    >
                      3,000,000원
                    </button>
                    <button
                      className="bg-blue-50 text-blue-600 py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => selectAmount(5000000)}
                    >
                      5,000,000원
                    </button>
                    <button
                      className="bg-blue-50 text-blue-600 py-3 px-4 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => selectAmount(10000000)}
                    >
                      10,000,000원
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 mb-6">
                    <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    친구별 평균 금액: 500~1,000만원
                  </div>

                  {/* Interest Rate Slider */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">희망 이자율</span>
                </div>

                    {/* Display of current interest rate or input field */}
                    <div className="mb-3 flex items-center" onDoubleClick={() => setIsEditingInterestRate(true)}>
                      {isEditingInterestRate ? (
                        <input
                          key="interest-rate-input"
                          type="number"
                          value={interestRate}
                          onChange={handleInterestRateChange}
                          onBlur={handleInterestRateBlur}
                          onKeyPress={handleInterestRateKeyPress}
                          className="text-3xl font-bold text-gray-800 w-24 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                          autoFocus
                          step="0.1"
                        />
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-gray-800">{interestRate.toFixed(1)}</span>
                          <span className="text-lg text-gray-600">%</span>
                           <button
                             onClick={() => setIsEditingInterestRate(true)}
                             className="ml-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none"
                             aria-label="Edit Interest Rate"
                           >
                             <Edit className="w-4 h-4 text-gray-500" />
                           </button>
                        </>
                      )}
              </div>

                    {/* The actual range slider input */}
                <input
                  type="range"
                  min="0"
                  max="20"
                        step="0.1"
                        value={interestRate}
                        onChange={handleInterestRateChange}
                        className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer mt-3"
                        style={{
                          '--tw-ring-color': '#3b82f6',
                          '--tw-ring-opacity': '1',
                          '--tw-ring-offset-width': '2px',
                          '--tw-ring-offset-color': '#fff'
                        }}
                    />

                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>무이자 0%</span>
                      <span>저금리 3%</span>
                      <span>적정금리 5%</span>
                      <span>협의</span>
                </div>
              </div>

                  {/* Loan Term */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">상환 기간</span>
                    </div>

                    <div className="flex items-center mb-4">
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

                    {duration === 0 && (
                    <input
                        type="number"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        placeholder="개월 수 직접 입력"
                        className="w-full mt-2 border px-3 py-2 rounded-md"
                    />
                    )}


                <p className="text-sm text-gray-500 mt-1">
                상환일: <span className="font-medium">{formattedEndDate}</span>
                </p>


                </div>

                  {/* Purpose Message */}
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">요청 메시지</span>
                      <span className="text-xs text-gray-500 ml-auto">(선택사항)</span>
                    </div>
                <textarea
                      placeholder="친구에게 전달할 메시지를 입력하세요"
                      value={purposeMessage}
                      onChange={(e) => setPurposeMessage(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm h-20 resize-none placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      maxLength={300}
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">{purposeMessage.length}/300자</div>
                  </div>
                </div>
              </div>
            </div>

              <div className="border-t pt-4 text-sm text-gray-700 space-y-1">
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

              <div className="grid grid-cols-3 text-center border-b border-gray-200 pb-4 mb-4">
                <div>
                  <div className="text-blue-500 font-bold text-lg">{loanAmount ? parseFloat(loanAmount.replace(/,/g, "")).toLocaleString() + "원" : "0원"}</div>
                  <div className="text-sm text-gray-600">대출 금액</div>
                </div>
                <div>
                   <div className="text-blue-500 font-bold text-lg">{interestRate}%</div>
                  <div className="text-sm text-gray-600">연 이자율</div>
                </div>
                <div>
                   <div className="text-blue-500 font-bold text-lg">{loanTermMonths}개월</div>
                  <div className="text-sm text-gray-600">상환 기간</div>
                     {/* Display estimated repayment date below loan term */}
                     {estimatedRepaymentDate !== '날짜 미정' && (
                       <div className="text-xs text-gray-500 mt-1">({estimatedRepaymentDate}까지)</div>
                     )}
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">예상 총 상환액</span>
                  <div className="font-bold text-xl text-gray-800">
                    {calculateTotalRepayment().toLocaleString()}원
                  </div>
                </div>
              </div>
              </div>
            </>
          )}

          {/* STEP 2: 친구 선택 */}
          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-2">대출을 요청할 친구를 선택하세요</h3>
             {friendWallets.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                    친구가 없습니다. 친구를 추가해보세요.
                </p>
                ) : (
                  <ul className="divide-y">
                    {friendWallets.map(friend => (
                      <li
                        key={friend.id}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 px-2 rounded"
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
                 className="flex-1 bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center hover:bg-blue-600 transition-colors"
                 onClick={goToNextStep}
                 disabled={!selectedFriend}
               >
                 다음 단계: 요청 전송
                 <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
              </button>
            </>
           )}
           {currentStep === 3 && (
             <>
               <button className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-blue-100 transition-colors">
                 <Wallet className="w-5 h-5 mr-2"/>내 대출 관리
               </button>
               <button 
                 onClick={() => navigate('/dashboard')}
                 className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-gray-200 transition-colors">
                 <Home className="w-5 h-5 mr-2"/>홈으로
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}