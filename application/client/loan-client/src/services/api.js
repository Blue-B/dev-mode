import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

// 지갑 관련 API
// POST 방식으로 변경
export const createWallet = async (userId) => {
  try {
     console.log("api.js Sending wallet create request", userId);
    const response = await axios.post(`${API_BASE_URL}/wallet/create`, { userId });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getWalletBalance = async (address) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/getWalletBalance`, {
            params: { address }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 대출 관련 API
export const createLoan = async (loanData) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/createLoan`, {
            params: loanData
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const approveLoan = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/approveLoan`, {
            params: { id }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const denyLoan = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/denyLoan`, {
            params: { id }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const repayLoan = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/repayLoan`, {
            params: { id }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const queryLoan = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/queryLoan`, {
            params: { id }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const queryAllLoans = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/queryAllLoans`);
        return response.data;
    } catch (error) {
        throw error;
    }
}; 