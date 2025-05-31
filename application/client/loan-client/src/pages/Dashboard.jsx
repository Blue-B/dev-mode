import React, {useState, useEffect, useMemo} from 'react';
import {
    createWallet,
    getWalletBalance,
    createLoan,
    approveLoan,
    denyLoan,
    queryMyLoans
} from '../services/api';
import {v4 as uuidv4} from 'uuid';
import {useAuth} from '../contexts/AuthContext';
import {createClient} from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom'; 
import { HandHeart, Send } from 'lucide-react';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

// 1개월 ~ 60개월까지 반복 생성
const durationOptions = Array.from({
    length: 60
}, (_, i) => i + 1);

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [balance, setBalance] = useState(0);
    const [loans, setLoans] = useState([]);
    const [newLoan, setNewLoan] = useState({
        lender: '', // 대출자 지갑 주소
        borrower: '', // 차입자 지갑 주소
        amount: 0, //대출 금액
        durationDays: 0, //상환 기간
        interestRate: 0, //이자율
        endDateTimestamp: null // 상환일

    });
    const [selectedMonths, setSelectedMonths] = useState(0); // 상환 기간
    const [calculatedEndDate, setCalculatedEndDate] = useState(null);
    const [friendWallets, setFriendWallets] = useState([]);
    const [loadingWallet, setLoadingWallet] = useState(true);

    const {user} = useAuth();
    const navigate = useNavigate();

    // 로그인한 사용자 잔액 가져오기
    useEffect(() => {
        const fetchWalletFromProfile = async () => {
            if (!user?.id) return;
            try {
                const {data, error} = await supabase
                    .from('profiles')
                    .select('wallet_id')
                    .eq('id', user.id)
                    .single();

                if (error) 
                    throw error;
                if (
                    data
                        ?.wallet_id
                ) {
                    setWalletAddress(data.wallet_id); // 지갑 주소 설정
                }
            } catch (err) {
                console.error('🔍 지갑 주소 조회 실패:', err.message);
            } finally {
                setLoadingWallet(false);
            }
        };

        fetchWalletFromProfile();
    }, [user?.id]);

    // walletAddress가 설정되었을 때 잔액 조회
    useEffect(() => {
        if (walletAddress) {
            setNewLoan(prev => ({
                ...prev,
                borrower: walletAddress
            }));
            fetchBalance();
        }
    }, [walletAddress]);

    useEffect(() => {
        const fetchFriendWallets = async () => {
            if (!user?.id) return;
            
            // 1. 내가 보낸 요청 + 받은 요청 모두 조회
            const {data: sent, error: sentError} = await supabase
                .from('friends')
                .select('friend_user_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            const {data: received, error: receivedError} = await supabase
                .from('friends')
                .select('user_id')
                .eq('friend_user_id', user.id)
                .eq('status', 'accepted');

            if (sentError || receivedError) {
                console.error('친구 목록 조회 실패:', sentError || receivedError);
                return;
            }

            // 2. 상대방 ID 목록 합치기
            const friendIds = [
                ...sent.map(f => f.friend_user_id),
                ...received.map(f => f.user_id)
            ];

            // 3. 상대방 프로필에서 지갑 포함 조회
            const {data: profiles, error: profileError} = await supabase
                .from('profiles')
                .select('id, name, email, wallet_id')
                .in ('id', friendIds);

            if (profileError) {
                console.error('친구 프로필 조회 실패:', profileError);
                return;
            }

            setFriendWallets(profiles.filter(p => p.wallet_id));
        };

        fetchFriendWallets();
    }, [user?.id]);

    // 1) wallet_id → profile 객체 매핑
    const profileMap = useMemo(() => {
        return friendWallets.reduce((acc, profile) => {
            acc[profile.wallet_id] = profile;
            return acc;
        }, {});
    }, [friendWallets]);

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
            const {lender, borrower, amount, interestRate} = newLoan;

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
            await loadMyLoans();

            setNewLoan({
                lender: '',
                borrower: '',
                amount: 0,
                durationDays: 0,
                interestRate: 0,
                endDateTimestamp: null
            });
            setSelectedMonths(0);
            setCalculatedEndDate(null);
        } catch (error) {
            console.error('대출 요청 생성 실패:', error);
            alert('대출 요청 생성 실패: ' + (
                error.response
                    ?.data
                        ?.message || error.message
            ));
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

    // 내 대출 목록만 가져오기
    const loadMyLoans = async () => {
        try {
            const result = await queryMyLoans(walletAddress);
            setLoans(
                Array.isArray(result)
                    ? result
                    : []
            );
        } catch (error) {
            console.error('내 대출 조회 실패:', error);
            alert('내 대출 조회 실패: ' + (
                error.response
                    ?.data
                        ?.error || error.message
            ));
            setLoans([]);
        }
    };

    useEffect(() => {
        if (walletAddress) 
            loadMyLoans();
        }
    , [walletAddress]);

    // 대출 승인
    const handleApproveLoan = async (loanId) => {
        try {
            await approveLoan(loanId);
            alert('대출이 승인되었습니다!');
            await loadMyLoans();
        } catch (error) {
            console.error('대출 승인 실패:', error);
            alert('대출 승인 실패: ' + (
                error.response
                    ?.data
                        ?.message || error.message
            ));
        }
    };

    // 대출 거절
    const handleDenyLoan = async (loanId) => {
        try {
            await denyLoan(loanId);
            alert('대출이 거절되었습니다!');
            await loadMyLoans();
        } catch (error) {
            console.error('대출 거절 실패:', error);
            alert('대출 거절 실패: ' + (
                error.response
                    ?.data
                        ?.message || error.message
            ));
        }
    };

    // if (loadingWallet || !walletAddress) {     return (         <div
    // className="flex items-center justify-center h-[60vh]">         <p
    // className="text-gray-500 text-lg">🪙 지갑을 불러오는 중입니다. 잠시만 기다려주세요...</p> </div>
    // ); }

    return (
        <div className="bg-white text-gray-800 p-20 text-[17px] ">
            {/* 상단 카드 */}
            <div className="grid grid-cols-4 gap-4 mb-10">
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">신용 점수</p>
                    <p className="text-3xl font-bold">850
                        <span className="text-green-500 text-base">▲2.5%</span>
                    </p>
                </div>
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">활성 대출</p>
                    <p className="text-3xl font-bold">{
                            loans
                                .filter(loan => loan.status === 'Active')
                                .length
                        }</p>
                    <p className="text-base">총 {
                            loans
                                .filter(loan => loan.status === 'Active')
                                .reduce((sum, loan) => sum + loan.amount, 0)
                                .toLocaleString()
                        }
                        KRW</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">대출 상환율</p>
                    <p className="text-3xl font-bold">98%</p>
                    <p className="text-xs text-gray-400">지난 12개월</p>
                </div>
                <div className="p-6 border rounded-xl">
                    <p className="text-sm text-gray-500">이용 가능한 한도</p>
                    <p className="text-3xl font-bold">{balance.toLocaleString()}
                        KRW</p>
                    <p className="text-xs text-gray-400">현재 잔액</p>
                </div>
            </div>

            {/* 대출 요청 섹션 */}
            {/* 요청 강조 카드 */}
            <div className="relative flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-300 text-white rounded-2xl shadow-xl p-8 min-h-[220px] mb-10">
            {/* 왼쪽 콘텐츠 */}
            <div className="z-10 space-y-3 max-w-md">
                {/* 아이콘 + 제목 */}
                <div className="flex items-center space-x-3">
                {/* <div className="bg-white bg-opacity-20 p-2 rounded-xl">
                    <img src="/loan-icon.png" alt="loan icon" className="w-6 h-6" />
                </div> */}
                <h1 className="text-2xl font-semibold">친구에게 대출 요청</h1>
                </div>

                {/* 설명 텍스트 */}
                <p className="text-ml leading-relaxed">
                <span className="font-semibold">쉽고 빠르게</span> 친구에게 대출을 요청하세요.<br />
                요청이 승인되면 즉시 대출이 진행됩니다.
                </p>

                {/* 버튼 */}
                <button
                onClick={() => navigate('/dashboard/request')}
                className="mt-2 inline-flex items-center bg-white text-blue-700 px-7 py-3 rounded-lg font-semibold shadow hover:bg-gray-100 transition"
                >
                <Send size={16} className="mr-2" />
                친구 대출 요청하기
                </button>
            </div>

            {/* 오른쪽 큰 아이콘 */}
            <div className="absolute right-6 bottom-6 opacity-30 hidden sm:block">
                <HandHeart size={60} />
            </div>
            </div>

            {/* 최근 활동 */}
            {/* 로그인한 유저가 참여한 대출 활동 (최신순 정렬) */}
            <div>
                <h2 className="text-xl font-semibold mb-4">최근 활동</h2>
                <div className="space-y-4">
                    {
                        loans.map(loan => {
                                const isLender = loan.lender === walletAddress;
                                const otherId = isLender ? loan.borrower : loan.lender;
                                const other = profileMap[otherId] || {};
                                const otherName = other.name || other.email || otherId;
                                let text = '';
                                switch (loan.status) {
                                case 'Pending':
                                    text = isLender
                                    ? `${otherName}님이 대출을 요청했습니다`
                                    : `${otherName}님에게 대출을 요청했습니다`;
                                    break;
                                case 'Active':
                                    text = isLender
                                    ? `${otherName}님의 대출을 승인했습니다`
                                    : `${otherName}님에게 대출을 받았습니다`; break;
                                case 'Repaid':
                                    text = isLender
                                    ? `${otherName}님이 상환했습니다`
                                    : `상환한 대출입니다`; break;
                                case 'Denied':
                                    text = isLender
                                    ? `${otherName}님의 요청 거절됨`
                                    : `내 요청 거절됨`; break;
                                default: text = '';
                            }

                            return (
                                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-xl mb-2">
                                    {/* 왼쪽: 텍스트 */}
                                    <div className="flex flex-col">
                                        <p className="mb-1">{text}</p>
                                        <p className="text-sm text-gray-500">
                                        {loan.amount.toLocaleString()} KRW • {loan.durationDays}일
                                        </p>
                                    </div>

                                    {/* 오른쪽: Pending 버튼 또는 상태 뱃지 */}
                                    <div className="flex items-center space-x-2">
                                        {loan.status === 'Pending' && isLender && (
                                        <>
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
                                        </>
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
                                            <span className="text-xl">✔</span>
                                            <span>완료</span>
                                        </span>
                                        )}
                                    </div>
                                    </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );

}

export default Dashboard;