import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { createLoan, getUserProfile } from '../../services/api';
import DetailedContract from "./DetailedContract";
import SignatureModal from "./SignatureModal";
import { X, FileText, PenTool } from "lucide-react";
import html2canvas from "html2canvas";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

export default function LoanAgreement({
  loanData,
  selectedFriend,
  estimatedRepaymentDate,
  totalRepayment,
  startDate,
  endDate,
  goToPreviousStep,
  goToNextStep
}) {
  const navigate = useNavigate();
  const [showDetailedContract, setShowDetailedContract] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSigner, setCurrentSigner] = useState(null);
  const [signatures, setSignatures] = useState({
    lender: null,
    borrower: null
  });
 
  const [isRequesting, setIsRequesting] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  const [myProfile, setMyProfile] = useState(null); // 현재 로그인된 사용자의 프로필
   
  // 내 프로필 가져오기 (Supabase)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const profile = await getUserProfile(user.id);
        setMyProfile(profile);
      } catch (err) {
        console.error("내 프로필 조회 실패:", err);
      }
    })();
  }, [user]);
  
  useEffect(() => {
    // 대출자(갑), 채무자(을) user_id로 서명 불러오기
    const fetchSignatures = async () => {
      if (!selectedFriend?.id || !user?.id) return;
      const { data: lenderSig } = await supabase
        .from('signatures')
        .select('signature_data')
        .eq('user_id', selectedFriend.id)
        .single();
      const { data: borrowerSig } = await supabase
        .from('signatures')
        .select('signature_data')
        .eq('user_id', user.id)
        .single();
      setSignatures({
        lender: lenderSig?.signature_data ? `data:image/svg+xml;base64,${lenderSig.signature_data}` : null,
        borrower: borrowerSig?.signature_data ? `data:image/svg+xml;base64,${borrowerSig.signature_data}` : null
      });
    };
    fetchSignatures();
  }, [selectedFriend?.id, user?.id]);
  
  const contractData = {
    amount: loanData?.amount || "0",
    interestRate: loanData?.interestRate || "0",
    durationMonths: loanData?.durationMonths || "0",
    bankAccount: "신한은행 123-456-789012 (예금주: 김가환)",

    // (1) 대출자(채권자) 정보: 선택된 친구 프로필에서 가져옴
    lenderName: selectedFriend?.name || "",
    lenderSSN: selectedFriend?.birth_number
        ? `${selectedFriend.birth_number}-${"*".repeat(7)}`
        : "010404-*******",
    lenderPhone: selectedFriend?.phone || "010-8674-7678",
    lenderAddress: selectedFriend?.address || "충남 천안시 서북구",

    // (2) 대출받는 사람(차입자) 정보: 내 프로필에서 가져옴
    borrowerName: myProfile?.name || "",
    borrowerSSN: myProfile?.birth_number 
        ? `${myProfile.birth_number}-${"*".repeat(7)}`
        : "010120-3******",
    borrowerPhone: myProfile?.phone || "010-8674-7678",
    borrowerAddress: myProfile?.address || "충남 천안시 서북구",

    guarantor: "김보증 (주민등록번호: 010120-3******, 주소: 충남 천안시 서북구)"
  };

  const handleClose = () => {
    // 팝업을 닫고 이전 단계로 돌아가기
    window.history.back();
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
    if (isRequesting) return; // 중복 요청 방지 (중요!)

    setIsRequesting(true); // 요청 시작 시 상태 업데이트
    
    try {
      // 1. 계약서 이미지 생성
      const contractRef = document.querySelector('.contract-preview');
      if (!contractRef) {
        throw new Error('계약서 미리보기를 찾을 수 없습니다.');
      }

      const canvas = await html2canvas(contractRef, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      // 2. 이미지를 Blob으로 변환
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const contractImage = await blob.text();

      // 3. 대출 생성 요청 (계약서 이미지 포함)
      const result = await createLoan({
        ...loanData,
        contractImage
      });

      console.log('📦 대출 생성 결과:', result);
        
      alert('대출 요청되었습니다.');
      goToNextStep(4);
      
    } catch (error) {
      console.error('대출 생성 실패:', error);
      alert('대출 생성 실패: ' + (error?.response?.data?.message || error.message));
    } finally {
      setIsRequesting(false); // 요청 종료 후 상태 초기화
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
              <div className="relative p-4 mb-4 rounded-lg bg-gray-50 contract-preview">
                <div className="flex justify-center mb-4">
                  <div className="relative cursor-pointer" onClick={handleDocumentClick}>
                    <div className="flex flex-col justify-between w-24 h-32 p-2 bg-white border border-gray-200 rounded-sm shadow-sm">
                      <div className="space-y-1">
                        <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-2/3"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-0.5 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                        <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
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
                    </div>
                  </div>
                </div>
                
                {/* Loan Terms */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 text-xs gap-x-4 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">계약 날짜</span>
                      <span className="font-medium text-gray-900">{startDate}</span>
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
                
                {/* Legal Notice */}
                <div className="px-2 py-2 text-xs text-center text-gray-500">
                  본 계약은 상기 조건에 따라 대출이 적용될 수 있습니다. 모든 사항<br />
                  관련 법적 절차 기준으로 하였습니다.
                </div>
                
                {/* Main Action Button */}
                <div className="pt-2 pb-4">
                  <button 
                    onClick={handleSendLoan}
                    disabled={isRequesting}
                    className={`w-full py-3 text-sm font-medium text-white transition-colors rounded-xl 
                      ${isRequesting ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    {isRequesting ? '요청 중...' : '대출 요청하기'}
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