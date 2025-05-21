
import React from "react";

export default function Constract() {
  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-semibold mb-6">🔷 깐부대출 계약서</h2>

      <div className="bg-white shadow-md rounded-2xl p-8 max-w-2xl mx-auto">
        {/* 문서 아이콘 */}
        <div className="flex justify-center mb-6">
          <img src="/contract-icon.png" alt="contract" className="h-12" />
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow label="(갑)채권자" value="김키움" />
          <InfoRow label="주소" value="충남 천안시 서북구" />
          <InfoRow label="주민등록번호" value="010120-3******" />
          <InfoRow label="연락처" value="010-8674-7678" />

          <InfoRow label="(을)채무자" value="김나무" className="mt-4" />
          <InfoRow label="주소" value="충남 천안시 서북구" />
          <InfoRow label="주민등록번호" value="010120-3******" />
          <InfoRow label="연락처" value="010-8674-7678" />

          <InfoRow label="계약 날짜" value="2025년 5월 13일" />
          <InfoRow label="대출 금액" value="50,000,000원" />
          <InfoRow label="이자율" value="연 3.2%" />
          <InfoRow label="변제 방법" value="계좌이체" />
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <button className="px-4 py-2 bg-gray-100 rounded-full text-sm">
            📝 수정하기
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded-full text-sm">
            ✍️ 서명하기
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          본 계약은 상기 조건에 따라 대출이자로 체결됩니다. 모든 사항은 조건 및 계약 기준으로 이루어집니다.
        </p>

        <button className="w-full mt-6 bg-blue-500 text-white py-3 rounded-full font-semibold">
          대출 계약 확인하기
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = "" }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}