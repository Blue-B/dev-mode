import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { HandHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';  // ← 추가

import {
  getWalletBalance,
  createLoan,
  approveLoan,
  denyLoan,
  queryMyLoans
} from '../services/api';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();  // ← 추가

  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [loans, setLoans] = useState([]);
  const [friendWallets, setFriendWallets] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('wallet_id')
        .eq('id', user.id)
        .single();
      if (data?.wallet_id) setWalletAddress(data.wallet_id);
      setLoadingWallet(false);
    };
    fetchWallet();
  }, [user?.id]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      loadMyLoans();
    }
  }, [walletAddress]);

  const fetchBalance = async () => {
    try {
      const result = await getWalletBalance(walletAddress);
      setBalance(result);
    } catch {
      setBalance(0);
    }
  };

  const loadMyLoans = async () => {
    try {
      const result = await queryMyLoans(walletAddress);
      setLoans(Array.isArray(result) ? result : []);
    } catch {
      setLoans([]);
    }
  };

  const profileMap = useMemo(() => {
    return friendWallets.reduce((acc, p) => {
      acc[p.wallet_id] = p;
      return acc;
    }, {});
  }, [friendWallets]);

  const activeCount = loans.filter(l => l.status === 'Active').length;
  const activeAmount = loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.amount, 0);

  // 예시 데이터 (디자인 확인용)
  const exampleLogs = [
    {
      id: '1',
      name: '김철수',
      action: '대출을 요청했습니다',
      amount: 500000,
      duration: '3개월',
      status: 'Pending'
    },
    {
      id: '2',
      name: '이영희',
      action: '상환했습니다',
      amount: 300000,
      duration: null,
      status: 'Repaid'
    }
  ];

  return (
    <div className="bg-white text-gray-800 p-10 text-[17px] max-w-6xl mx-auto">
      {/* 상단 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[{ title: '신용 점수', value: '850', subtitle: '▲2.5%', color: 'text-green-500' },
          { title: '활성 대출', value: activeCount, subtitle: `총 ${activeAmount.toLocaleString()} KRW` },
          { title: '대출 상환율', value: '98%', subtitle: '지난 12개월' },
          { title: '이용 가능한 한도', value: `${balance.toLocaleString()} KRW`, subtitle: '현재 잔액' }
        ].map((card, idx) => (
          <div key={idx} className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="text-3xl font-bold">{card.value}
              {card.subtitle?.includes('%') && <span className={`text-sm ml-1 ${card.color || 'text-gray-400'}`}>{card.subtitle}</span>}
            </p>
            {card.subtitle && !card.subtitle.includes('%') && <p className="text-sm text-gray-400">{card.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* 요청 강조 카드 */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center p-6 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl shadow-md mb-10 max-w-3xl mx-auto">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-lg sm:text-xl font-semibold mb-1">친구에게 대출 요청</h2>
          <p className="mb-3 text-sm">
            쉽고 빠르게 친구에게 대출을 요청하세요.<br /> 
            요청이 승인되면 즉시 대출이 진행됩니다.
          </p>
          <button
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-100"
            onClick={() => navigate('/loanpool/request')}  // 여기서 페이지 이동
          >
            친구 대출 요청하기
          </button>
        </div>
        <div className="text-white text-5xl opacity-50">
          <HandHeart size={50} />
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
        <div className="space-y-4">
          {exampleLogs.map(log => (
            <div key={log.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
              <div>
                <p className="mb-1">{log.name}님이 {log.action}</p>
                <p className="text-sm text-gray-500">
                  {log.amount.toLocaleString()} KRW
                  {log.duration && ` • ${log.duration}`}
                </p>
              </div>
              <div>
                {log.status === 'Pending' && (
                  <div className="flex space-x-2">
                    <span className="text-green-600 bg-green-50 px-3 py-1 rounded text-sm">수락</span>
                    <span className="text-red-500 bg-red-50 px-3 py-1 rounded text-sm">거절</span>
                  </div>
                )}
                {log.status === 'Repaid' && (
                  <span className="text-green-600 flex items-center space-x-1 text-sm">✔<span>완료</span></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
