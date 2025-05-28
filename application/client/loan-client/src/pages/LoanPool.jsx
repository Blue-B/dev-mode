import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { createPool, queryAllPools } from '../services/api';


const LoanPool = () => {
  const [poolName, setPoolName] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('3'); // in months
  const [pools, setPools] = useState([]);

  const handleCreatePool = async () => {
  const id = uuidv4(); // 자동 생성된 고유 풀 ID
  try {
    await createPool({
      id,
      name: poolName,
      minDeposit: parseInt(minDeposit),
      interestRate: parseInt(interestRate),
      durationMonths: parseInt(duration),
    });
    alert('✅ 풀 생성 완료');
    setPoolName('');
    setMinDeposit('');
    setInterestRate('');
    setDuration('3');
    fetchPools();
  } catch (err) {
    console.error('풀 생성 실패:', err);
    alert('❌ ' + (err.response?.data?.error || err.message));
  }
};
const fetchPools = async () => {
  try {
    const data = await queryAllPools();
    console.log('🎯 fetchPools 결과:', data);
    setPools(data);
  } catch (err) {
    console.error('풀 목록 불러오기 실패:', err);
  }
};

useEffect(() => {
  fetchPools();
}, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 상단 버튼 */}
      <div className="flex justify-end gap-2 mb-6">
        <button className="flex items-center px-3 py-1.5 bg-white border text-sm text-blue-600 border-blue-600 rounded-md">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          지갑 연결됨
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">+ 새 풀 만들기</button>
      </div>

      {/* 새 대출풀 만들기 */} 
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">새 대출풀 만들기</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">풀 이름</label>
            <input value={poolName} onChange={(e) => setPoolName(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="풀 이름을 입력하세요" />
          </div>
          <div>
            <label className="block text-sm mb-1">참여자 최소 예치금</label>
            <input value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="KRW"/>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">이자율</label>
              <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="최대 5%"/>
            </div>

          </div>
          <div>
            <label className="block text-sm mb-1">풀 모집 기간</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border rounded-md p-2 text-sm">
              <option>3개월</option>
              <option>6개월</option>
              <option>12개월</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button onClick={handleCreatePool} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">풀 생성하기</button>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold">활성 대출풀</h3>
        <div className="flex gap-2">
          <select className="border rounded-md p-2 text-sm">
            <option>최신순</option>
            <option>이자율순</option>
          </select>
          <select className="border rounded-md p-2 text-sm">
            <option>전체 상태</option>
            <option>모집중</option>
            <option>모집완료</option>
          </select>
        </div>
      </div>

      {/* 대출풀 카드 */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {(Array.isArray(pools) ? pools : []).map((pool) => (
    <div key={pool.id} className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between text-sm font-medium mb-2">
        <span>{pool.name}</span>
        <span className={pool.status === 'Open' ? 'text-blue-600' : 'text-gray-400'}>
          {pool.status === 'Open' ? '모집중' : '모집완료'}
        </span>
      </div>
      <p className="text-sm">총 모집액 <strong>{(pool.totalDeposit || pool.total_deposit)?.toLocaleString()} KRW</strong></p>
      <p className="text-sm">이자율 <strong>{(pool.interestRate || pool.interest_rate)}%</strong></p>
      <p className="text-sm mb-4">마감일 <strong>{new Date(pool.endTime || pool.end_time).toLocaleDateString()}</strong></p>

      <button
        className={`w-full py-2 rounded-md text-sm ${
          pool.status === 'Open'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {pool.status === 'Open' ? '참여하기' : '모집 완료'}
      </button>
    </div>
  ))}
</div>
    </div>
  );
};

export default LoanPool;