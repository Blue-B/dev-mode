// 2. server.js (Loan API + React 정적 파일 처리 순서 수정)

'use strict';
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();  // .env에서 SUPABASE 설정 불러오기

const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';

// Supabase 클라이언트 초기화 (서버 전용 service_role 사용)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS 설정 추가
app.use(cors());  // 기본적으로 모든 origin 허용

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= 지갑 API ==================

// 지갑 생성
// [GET] /createWallet?userId=uuid
app.post('/wallet/create', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 이미 지갑이 있는지 확인
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', userId)
      .single();

    if (checkError) throw checkError;

    if (existing?.wallet_id) {
      return res.status(200).json({ message: 'Wallet already exists', wallet: existing.wallet_id });
    }

    // 새 지갑 주소 생성 (예: 랜덤 주소 or userId 기반 해시)
    const generatedAddress = `wallet_${userId.slice(0, 8)}_${Date.now()}`;
    const initialBalance = '1000000';  // 기본으로 지급하는 잔액

    // 체인코드로 지갑 생성 요청
    sdk.send(false, 'CreateWallet', [generatedAddress, initialBalance], async (chainResponse) => {
      if (chainResponse.error) {
        return res.status(500).json({ error: 'Blockchain wallet creation failed', detail: chainResponse });
      }

      // Supabase에 wallet_id 저장
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_id: generatedAddress })
        .eq('id', userId);

      if (updateError) {
        return res.status(500).json({ error: 'Wallet created but failed to update Supabase', detail: updateError });
      }

      return res.status(200).json({ message: 'Wallet created', wallet: generatedAddress });
    });

  } catch (error) {
    console.error('[createWallet] error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 지갑 잔액 조회
app.get('/getWalletBalance', function (req, res) {
    let { address } = req.query;
    let args = [address];
    sdk.send(true, 'GetWalletBalance', args, res);
});

// ================= 대출 시스템 API ==================

// 대출 요청 생성
app.get('/createLoan', function (req, res) {
    let { id, lender, borrower, amount, durationDays, interestRate } = req.query;
    let args = [id, lender, borrower, amount, durationDays, interestRate];
    sdk.send(false, 'CreateLoanRequest', args, res);
});

// 대출 승인
app.get('/approveLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(false, 'ApproveLoanRequest', args, res);
});

// 대출 거절
app.get('/denyLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(false, 'DenyLoanRequest', args, res);
});

// 대출 상환
app.get('/repayLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(false, 'RepayLoan', args, res);
});

// 단일 대출 요청 조회
app.get('/queryLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(true, 'QueryLoanRequest', args, res);
});

// 전체 대출 요청 조회
app.get('/queryAllLoans', function (req, res) {
    sdk.send(true, 'QueryAllLoanRequests', [], res);
});

// ================= 정적 파일 서비스 및 React 라우팅 ==================

const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// 마지막에만 index.html 반환 (SPA 대응용)
app.get('*', function (req, res) {
    res.sendFile(path.join(clientPath, 'index.html'));
});

// 서버 시작
app.listen(PORT, HOST);
console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
