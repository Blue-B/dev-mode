import { useState } from "react";

const MyPage = () => {
  const [isCopied, setIsCopied] = useState(false);

  const user = {
    email: "user@example.com",
    balance: "1,000,000 KRW",
    repaymentRate: "10%",
    walletId: "Wallet ID:12345"
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(user.walletId)
      .then(() => {
        setIsCopied(true);
        alert("지갑 ID가 클립보드에 복사되었습니다.");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error) => {
        alert("지갑 ID를 복사하는 데 실패했습니다.");
        console.error("Failed to copy wallet ID:", error);
      });
  };

  return (
    <main className="flex-1 overflow-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">내 정보</h1>

        <div className="bg-white border rounded-lg divide-y">
          {/* 이메일 */}
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-sm text-gray-500 w-32">이메일</div>
            <div className="flex-1 text-gray-800">{user.email}</div>
          </div>

          {/* 잔액 */}
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-sm text-gray-500 w-32">잔액</div>
            <div className="flex-1 text-gray-800 font-medium">{user.balance}</div>
          </div>

          {/* 상환율 */}
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-sm text-gray-500 w-32">상환율</div>
            <div className="flex-1 text-gray-800">{user.repaymentRate}</div>
          </div>

          {/* 지갑 */}
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-sm text-gray-500 w-32">지갑</div>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-gray-800">{user.walletId}</span>
              <button 
                onClick={handleCopyWallet} 
                className="bg-[#ff6b6b] bg-opacity-10 text-[#ff6b6b] hover:bg-opacity-20 transition-all text-sm px-4 py-2 rounded"
              >
                {isCopied ? "복사됨" : "지갑 연결해제"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;
