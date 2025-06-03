import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { createLoan } from '../../services/api';
import DetailedContract from "./DetailedContract";
import SignatureModal from "./SignatureModal";
import { X, FileText, Edit3, PenTool, Download } from "lucide-react";



export default function LoanAgreement() {
  const navigate = useNavigate();
  const [showDetailedContract, setShowDetailedContract] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSigner, setCurrentSigner] = useState(null);
  const [signatures, setSignatures] = useState({
    lender: null,
    borrower: null
  });
  const location = useLocation();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const {
    loanData,
    selectedFriend,
    estimatedRepaymentDate,
    totalRepayment,
  } = location.state || {};

  const contractData = {
    amount: loanData?.amount || "0",
    interestRate: loanData?.interest || "0",
    duration: loanData?.duration || "0",
    durationMonths: loanData?.durationMonths || "0",
    bankAccount: "신한은행 123-456-789012 (예금주: 김가환)",
    lenderName: loanData?.lender || "",
    lenderSSN : selectedFriend?.birth_number || "010120-3******",
    lenderPhone: selectedFriend?.phone || "010-8674-7678",
    lenderAddress: selectedFriend?.address || "충남 천안시 서북구",
    borrowerName: user?.name || "",
    borrowerSSN: user?.birth_number || "010120-3******",
    borrowerPhone: user?.phone || "010-8674-7678",
    borrowerAddress: user?.address || "충남 천안시 서북구",
    guarantor: "김보증 (주민등록번호: 010120-3******, 주소: 충남 천안시 서북구)"
  };

    // 오늘 날짜 객체
    const todayDate = new Date();

    // 계약 종료일 계산 (n개월 뒤)
    const endDate = new Date(todayDate);
    endDate.setMonth(endDate.getMonth() + Number(contractData.duration));

    // 형식 지정
    const formattedToday = todayDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });

    const formattedEndDate = endDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });

  
  const handleClose = () => {
    // 팝업을 닫고 이전 단계로 돌아가기
    window.history.back();
  };
  
  const handleSign = () => {
    setCurrentSigner('borrower');
    setShowSignatureModal(true);
  };

  const handleLenderSign = () => {
    setCurrentSigner('lender');
    setShowSignatureModal(true);
  };
  
  const handleConfirm = () => {
    console.log('Confirm loan contract');
  };

  const handleDocumentClick = () => {
    setShowDetailedContract(true);
  };

  const handleCloseDetailed = () => {
    setShowDetailedContract(false);
  };

  const handleSaveSignature = (signatureData) => {
    setSignatures(prev => ({
      ...prev,
      [currentSigner]: signatureData
    }));
  };
     // 대출 요청 생성
  const handleSendLoan = async () => {
    try {

      const result = await createLoan(loanData);
        console.log('📦 대출 생성 결과:', result);
        
      alert('대출 요청되었습니다.');
      
        // step 4로 돌아가기
        navigate('/dashboard/request', {
        state: {
            nextStep: 4
            }
        });
    } catch (error) {
      console.error('대출 생성 실패:', error);
      alert('대출 생성 실패: ' + (error?.response?.data?.message || error.message));
    }
  };
  

  return (
    <>
      {showDetailedContract ? (
        <DetailedContract
          contractData={contractData} 
          onClose={handleCloseDetailed}
          signatures={signatures}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen p-4 font-sans bg-gray-500 bg-opacity-60">
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl">
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute z-10 text-gray-500 top-4 right-4 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 transform rotate-45 bg-black"></div>
                <h1 className="text-base font-semibold text-gray-900">깐부대출</h1>
              </div>
            </div>
            
            {/* Document Preview Section */}
            <div className="px-6 pb-2">
              <div className="relative p-4 mb-4 rounded-lg bg-gray-50">
                {/* Document Icon with Blue Stamp */}
                <div className="flex justify-center mb-4">
                  <div className="relative cursor-pointer" onClick={handleDocumentClick}>
                    {/* White document paper */}
                    <div className="flex flex-col justify-between w-24 h-32 p-2 bg-white border border-gray-200 rounded-sm shadow-sm">
                      {/* Top text lines */}
                      <div className="space-y-1">
                        <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-2/3"></div>
                      </div>
                      {/* Bottom text lines */}
                      <div className="space-y-1">
                        <div className="h-0.5 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                    {/* Blue circular stamp with document icon */}
                    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    {/* Signature line - positioned at bottom right of document */}
                    <div className="absolute font-serif text-xs italic text-gray-400 bottom-1 right-1">
                      {signatures.lender ? (
                        <img src={signatures.lender} alt="서명" className="h-4" />
                      ) : (
                        "김기용"
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contract Details */}
              <div className="space-y-4">
                {/* Parties Information */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Creditor (갑) */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">(갑)채권자</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">주소</span>
                        <span className="font-medium text-right text-gray-900">{contractData.lenderAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">주민등록번호</span>
                        <span className="text-right text-gray-900">{contractData.lenderSSN}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">연락처</span>
                        <span className="text-right text-gray-900">{contractData.lenderPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600"></span>
                        <span className="text-right text-gray-900"></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Debtor (을) */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">(을)채무자</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">주소</span>
                        <span className="font-medium text-right text-gray-900">{contractData.borrowerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">주민등록번호</span>
                        <span className="text-right text-gray-900">{contractData.borrowerSSN}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">연락처</span>
                        <span className="text-right text-gray-900">{contractData.borrowerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600"></span>
                        <span className="text-right text-gray-900"></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Loan Terms */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 text-xs gap-x-4 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">계약 날짜</span>
                      <span className="font-medium text-gray-900">{formattedToday} ~ {formattedEndDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">대출 금액</span>
                      <span className="font-medium text-gray-900">{contractData.amount}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">이자율</span>
                      <span className="font-medium text-gray-900">연{contractData.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">변제 방법</span>
                      <span className="font-medium text-gray-900">계약이체</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-2 pt-2">
                  <button 
                    onClick={handleLenderSign}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <PenTool className="w-4 h-4" />
                    채권자 서명
                  </button>
                  <button 
                    onClick={handleSign}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <PenTool className="w-4 h-4" />
                    채무자 서명
                  </button>
                </div>
                
                {/* Legal Notice */}
                <div className="px-2 py-2 text-xs text-center text-gray-500">
                  본 계약은 상기 조건에 따라 대출이 적용될 수 있습니다. 모든 사항<br />
                  관련 법적 절차 기준으로 하였습니다.
                </div>
                
                {/* Main Action Button */}
                <div className="pt-2 pb-4">
                  <button 
                    onClick={handleSendLoan}
                    className="w-full py-3 text-sm font-medium text-white transition-colors bg-blue-500 hover:bg-blue-600 rounded-xl"
                  >
                    대출 요청하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
        />
      )}
    </>
  );
}