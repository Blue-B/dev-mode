// 2. server.js (Loan API + React 정적 파일 처리 순서 수정)

'use strict';
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const axios = require('axios');
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
  process.env.SUPABASE_SERVICE_ROLE_KEY  // // 이게 anon이면 안 됨
);

// Resend 클라이언트 초기화
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("✅ SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("✅ SERVICE_ROLE_KEY 시작:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-20, -1));

// CORS 설정 추가
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8001', 'http://127.0.0.1:3000', 'http://127.0.0.1:8001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('인증 에러:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// ================= 지갑 API ==================

// 지갑 생성
app.post('/wallet/create', async (req, res) => {
  const { userId } = req.body;

  // 1. 기존 지갑 확인
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('wallet_id')
    .eq('id', userId)
    .single();

  if (checkError) return res.status(500).json({ error: '지갑 조회 실패' });
  if (existing?.wallet_id) return res.status(200).json({ message: '기존 지갑 존재', wallet: existing.wallet_id });

  // 2. 지갑 ID 생성 및 Supabase 업데이트
  const walletId = `wallet_${userId.slice(0, 8)}_${Date.now()}`;
  const initialBalance = '1000000';

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ wallet_id: walletId })
    .eq('id', userId);

  if (updateError) return res.status(500).json({ error: 'wallet_id 업데이트 실패' });

  // 3. 체인코드 호출을 중간 경유 라우트로 전송 (res 직접 넘기지 않음)
  // => /chain/createWallet?address=wallet_xxx&initialBalance=1000000
  try {
    const chainResponse = await axios.get(`http://localhost:8001/chain/createWallet`, {
      params: {
        address: walletId,
        initialBalance,
      },
    });

    if (chainResponse.data !== 'Success') {
      return res.status(500).json({ error: '블록체인 지갑 생성 실패' });
    }

    // 4. 트랜잭션 기록
    const { error: txError } = await supabase.from('wallet_transactions').insert([
      {
        user_id: userId,
        type: 'deposit',
        amount: parseFloat(initialBalance),
        memo: '초기 입금 (지갑 생성)',
      },
    ]);

    if (txError) return res.status(500).json({ error: '트랜잭션 기록 실패' });

    return res.status(200).json({ message: '지갑 생성 완료', wallet: walletId });
  } catch (err) {
    return res.status(500).json({ error: '체인코드 호출 실패', detail: err.message });
  }
});

app.get('/chain/createWallet', function (req, res) {
  let { address, initialBalance } = req.query;
  let args = [address, initialBalance || "0"];
  sdk.send(false, 'CreateWallet', args, res);
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

// React 앱의 정적 파일 서빙
const clientPath = path.join(__dirname, '../client/loan-client/build');
app.use(express.static(clientPath));

// API 라우트는 정적 파일 서빙 전에 정의
app.post('/api/inquiry', authenticateUser, async (req, res) => {
  try {
    const { name, email, message, captchaToken } = req.body;

    // 필수 필드 검증
    if (!name || !email || !message || !captchaToken) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // reCAPTCHA 검증
    const isValidCaptcha = await verifyRecaptcha(captchaToken);
    if (!isValidCaptcha) {
      return res.status(400).json({ error: '캡챠 인증에 실패했습니다.' });
    }

    // Supabase에 문의 저장
    const { error: dbError } = await supabase
      .from('inquiries')
      .insert([
        {
          name,
          email,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('Supabase 에러:', dbError);
      throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
    }

    // 자동 응답 이메일 전송
    try {
      await resend.emails.send({
        from: '깐부대출 <noreply@fitend.com>',
        to: email,
        subject: '문의가 접수되었습니다',
        html: `
          <h2>문의 접수 확인</h2>
          <p>안녕하세요, ${name}님</p>
          <p>문의하신 내용이 성공적으로 접수되었습니다.</p>
          <p>문의 내용을 검토한 후, 가능한 경우 답변 드리도록 하겠습니다.</p>
          <p>문의 내용:</p>
          <p>${message}</p>
          <p>감사합니다.</p>
          <p>깐부대출 드림</p>
        `
      });
    } catch (emailError) {
      console.error('이메일 전송 에러:', emailError);
      // 이메일 전송 실패는 전체 프로세스를 실패시키지 않음
    }

    res.json({ success: true });
  } catch (error) {
    console.error('문의하기 에러:', error);
    res.status(500).json({ error: error.message || '문의 접수 중 오류가 발생했습니다.' });
  }
});

// 마지막에만 index.html 반환 (SPA 대응용)
app.get('*', function (req, res) {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// reCAPTCHA 검증 함수
async function verifyRecaptcha(token) {
  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      }
    });
    return response.data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// 서버 시작
app.listen(PORT, HOST);
console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
