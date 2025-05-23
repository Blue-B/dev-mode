// src/pages/Setting.js
import React, { useState } from "react";

export default function Setting() {
  const [alerts, setAlerts] = useState({
    situation: false,
    statusUpdate: false,
  });

  const handleToggle = (name) => {
    setAlerts((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-semibold mb-6">설정</h2>
      <p className="text-gray-500 mb-8">개인 설정 및 플랫폼 동작을 관리하세요.</p>

      {/* 알림 설정 */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-2">🔔 알림 설정</h3>
        <div className="space-y-2">
          <Checkbox
            label="상황 알림 받기 (SMS, 이메일 또는 둘 다)"
            checked={alerts.situation}
            onChange={() => handleToggle("situation")}
          />
          <Checkbox
            label="줌 상태 업데이트 또는 투표 알림 받기"
            checked={alerts.statusUpdate}
            onChange={() => handleToggle("statusUpdate")}
          />
        </div>
      </section>

      {/* 보안 설정 */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-2">🔒 보안 설정</h3>
        <div className="flex flex-col gap-3">
          <button className="bg-gray-100 text-gray-700 py-2 rounded-md">
            2단계 인증 관리
          </button>
          <button className="bg-red-100 text-red-600 py-2 rounded-md font-semibold">
            모든 세션에서 로그아웃
          </button>
        </div>
      </section>

      {/* 언어 및 지역 설정 */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-2">🌍 언어 및 지역 설정</h3>
        <div className="space-y-4">
          <SelectBox label="언어" options={["한국어", "English"]} />
          <SelectBox label="시간대 설정" options={["자동 감지", "Asia/Seoul", "UTC"]} />
        </div>
      </section>

      {/* 저장 버튼 */}
      <div className="text-right">
        <button className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold">
          변경 사항 저장
        </button>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function SelectBox({ label, options }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select className="w-full border rounded-md p-2">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

