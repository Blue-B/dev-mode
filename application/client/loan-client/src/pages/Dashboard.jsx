import React, { useState, useEffect } from 'react';
import { createWallet, getWalletBalance, createLoan, queryAllLoans, approveLoan, denyLoan } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

// 1개월 ~ 60개월까지 반복 생성
const durationOptions = Array.from({ length: 60 }, (_, i) => i + 1);

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [initialBalance, setInitialBalance] = useState('0');
    const [balance, setBalance] = useState(0);
    const [loans, setLoans] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [newLoan, setNewLoan] = useState({
        lender: '', // 대출자 지갑 주소
        borrower: '', // 차임자 지갑 주소
        amount: 0, //대출 금액
        durationDays: 0, //상환 기간
        interestRate: 0, //이자율
        endDateTimestamp: null // 상환일

    });
    const [selectedMonths, setSelectedMonths] = useState(0); // 상환 기간 
    const [calculatedEndDate, setCalculatedEndDate] = useState(null);

    // 지갑 생성
    const handleCreateWallet = async () => {
        try {
            await createWallet(walletAddress, initialBalance);
            alert('지갑이 생성되었습니다!');
            setWallets([...wallets, walletAddress]);
            fetchBalance();
        } catch (error) {
            alert('지갑 생성 실패: ' + error.message);
        }
    };

    // 잔액 조회
    const fetchBalance = async () => {
        try {
            const result = await getWalletBalance(walletAddress);
            setBalance(result);
        } catch (error) {
            console.error('잔액 조회 실패:', error);
            setBalance(0);
        }
    };

    // 대출 요청 생성
    const handleCreateLoan = async () => {
        try {
        const { lender, borrower, amount, interestRate } = newLoan;

        if (!lender || !borrower || !amount || !selectedMonths || !interestRate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (lender === borrower) {
            alert('대출자와 차입자는 다른 지갑이어야 합니다.');
            return;
        }

        const id = uuidv4();
        const durationDays = selectedMonths * 30;
        const endDate = calculateEndDate(new Date(), selectedMonths);
        const endDateTimestamp = endDate.getTime();

        const completeLoan = {
            ...newLoan,
            id,
            durationDays, // 상환 기간
            endDateTimestamp //만기일 타임스탬프
        };

        await createLoan(completeLoan); // API호출
        alert('대출 요청이 생성되었습니다!');
        fetchLoans();
        setNewLoan({ lender: '', borrower: '', amount: 0, durationDays: 0, interestRate: 0, endDateTimestamp: null });
        setSelectedMonths(0);
        setCalculatedEndDate(null);
        } catch (error) {
        console.error('대출 요청 생성 실패:', error);
        alert('대출 요청 생성 실패: ' + (error.response?.data?.message || error.message));
        }
    };

    // 개월 수 → 종료일 계산 함수
    const calculateEndDate = (startDate, months) => {
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + months);
        return end;
    };

    const handleDurationChange = (e) => {
        const months = parseInt(e.target.value);
        setSelectedMonths(months);
        if (!isNaN(months)) {
        const end = calculateEndDate(new Date(), months);
        setCalculatedEndDate(end);
        } else {
        setCalculatedEndDate(null);
        }
    };

    // 대출 승인
    const handleApproveLoan = async (loanId) => {
        try {
            await approveLoan(loanId);
            alert('대출이 승인되었습니다!');
            fetchLoans();
        } catch (error) {
            console.error('대출 승인 실패:', error);
            alert('대출 승인 실패: ' + (error.response?.data?.message || error.message));
        }
    };

    // 대출 거절
    const handleDenyLoan = async (loanId) => {
        try {
            await denyLoan(loanId);
            alert('대출이 거절되었습니다!');
            fetchLoans();
        } catch (error) {
            console.error('대출 거절 실패:', error);
            alert('대출 거절 실패: ' + (error.response?.data?.message || error.message));
        }
    };

    // 전체 대출 조회
    const fetchLoans = async () => {
        try {
            const result = await queryAllLoans();
            const loansArray = Array.isArray(result) ? result : [];
            setLoans(loansArray);
        } catch (error) {
            console.error('대출 조회 실패:', error);
            alert('대출 목록 조회 실패: ' + (error.response?.data?.message || error.message));
            setLoans([]);
        }
    };

    useEffect(() => { //대출 생성,승인,거절시 데이터 갱신
        fetchLoans();
    }, []);

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
                    <p className="text-3xl font-bold">{loans.filter(loan => loan.status === 'Active').length}</p>
                    <p className="text-base">총 {loans.filter(loan => loan.status === 'Active').reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()} KRW</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">대출 상환율</p>
                    <p className="text-3xl font-bold">98%</p>
                    <p className="text-xs text-gray-400">지난 12개월</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">이용 가능한 한도</p>
                    <p className="text-3xl font-bold">{balance.toLocaleString()} KRW</p>
                    <p className="text-xs text-gray-400">현재 잔액</p>
                </div>
            </div>

            {/* 지갑 관리 섹션 */}
            <div className="p-8 border rounded-xl mb-12">
                <h2 className="text-xl font-semibold mb-6">지갑 관리</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="지갑 주소 입력"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"
                        />
                    </div>
                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="number"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            placeholder="초기 잔액"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"
                        />
                        <span className="text-gray-400 ml-2">KRW</span>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={handleCreateWallet}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                    >
                        지갑 생성
                    </button>
                    <button
                        onClick={fetchBalance}
                        className="border px-6 py-2 rounded-lg"
                    >
                        잔액 조회
                    </button>
                </div>
                {wallets.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">생성된 지갑 목록:</h3>
                        <ul className="list-disc list-inside">
                            {wallets.map((wallet, index) => (
                                <li 
                                    key={index}
                                    className="cursor-pointer hover:text-blue-500"
                                    onClick={() => setWalletAddress(wallet)}
                                >
                                    {wallet}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 대출 요청 섹션 */}
            <div className="p-8 border rounded-xl mb-12">
                <h2 className="text-xl font-semibold mb-6">새 대출 요청</h2>
                <div className="grid grid-cols-2 gap-6">
               
                    <select
                        value={newLoan.lender}
                        onChange={(e) => setNewLoan({...newLoan, lender: e.target.value})}
                        className="border px-4 py-3 rounded-lg w-full text-lg"
                    >
                        <option value="">대출자 선택</option>
                        {wallets.map((wallet, index) => (
                            <option key={index} value={wallet}>{wallet}</option>
                        ))}
                    </select>
                    <select
                        value={newLoan.borrower}
                        onChange={(e) => setNewLoan({...newLoan, borrower: e.target.value})}
                        className="border px-4 py-3 rounded-lg w-full text-lg"
                    >
                        <option value="">차입자 선택</option>
                        {wallets.map((wallet, index) => (
                            <option key={index} value={wallet}>{wallet}</option>
                        ))}
                    </select>
                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="number"
                            value={newLoan.amount}
                            onChange={(e) => setNewLoan({...newLoan, amount: parseInt(e.target.value) || 0})}
                            placeholder="대출 금액"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"
                        />
                        <span className="text-gray-400 ml-2">KRW</span>
                    </div>

                      {/* 대출 기간 + 예정일 */}
    <div className="relative">
      <select
        value={selectedMonths}
        onChange={handleDurationChange}
        className="border px-4 py-3 rounded-lg w-full text-lg"
      >
        <option value="">상환 기간 선택 (개월)</option>
        {durationOptions.map((month) => (
          <option key={month} value={month}>{month}개월</option>
        ))}
      </select>
      {calculatedEndDate && (
        <span className="absolute right-4 top-[13px] text-sm text-gray-500">
          {calculatedEndDate.toISOString().split("T")[0]}
        </span>
      )}
    </div>

                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="number"
                            value={newLoan.interestRate}
                            onChange={(e) => setNewLoan({...newLoan, interestRate: parseInt(e.target.value) || 0})}
                            placeholder="이자율"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"
                        />
                        <span className="text-gray-400 ml-2">%</span>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={handleCreateLoan}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                    >
                        대출 요청 생성
                    </button>
                </div>
            </div>

            {/* 최근 활동 */}
            <div>
                <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className="flex items-center justify-between p-5 border rounded-xl">
                            <div className="flex items-center space-x-4">
                                <img src="https://via.placeholder.com/40" className="rounded-full" alt="user" />
                                <div>
                                    <p className="text-base">
                                        {loan.lender}님이 {loan.borrower}님에게 대출을 요청했습니다
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {loan.amount.toLocaleString()} KRW • {loan.durationDays}일
                                    </p>
                                </div>
                            </div>
                            {loan.status === 'Pending' && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleApproveLoan(loan.id)}
                                        className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-md hover:bg-green-100"
                                    >
                                        수락
                                    </button>
                                    <button
                                        onClick={() => handleDenyLoan(loan.id)}
                                        className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md hover:bg-red-100"
                                    >
                                        거절
                                    </button>
                                </div>
                            )}
                            {loan.status === 'Active' && (
                                <span className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-md">
                                    진행중
                                </span>
                            )}
                            {loan.status === 'Denied' && (
                                <span className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md">
                                    거절됨
                                </span>
                            )}
                            {loan.status === 'Repaid' && (
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
