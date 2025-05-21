// FinancialStatus.js
import React from "react";
import { GiftIcon, CircleStackIcon } from '@heroicons/react/24/solid';


const FinancialStatus = () => {
  const loans = [
    {
      amount: "10,000,000 KRW",
      rate: "5%",
      period: "12개월",
      start: "2023-01-01",
      status: "활성",
      lender: "은행 A",
    },
    {
      amount: "5,000,000 KRW",
      rate: "4%",
      period: "6개월",
      start: "2023-03-01",
      status: "상환 완료",
      lender: "은행 B",
    },
    {
      amount: "15,000,000 KRW",
      rate: "6%",
      period: "24개월",
      start: "2022-10-01",
      status: "연체",
      lender: "은행 C",
    },
    {
      amount: "7,000,000 KRW",
      rate: "3.5%",
      period: "18개월",
      start: "2023-02-01",
      status: "활성",
      lender: "은행 D",
    },
  ];

  const statusColors = {
    "활성": "text-blue-700 bg-blue-50",
    "상환 완료": "text-green-700 bg-green-50",
    "연체": "text-red-700 bg-red-50",
  };

  return (
    <div className="p-10 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2">자금현황</h1>
      <p className="text-gray-500 mb-6">자금 정보를 확인하세요.</p>

    <div className="border rounded-xl p-3">
      <p>리워드 현황</p>
      <div className="flex gap-4 mt-3">
        
        <div className="flex-1 p-4 rounded-lg bg-blue-50">
          <div className="text-sm text-blue-700 mb-1 flex">
            <GiftIcon className="w-5 h-5 mr-2"/>
                누적 리워드
            </div>
          <div className="text-2xl text-blue-700">250,000 KRW</div>
        </div>
        <div className="flex-1 p-4 rounded-lg bg-green-50">
          <div className="text-sm text-green-700 mb-1 flex">
          <CircleStackIcon className="w-5 h-5 mr-2" />
            이번 달 예상 리워드
            </div>
          <div className="text-2xl text-green-700">15,000 KRW</div>
        </div>
      </div>
    </div>
     

    <div className="mt-5">
        <p>필터</p>
        <div className="flex gap-4 mb-4 mt-1">
            <select className="border rounded-xl px-2 py-3 w-1/2 bg-white">
                <option>상태별 필터 (예: 활성, 상환 완료, 연체)</option>
            </select>
        </div>
    </div>

    <div className="mt-5">
        <p>정렬</p>
        <div className="flex gap-4 mb-5 mt-1">
            <select className="border rounded-xl px-2 py-3 w-1/2 bg-white">
                <option>날짜별 또는 금액별 정렬</option>
            </select>
        </div>
    </div>

      <div className="overflow-hidden rounded-xl border-2 ">
        <table className="w-full text-left">
          <thead className="">
            <tr>
              <th className="px-4 py-2 font-normal">대출 금액</th>
              <th className="px-4 py-2 font-normal">이자율</th>
              <th className="px-4 py-2 font-normal">상환 기간</th>
              <th className="px-4 py-2 font-normal">시작 날짜</th>
              <th className="px-4 py-2 font-normal">상환 상태</th>
              <th className="px-4 py-2 font-normal">대출자/대출기관</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-3">{loan.amount}</td>
                <td className="px-4 py-3">{loan.rate}</td>
                <td className="px-4 py-3">{loan.period}</td>
                <td className="px-4 py-3">{loan.start}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm  ${statusColors[loan.status]}`}> 
                    {loan.status}
                  </span>
                </td>
                <td className="px-4 py-2">{loan.lender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialStatus;
