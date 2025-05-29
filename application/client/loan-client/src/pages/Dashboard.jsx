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
        <div className="bg-white text-gray-800 p-10 text-[17px]">
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
            <div className="p-8 border rounded-xl mb-12">
                <h2 className="text-xl font-semibold mb-6">새 대출 요청</h2>
                <div className="grid grid-cols-2 gap-6">

                    {/*lender는 고정값 (선택 불가 input으로 표시) */}
                    <input type="text" value={walletAddress}
                        // 로그인한 사용자의 지갑 주소
                        disabled="disabled" className="border px-4 py-3 rounded-lg w-full text-lg bg-gray-100 text-gray-500"/> {/* borrower는 친구 목록 기반 옵션만 표시 */}
                    <select
                        value={newLoan.lender}
                        onChange={(e) => setNewLoan({
                            ...newLoan,
                            lender: e.target.value
                        })}
                        className="border px-4 py-3 rounded-lg w-full text-lg">
                        <option value="">빌려주는 사람 선택</option>
                        {
                            friendWallets.length > 0
                                ? (friendWallets.map((friend) => (
                                    <option key={friend.id} value={friend.wallet_id}>
                                        {friend.name || '이름없음'}
                                        ({friend.email})
                                    </option>
                                )))
                                : (<option disabled="disabled">⚠ 지갑이 있는 친구가 없습니다</option>)
                        }
                    </select>

                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="number"
                            value={newLoan.amount}
                            onChange={(e) => setNewLoan({
                                ...newLoan,
                                amount: parseInt(e.target.value) || 0
                            })}
                            placeholder="대출 금액"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"/>
                        <span className="text-gray-400 ml-2">KRW</span>
                    </div>

                    {/* 대출 기간 + 예정일 */}
                    <div className="relative">
                        <select
                            value={selectedMonths}
                            onChange={handleDurationChange}
                            className="border px-4 py-3 rounded-lg w-full text-lg">
                            <option value="">상환 기간 선택 (개월)</option>
                            {
                                durationOptions.map(
                                    (month) => (<option key={month} value={month}>{month}개월</option>)
                                )
                            }
                        </select>
                        {
                            calculatedEndDate && (
                                <span className="absolute right-4 top-[13px] text-sm text-gray-500">
                                    {
                                        calculatedEndDate
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                </span>
                            )
                        }
                    </div>

                    <div className="flex items-center border rounded-lg px-4 py-3">
                        <input
                            type="number"
                            value={newLoan.interestRate}
                            onChange={(e) => setNewLoan({
                                ...newLoan,
                                interestRate: parseInt(e.target.value) || 0
                            })}
                            placeholder="이자율"
                            className="flex-grow outline-none placeholder-gray-400 text-lg"/>
                        <span className="text-gray-400 ml-2">%</span>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={handleCreateLoan}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                        대출 요청 생성
                    </button>
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