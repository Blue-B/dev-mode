import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const API_BASE_URL = 'http://localhost:8001';

// API 요청을 위한 axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 지갑 관련 API
/**
 * Supabase에서 로그인 유저의 wallet_id를 조회하는 함수
 * @param {string} userId Supabase auth.users.id
 * @returns {Promise<string>} wallet_id
 */
export const getUserWalletAddress = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_id')
    .eq('id', userId)
    .single();

  if (error) throw new Error('지갑 주소 조회 실패: ' + error.message);
  if (!data?.wallet_id) throw new Error('지갑 주소가 등록되지 않았습니다.');
  return data.wallet_id;
};

// POST 방식으로 변경
export const createWallet = async (userId) => {
  try {
    const response = await api.post('/wallet/create', { userId });
    return response.data;
  } catch (error) {
    console.error('api.js Sending wallet create request', userId);
    throw error;
  }
};

export const getWalletBalance = async (address) => {
  try {
    const response = await api.get(`/getWalletBalance?address=${address}`);
    return response.data;
  } catch (error) {
    console.error('잔액 조회 실패:', error);
    throw error;
  }
};

// 대출 관련 API
export const createLoan = async (loanData) => {
  try {
    const response = await api.get('/createLoan', {
      params: {
        id: loanData.id,
        lender: loanData.lender,
        borrower: loanData.borrower,
        amount: loanData.amount,
        durationDays: loanData.durationDays,
        interestRate: loanData.interestRate
      }
    });
    return response.data;
  } catch (error) {
    console.error('대출 생성 실패:', error);
    throw error;
  }
};

export const approveLoan = async (loanId) => {
  try {
    const response = await api.get(`/approveLoan?id=${loanId}`);
    return response.data;
  } catch (error) {
    console.error('대출 승인 실패:', error);
    throw error;
  }
};

export const denyLoan = async (loanId) => {
  try {
    const response = await api.get(`/denyLoan?id=${loanId}`);
    return response.data;
  } catch (error) {
    console.error('대출 거절 실패:', error);
    throw error;
  }
};

export const repayLoan = async (id) => {
    try {
        const response = await api.get(`/repayLoan?id=${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const queryLoan = async (id) => {
    try {
        const response = await api.get(`/queryLoan?id=${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const queryAllLoans = async () => {
  try {
    const response = await api.get('/queryAllLoans');
    return response.data;
  } catch (error) {
    console.error('대출 조회 실패:', error);
    throw error;
  }
}; 

export const queryMyLoans = async (walletAddress) => {
  try {
    const response = await api.get(`/myLoans?wallet=${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('내 대출 목록 조회 실패:', error);
    throw error;
  }
};

// 대출풀 관련 API (api 인스턴스 사용)
export const createPool = async (poolData) => {
  try {
    const response = await api.post('/createPool', poolData);

    return response.data;
  } catch (error) {
    console.error('대출풀 생성 실패:', error);
    throw error;
  }
};

export const queryPool = async (id) => {
  try {
    const response = await api.get(`/queryPool?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('단일 풀 조회 실패:', error);
    throw error;
  }
};

export const queryAllPools = async () => {
  try {
    const response = await api.get('/queryAllPools');

    // 🔧 participants와 weights를 보정
    const fixedData = (Array.isArray(response.data) ? response.data : response.data.result).map(pool => ({
      ...pool,
      participants: Array.isArray(pool.participants) ? pool.participants : [],
      weights: typeof pool.weights === 'object' && pool.weights !== null ? pool.weights : {},
    }));

    return fixedData;
  } catch (error) {
    console.error('전체 풀 조회 실패:', error);
    throw error;
  }
};

export const joinPool = async ({ poolID, userAddress, deposit }) => {
  try {
    const response = await api.post('/joinPool', { poolID, userAddress, deposit });
    return response.data;
  } catch (error) {
    console.error('풀 참여 실패:', error);
    throw error;
  }
};

/**
 * 현재 로그인된 유저 정보 가져오기
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * 프로필(지갑 주소 등) 가져오기
 * @param {string} userId
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')          // 프로필 테이블의 모든 칼럼 Fetch
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;            // { id, name, phone, birth_number, gender, wallet_id, ... }
}

// 현재 로그인한 사용자의 친구 목록을 조회하고, 친구들의 프로필 중 wallet_id가 존재하는 친구만 상태에 저장
export const fetchAcceptedFriendsWithWallets = async (userId, supabase) => {
    if (!userId) return [];

    // 1. 친구 요청 (내가 보낸 것)
    const { data: sent, error: sentError } = await supabase
        .from('friends')
        .select('friend_user_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

    // 2. 친구 요청 (내가 받은 것)
    const { data: received, error: receivedError } = await supabase
        .from('friends')
        .select('user_id')
        .eq('friend_user_id', userId)
        .eq('status', 'accepted');

    if (sentError || receivedError) {
        throw new Error('친구 목록 조회 실패');
    }

    const friendIds = [
        ...sent.map(f => f.friend_user_id),
        ...received.map(f => f.user_id),
    ];

    if (friendIds.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

    if (profileError) {
        throw new Error('친구 프로필 조회 실패');
    }

    // wallet_id가 null이 아닌 친구들만 포함한 배열을 반환
    return profiles.filter(profile => profile.wallet_id);
};

/**
 * 친구 추가 요청
 * - Express 서버: POST /api/friends/add
 * @param {string} userId
 * @param {string} friendEmail
 */
export async function sendFriendRequest(userId, friendEmail) {
  try {
    const response = await api.post('/api/friends/add', {
      userId,
      friendEmail,
    });
    return response.data;
  } catch (error) {
   console.error('[app.js] sendFriendRequest 실패:', {
      url: error.config.url,
      method: error.config.method,
      data: error.config.data,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
    });
    throw error;
  }
}

/**
 * 친구 목록 조회
 * - Express 서버: GET /api/friends
 * @param {string} userId
 */
export async function getFriendList(userId) {
  try {
    const response = await api.get('/api/friends');
    return response.data.friends || [];
  } catch (error) {
    console.error('[app.js] getFriendList 실패:', error);
    throw error;
  }
}

/**
 * 받은 친구 요청 조회
 * - Express 서버: GET /api/friends/received
 * @param {string} userId
 */
export async function getReceivedRequests() {
  try {
    const response = await api.get('/api/friends/received');
    return response.data.requests || [];
  } catch (error) {
    console.error('[app.js] getReceivedRequests 실패:', error);
    throw error;
  }
}


/**
 * 친구 요청 수락/거절
 * - Express 서버: PATCH /api/friends/request
 * @param {string} requestId
 * @param {boolean} accept
 */
export async function handleFriendRequest(requestId, accept = true) {
  try {
    const response = await api.patch('/api/friends/request', {
      requestId,
      status: accept ? 'accepted' : 'rejected',
    });
    return response.data;
  } catch (error) {
    console.error('[app.js] handleFriendRequest 실패:', error);
    throw error;
  }
}
