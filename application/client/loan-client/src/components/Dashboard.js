import React, { useState, useEffect } from 'react';
import { createWallet, getWalletBalance, createLoan, queryAllLoans } from '../services/api';

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [balance, setBalance] = useState(0);
    const [loans, setLoans] = useState([]);
    const [newLoan, setNewLoan] = useState({
        id: '',
        lender: '',
        borrower: '',
        amount: 0,
        durationDays: 0,
        interestRate: 0
    });

    // 지갑 생성
    const handleCreateWallet = async () => {
        try {
            await createWallet(walletAddress);
            alert('지갑이 생성되었습니다!');
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
        }
    };

    // 대출 요청 생성
    const handleCreateLoan = async () => {
        try {
            await createLoan(newLoan);
            alert('대출 요청이 생성되었습니다!');
            fetchLoans();
            // 폼 초기화
            setNewLoan({
                id: '',
                lender: '',
                borrower: '',
                amount: 0,
                durationDays: 0,
                interestRate: 0
            });
        } catch (error) {
            alert('대출 요청 생성 실패: ' + error.message);
        }
    };

    // 전체 대출 조회
    const fetchLoans = async () => {
        try {
            const result = await queryAllLoans();
            setLoans(result);
        } catch (error) {
            console.error('대출 조회 실패:', error);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            fetchBalance();
            fetchLoans();
        }
    }, [walletAddress]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">깐부대출 대시보드</h1>
            
            {/* 지갑 섹션 */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">지갑 관리</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="지갑 주소 입력"
                        className="border p-2 rounded"
                    />
                    <button
                        onClick={handleCreateWallet}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        지갑 생성
                    </button>
                </div>
                {balance > 0 && (
                    <p className="mt-2">현재 잔액: {balance}원</p>
                )}
            </div>

            {/* 대출 요청 섹션 */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">새 대출 요청</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={newLoan.id}
                        onChange={(e) => setNewLoan({...newLoan, id: e.target.value})}
                        placeholder="대출 ID"
                        className="border p-2 rounded"
                    />
                    <input
                        type="text"
                        value={newLoan.lender}
                        onChange={(e) => setNewLoan({...newLoan, lender: e.target.value})}
                        placeholder="대출자 주소"
                        className="border p-2 rounded"
                    />
                    <input
                        type="text"
                        value={newLoan.borrower}
                        onChange={(e) => setNewLoan({...newLoan, borrower: e.target.value})}
                        placeholder="차입자 주소"
                        className="border p-2 rounded"
                    />
                    <input
                        type="number"
                        value={newLoan.amount}
                        onChange={(e) => setNewLoan({...newLoan, amount: parseInt(e.target.value)})}
                        placeholder="대출 금액"
                        className="border p-2 rounded"
                    />
                    <input
                        type="number"
                        value={newLoan.durationDays}
                        onChange={(e) => setNewLoan({...newLoan, durationDays: parseInt(e.target.value)})}
                        placeholder="대출 기간 (일)"
                        className="border p-2 rounded"
                    />
                    <input
                        type="number"
                        value={newLoan.interestRate}
                        onChange={(e) => setNewLoan({...newLoan, interestRate: parseInt(e.target.value)})}
                        placeholder="이자율 (%)"
                        className="border p-2 rounded"
                    />
                </div>
                <button
                    onClick={handleCreateLoan}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
                >
                    대출 요청 생성
                </button>
            </div>

            {/* 대출 목록 섹션 */}
            <div>
                <h2 className="text-xl font-semibold mb-4">대출 목록</h2>
                <div className="grid grid-cols-1 gap-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className="border p-4 rounded">
                            <p>ID: {loan.id}</p>
                            <p>대출자: {loan.lender}</p>
                            <p>차입자: {loan.borrower}</p>
                            <p>금액: {loan.amount}원</p>
                            <p>기간: {loan.durationDays}일</p>
                            <p>이자율: {loan.interestRate}%</p>
                            <p>상태: {loan.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 