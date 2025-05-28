// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8001';

// // 지갑 관련 API
// // POST 방식으로 변경
// export const createWallet = async (userId) => {
//   try {
//      console.log("api.js Sending wallet create request", userId);
//     const response = await axios.post(`${API_BASE_URL}/wallet/create`, { userId });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };


// export const getWalletBalance = async (address) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/getWalletBalance`, {
//             params: { address }
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// // 대출 관련 API
// export const createLoan = async (loanData) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/createLoan`, {
//             params: loanData
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const approveLoan = async (id) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/approveLoan`, {
//             params: { id }
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const denyLoan = async (id) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/denyLoan`, {
//             params: { id }
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const repayLoan = async (id) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/repayLoan`, {
//             params: { id }
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const queryLoan = async (id) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/queryLoan`, {
//             params: { id }
//         });
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const queryAllLoans = async () => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/queryAllLoans`);
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// }; 


// // 대출풀 관련 API

// export const createPool = async (poolData) => {
//   return await axios.post(`${API_BASE_URL}/createPool`, poolData);
// };

// // 특정 대출풀 조회 (체인코드 기반)
// export const queryPool = async (id) => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/queryPool`, {
//       params: { id }
//     });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const queryAllPools = async () => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/queryAllPools`);
//     console.log("🌐 API 응답:", response.data);

//     const result = Array.isArray(response.data) ? response.data : response.data.result;
//     return result;
//   } catch (error) {
//     console.error('Error fetching all pools:', error);
//     throw error;
//   }
// };

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

// 지갑 관련 API
export const createWallet = async (userId) => {
  try {
    console.log("api.js Sending wallet create request", userId);
    const response = await axios.post(`${API_BASE_URL}/wallet/create`, { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWalletBalance = async (address) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getWalletBalance`, {
      params: { address }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
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
    throw error.response?.data || error;
  }
};

export const approveLoan = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approveLoan`, {
      params: { id }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const denyLoan = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/denyLoan`, {
      params: { id }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const repayLoan = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/repayLoan`, {
      params: { id }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const queryLoan = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/queryLoan`, {
      params: { id }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const queryAllLoans = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/queryAllLoans`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 대출풀 관련 API
export const createPool = async (poolData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/createPool`, poolData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const queryPool = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/queryPool`, {
      params: { id }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const queryAllPools = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/queryAllPools`);
    console.log("🌐 API 응답:", response.data);

    const result = Array.isArray(response.data) ? response.data : response.data.result;
    return result;
  } catch (error) {
    console.error('Error fetching all pools:', error);
    throw error.response?.data || error;
  }
};
