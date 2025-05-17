// // src/App.js
// import React, { useState } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [loanInfo, setLoanInfo] = useState({
//     loanid: '',
//     requester: '',
//     provider: '',
//     amount: '',
//     durationDays: ''
//   });

//   const [message, setMessage] = useState('');
//   const [context, setContext] = useState('');

//   const handleChange = (e) => {
//     setLoanInfo({ ...loanInfo, [e.target.name]: e.target.value });
//   };

//   // 🔄 수정: proxy를 사용할 수 있도록 절대 주소 제거
//   const callAPI = async (endpoint, contextType) => {
//     try {
//       const res = await axios.get(endpoint); // axios가 /api 경로를 proxy 설정에 따라 전달함
//       setMessage(JSON.stringify(res.data, null, 2));
//       setContext(contextType);
//     } catch (error) {
//       setMessage('❌ ' + error.message);
//       setContext(contextType);
//     }
//   };

//   return (
//     <div style={{ backgroundColor: '#f5f7fa', fontFamily: 'Noto Sans KR, sans-serif', minHeight: '100vh' }}>
//       <header style={{ backgroundColor: '#2c3e50', color: 'white', fontSize: '26px', textAlign: 'center', padding: '20px 0', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
//         Hyperledger Fabric 깐부 대출 DApp
//       </header>

//       <div id="body" style={{ margin: '0 auto', width: '70%' }}>

//         <div className="form-group">
//           <label>대출 요청 생성</label>
//           {context === 'create' && message && <h5>{message}</h5>}
//           <input className="form-control" type="text" placeholder="대출 ID 입력" name="loanid" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="요청자 이름 입력" name="requester" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="대출 금액 입력" name="amount" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="대출 기간 입력" name="durationDays" onChange={handleChange} />
//           <button className="btn btn-primary" onClick={() => callAPI(`/createLoan?id=${loanInfo.loanid}&requester=${loanInfo.requester}&amount=${loanInfo.amount}&durationDays=${loanInfo.durationDays}`, 'create')}>대출 요청 생성</button>
//         </div>

//         <div className="form-group">
//           <label>대출 요청 승인</label>
//           {context === 'approve' && message && <h5>{message}</h5>}
//           <input className="form-control" type="text" placeholder="승인할 대출 ID 입력" name="loanid" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="대출 제공자 이름 입력" name="provider" onChange={handleChange} />
//           <button className="btn btn-success" onClick={() => callAPI(`/approveLoan?id=${loanInfo.loanid}&provider=${loanInfo.provider}`, 'approve')}>대출 요청 승인</button>
//         </div>

//         <div className="form-group">
//           <label>대출 요청 삭제</label>
//           {context === 'delete' && message && <h5>{message}</h5>}
//           <input className="form-control" type="text" placeholder="삭제할 대출 ID 입력" name="loanid" onChange={handleChange} />
//           <button className="btn btn-danger" onClick={() => callAPI(`/deleteLoan?id=${loanInfo.loanid}`, 'delete')}>대출 요청 삭제</button>
//         </div>

//         <div className="form-group">
//           <label>대출 요청 수정</label>
//           {context === 'update' && message && <h5>{message}</h5>}
//           <input className="form-control" type="text" placeholder="수정할 대출 ID 입력" name="loanid" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="새 금액 입력" name="amount" onChange={handleChange} />
//           <input className="form-control" type="text" placeholder="새 기간 입력" name="durationDays" onChange={handleChange} />
//           <button className="btn btn-warning" onClick={() => callAPI(`/updateLoan?id=${loanInfo.loanid}&newAmount=${loanInfo.amount}&newDurationDays=${loanInfo.durationDays}`, 'update')}>대출 요청 수정</button>
//         </div>

//         <div className="form-group">
//           <label>단일 대출 요청 조회</label>
//           {context === 'query' && message && <h5>{message}</h5>}
//           <input className="form-control" type="text" placeholder="조회할 대출 ID 입력" name="loanid" onChange={handleChange} />
//           <button className="btn btn-info" onClick={() => callAPI(`/queryLoan?id=${loanInfo.loanid}`, 'query')}>대출 요청 조회</button>
//         </div>

//         <div className="form-group">
//           <label>전체 대출 요청 조회</label>
//           {context === 'queryAll' && message && <h5>{message}</h5>}
//           <button className="btn btn-default" onClick={() => callAPI('/queryAllLoans', 'queryAll')}>전체 대출 요청 조회</button>
//         </div>

//       </div>
//     </div>
//   );
// }

// export default App;

// src/App.js
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Friend from './pages/Friend';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* <Route path="/" element={<Dashboard />} /> */}
          <Route path="/friend" element={<Friend />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

