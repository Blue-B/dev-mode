import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

// 지갑 관련 API
export const createWallet = async (address, initialBalance) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/createWallet`, {
            params: { address, initialBalance }
        });
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