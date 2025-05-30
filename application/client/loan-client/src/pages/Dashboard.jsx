import React, {useState, useEffect, useMemo} from 'react';
import { HandHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

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
            loadMyLoans();
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
                        onClick={() => navigate('/loanpool/request')}
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