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
