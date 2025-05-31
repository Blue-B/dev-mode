import { useState, useEffect } from "react";
import { HandCoins, ChevronLeft, Edit, Search } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Home, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoanRequest() {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState(5);
  const [loanTermMonths, setLoanTermMonths] = useState(12);
  const [borrowerName, setBorrowerName] = useState("나");
  const [lenderName, setLenderName] = useState("");
  const [purposeMessage, setPurposeMessage] = useState("");
  const [isEditingInterestRate, setIsEditingInterestRate] = useState(false);
  
  // Add state for current step
  const [currentStep, setCurrentStep] = useState(1);

  // Add state for current date and estimated repayment date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [estimatedRepaymentDate, setEstimatedRepaymentDate] = useState('');

  // Add state for friends and search query
  const [friends, setFriends] = useState([
    { id: 1, name: '김지훈', phone: '010-1234-5678', avatar: 'https://via.placeholder.com/60', isSelected: false, isFavorite: true },
    { id: 2, name: '박수연', phone: '010-2233-4455', avatar: 'https://via.placeholder.com/60', isSelected: false, isFavorite: true },
    { id: 3, name: '이민정', phone: '010-3344-5566', avatar: 'https://via.placeholder.com/60', isSelected: false, isFavorite: true },
    { id: 4, name: '최유진', phone: '010-4488-9922', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false },
    { id: 5, name: '정승호', phone: '010-7789-1234', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false },
    { id: 6, name: '이성훈', phone: '010-8899-6655', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false },
    { id: 7, name: '최대현', phone: '010-1357-2468', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false },
    { id: 8, name: '김영호', phone: '010-1122-3344', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false },
    { id: 9, name: '홍길동', phone: '010-5555-1111', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false }, // Added for scrolling test
    { id: 10, name: '성춘향', phone: '010-6666-2222', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false }, // Added for scrolling test
    { id: 11, name: '이몽룡', phone: '010-7777-3333', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false }, // Added for scrolling test
    { id: 12, name: '임꺽정', phone: '010-8888-4444', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false }, // Added for scrolling test
    { id: 13, name: '장길산', phone: '010-9999-5555', avatar: 'https://via.placeholder.com/50', isSelected: false, isFavorite: false }, // Added for scrolling test
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate estimated repayment date whenever loanTermMonths or currentDate changes
  useEffect(() => {
    if (typeof loanTermMonths === 'number' && loanTermMonths > 0) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + loanTermMonths);
      const year = date.getFullYear();
      // Month is 0-indexed, add 1
      const month = date.getMonth() + 1;
      const day = date.getDate();
      // Format the date as YYYY. M. D.
      setEstimatedRepaymentDate(`${year}. ${month}. ${day}.`);
    } else {
      setEstimatedRepaymentDate('날짜 미정'); // Or any default text for direct input/invalid period
    }
  }, [loanTermMonths, currentDate]); // Depend on loanTermMonths and currentDate

  const selectAmount = (amount) => {
    setLoanAmount(amount.toLocaleString());
  };

  const selectTerm = (term) => {
    setLoanTermMonths(term);
  };

  const calculateTotalRepayment = () => {
    const amount = parseFloat(loanAmount.replace(/,/g, "") || "0");
    const rate = interestRate / 100;
    const months = loanTermMonths;
    const totalInterest = amount * rate * (months / 12);
    const totalRepayment = amount + totalInterest;
    return Math.round(totalRepayment);
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString() + "원";
  };

  const handleInterestRateChange = (e) => {
    const value = parseFloat(e.target.value);
    setInterestRate(isNaN(value) ? 0 : value);
  };

  const handleInterestRateBlur = () => {
    setIsEditingInterestRate(false);
  };

  const handleInterestRateKeyPress = (e) => {
    if (e.key === 'Enter') {
      setIsEditingInterestRate(false);
    }
  };

  // Function to go to the next step
  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Function to go to the previous step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Function to handle friend selection (single selection)
  const handleFriendSelect = (id) => {
    setFriends(friends.map(friend =>
      friend.id === id ? { ...friend, isSelected: !friend.isSelected } : { ...friend, isSelected: false } // Toggle selection for clicked friend, deselect others
    ));
  };

  // Find the selected friend
  const selectedFriend = friends.find(friend => friend.isSelected);

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
                        value={loanTermMonths}
                        onChange={(e) => setLoanTermMonths(parseInt(e.target.value))}
                        className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mr-2 focus:outline-none focus:border-blue-500"
                      >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={36}>36</option>
                      </select>
                      <span className="text-sm text-gray-600 mr-auto">개월</span>
                      <div className="flex items-center text-sm text-blue-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>상환일</span>
                        {/* Display estimated repayment date below loan term */}
                        <span className="ml-2 font-semibold">{estimatedRepaymentDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[3, 6, 12, 24, 36].map((term) => (
                        <button
                          key={term}
                          className={`py-2 px-4 rounded-full text-xs font-medium transition-colors ${
                            loanTermMonths === term
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          onClick={() => selectTerm(term)}
                        >
                          {term}개월
                        </button>
                      ))}
                      <button className="bg-gray-100 text-gray-600 py-2 px-4 rounded-full text-xs font-medium border border-gray-200 hover:bg-gray-200">
                        직접입력
                      </button>
                    </div>
              </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">대출자 (본인의 이름)</span>
                      </div>
                  <input
                    type="text"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">차입자 (받는 친구)</span>
                      </div>
                  <input
                    type="text"
                    placeholder="친구 이름을 입력하세요"
                        value={lenderName}
                        onChange={(e) => setLenderName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
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

            {/* Loan Summary */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-24">
              <h3 className="font-semibold text-gray-800 mb-6">대출 요청 요약</h3>

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

        {/* Step 2: Friend Selection */}
        {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden p-6">
                {/* Header for Step 2 */}
                 <div className="flex items-center mb-3">
                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                       <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                       </svg>
                     </div>
                     <h2 className="text-xl font-bold text-gray-800 mr-auto">친구를 선택해주세요</h2>
                     {/* Previous Step Button */}
                      <button
                        onClick={goToPreviousStep}
                        className="text-blue-500 text-sm flex items-center hover:text-blue-600 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        이전으로
                      </button>
                 </div>
                 <p className="text-sm text-gray-600 ml-11 mb-6">신뢰할 수 있는 친구를 선택해 대출 요청을 보내세요</p>

                {/* Search Input */}
                 <div className="mb-6">
                     <div className="relative">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input
                             type="text"
                             placeholder="이름 또는 전화번호로 검색"
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         />
                     </div>
                 </div>

                {/* Favorites Section */}
                <div className="mb-6">
                    <div className="flex items-center text-gray-700 mb-4">
                         <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.83-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                         </svg>
                        <span className="font-semibold">즐겨찾기</span>
                    </div>
                    {/* Friend list items */}
                     <div className="grid grid-cols-3 gap-4">
                         {/* Filter and map favorite friends */}
                         {friends.filter(friend => friend.isFavorite).map(friend => (
                             <div key={friend.id} className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                                 <img src={friend.avatar} alt="Friend Avatar" className="w-12 h-12 rounded-full mb-2"/>
                                 <span className="text-sm font-medium text-gray-800">{friend.name}</span>
                                 <span className="text-xs text-gray-500 mb-3">{friend.phone}</span>
                                 <button
                                   className={`text-xs py-1 px-3 rounded-full ${friend.isSelected ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-300'}`}
                                   onClick={() => handleFriendSelect(friend.id)}
                                 >
                                   {friend.isSelected ? '✓ 선택' : '○ 선택'}
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                {/* My Friends Section */}
                <div>
                    <div className="flex items-center text-gray-700 mb-4">
                         <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM4.5 7A2.5 2.5 0 102 4.5 2.503 2.503 0 004.5 7zM5 14a5.002 5.002 0 01-2.326-1L7 13v1h1l1 5H3v-2z" />
                         </svg>
                        <span className="font-semibold mr-2">내 전체 친구</span>
                         <span className="text-sm text-gray-500">(총 {friends.length}명)</span>
                    </div>
                    {/* Friend list items */}
                    {/* Add max-height and overflow-y-auto for scrolling. Adjusted max-height calculation. */}
                     <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 480px)' }}> {/* Adjusted max-height */}
                         {/* Filter and map all friends for the main list based on search query */}
                         {friends.filter(friend => friend.name.includes(searchQuery) || friend.phone.includes(searchQuery)).map(friend => (
                             <div key={friend.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                                  <img src={friend.avatar} alt="Friend Avatar" className="w-10 h-10 rounded-full mr-4"/>
                                  <div className="flex-1">
                                       <div className="font-medium text-gray-800">{friend.name}</div>
                                       <div className="text-sm text-gray-500">{friend.phone}</div>
                                  </div>
                                  <button
                                    className={`text-sm py-2 px-4 rounded-full ${friend.isSelected ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-300'}`}
                                    onClick={() => handleFriendSelect(friend.id)}
                                  >
                                    {friend.isSelected ? '✓ 선택' : '○ 선택'}
                                  </button>
                             </div>
                         ))}
                          {/* Display message if no friends found */}
                          {friends.filter(friend => friend.name.includes(searchQuery) || friend.phone.includes(searchQuery)).length === 0 && searchQuery !== '' && (
                              <div className="text-center text-gray-500">검색 결과가 없습니다.</div>
                          )}
                     </div>
                </div>

             </div>
        )}

        {/* Step 3: Request Submission (Placeholder) */}
        {currentStep === 3 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden p-6 flex flex-col items-center text-center">
                 {/* Checkmark Icon with enhanced animated background (Ripple effect) */}
                 <div className="relative flex items-center justify-center mb-6 w-24 h-24"> {/* Container for icon and background */}
                   {/* Animated Background Circles (Ripple) */}
                   <div className="absolute w-full h-full rounded-full bg-blue-400 opacity-70 animate-ping"></div> {/* Ping effect circle */}
                   <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-70 animate-pulse delay-75"></div> {/* Slightly delayed pulse */}
                   <div className="absolute w-full h-full rounded-full bg-blue-600 opacity-70 animate-pulse delay-150"></div> {/* More delayed pulse */}
                   {/* Checkmark Icon */}
                   <CheckCircle className="relative z-10 w-16 h-16 text-white"/> {/* Checkmark Icon, increased text color for contrast */}
                 </div>
                 <h2 className="text-2xl font-bold text-gray-800 mb-2">요청 전송이 완료되었습니다</h2>
                 <p className="text-sm text-gray-600 mb-6">신청하신 대출 요청이 정상적으로 친구에게 전송되었습니다.<br/>요청 내역은 <span className="text-blue-600 font-semibold">내 대출 관리</span> 에서 확인하실 수 있습니다.</p>

                {/* Summary Card */}
                <div className="bg-gray-50 rounded-lg p-4 w-full mb-6">
                    {/* Friend Info - Centered */}
                    <div className="flex flex-col items-center mb-4"> {/* Changed to flex-col and items-center for centering */}
                         <img src={selectedFriend?.avatar} alt="Friend Avatar" className="w-16 h-16 rounded-full mb-2"/> {/* Increased size slightly */}
                         <div>
                              <div className="font-medium text-gray-800 text-center">{selectedFriend?.name}</div> {/* Centered text */}
                              <div className="text-sm text-gray-500 text-center">{selectedFriend?.phone}</div> {/* Centered text */}
                         </div>
                    </div>
                    {/* Loan Details - Left-aligned labels, Right-aligned values */}
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600"> {/* Removed text-center class from container */}
                         <div className="text-left">대출금액</div> {/* Explicitly left-aligned */}
                         <div className="col-span-2 text-right text-gray-800 font-semibold">{loanAmount ? parseFloat(loanAmount.replace(/,/g, "")).toLocaleString() + "원" : "0원"}</div> {/* Right-aligned */}
                         <div className="text-left">이자율</div> {/* Explicitly left-aligned */}
                         <div className="col-span-2 text-right text-gray-800 font-semibold">{interestRate.toFixed(1)}%</div> {/* Changed to text-right */}
                         <div className="text-left">상환 기간</div> {/* Explicitly left-aligned */}
                         <div className="col-span-2 text-right text-gray-800 font-semibold">{loanTermMonths}개월</div> {/* Changed to text-right */}
                    </div>
                </div>

            </div>
        )}

      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-[220px] right-0 p-6 bg-white border-t border-gray-100">
        <div className="flex gap-3 justify-center max-w-[600px] mx-auto">
          {currentStep === 1 && (
            <>
               <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                 임시저장
               </button>
               <button
                 className="flex-1 bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center hover:bg-blue-600 transition-colors"
                 onClick={goToNextStep}
               >
                 다음 단계: 친구 선택
                 <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
               </button>
             </>
          )}
           {currentStep === 2 && (
             <>
               <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                 임시저장
               </button>
                <div className="flex items-center text-sm text-gray-600 mr-4">
                    선택된 친구: {selectedFriend ? selectedFriend.name : '없음'}
                </div>
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