// 2. server.js (Loan API + React 정적 파일 처리 순서 수정)

'use strict';
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const axios = require('axios');
const crypto = require('crypto');  // crypto 모듈 추가
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
  origin: ['http://localhost:3000', 'http://localhost:8001', 'http://127.0.0.1:3000', 'http://127.0.0.1:8001', 'http://0.0.0.0:3000', 'http://0.0.0.0:8001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Content-Security-Policy 헤더 추가
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "connect-src 'self' http://localhost:* http://127.0.0.1:* http://0.0.0.0:* https://*.supabase.co https://www.google.com https://www.gstatic.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; " +
    "frame-src 'self' https://www.google.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:;"
  );
  next();
});

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
    if (!token) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Supabase 인증 에러:', error);
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
      }

      if (!user) {
        return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      req.user = user;
      next();
    } catch (authError) {
      console.error('인증 처리 에러:', authError);
      return res.status(401).json({ error: '인증 처리 중 오류가 발생했습니다.' });
    }
  } catch (error) {
    console.error('인증 미들웨어 에러:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// ================= 지갑 API ==================

// 지갑 생성
// POST /wallet/create
app.post('/wallet/create', async (req, res) => {
  const { userId } = req.body;
  console.log('\n🏷 [wallet/create] 요청 도착 → userId:', userId);

  // 1. profiles 테이블에서 기존 wallet_id 조회
  console.log('[wallet/create] 1) profiles에서 기존 wallet_id 조회 시작:', { userId });
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('wallet_id')
    .eq('id', userId)
    .single();
  console.log('[wallet/create] 1) profiles 조회 결과 →', { existing, checkError });

  if (checkError) {
    console.error('[wallet/create] 프로필 조회 중 에러 발생:', checkError);
    return res.status(500).json({ error: '지갑 조회 실패', detail: checkError.message });
  }
  if (existing?.wallet_id) {
    console.log('[wallet/create] 이미 존재하는 지갑이 있습니다. existing.wallet_id:', existing.wallet_id);
    return res.status(200).json({ message: '기존 지갑 존재', wallet: existing.wallet_id });
  }

  // 2. 새로운 wallet ID 생성 및 profiles 업데이트
  const walletId = `wallet_${userId.slice(0, 8)}_${Date.now()}`;
  const initialBalance = '1000000'; // 초기 잔액(문자열)
  console.log('[wallet/create] 2) 새 지갑 생성 및 profiles 업데이트 →', { walletId, initialBalance });

  const { error: updateError, data: updateResult } = await supabase
    .from('profiles')
    .update({ wallet_id: walletId })
    .eq('id', userId)
    .select();
  console.log('[wallet/create] 2) profiles 업데이트 결과 →', { updateResult, updateError });

  if (updateError) {
    console.error('[wallet/create] profiles 업데이트 실패:', updateError);
    return res.status(500).json({ error: 'wallet_id 업데이트 실패', detail: updateError.message });
  }

  // 3. 체인코드(블록체인)에 지갑 생성 요청
  console.log('[wallet/create] 3) 체인코드 호출 → /chain/createWallet?address=' + walletId + '&initialBalance=' + initialBalance);
  try {
    const chainResponse = await axios.get(`http://localhost:${PORT}/chain/createWallet`, {
      params: {
        address: walletId,
        initialBalance: initialBalance
      },
    });
    console.log('[wallet/create] 3) 체인코드 응답 →', chainResponse.data);

    // 체인코드에서 “Success” 이외의 응답이 오면 에러 처리
    if (!chainResponse.data) {
      // data 필드가 없거나 빈 값일 경우만 실패 처리
      return res.status(500).json({ error: '블록체인 지갑 생성 실패' });
    }
  } catch (err) {
    console.error('[wallet/create] 체인코드 호출 중 예외 발생 →', err.message);
    return res.status(500).json({ error: '체인코드 호출 실패', detail: err.message });
  }

  // 4. Supabase wallet_transactions 테이블에 “초기 입금 트랜잭션” 기록
  const txObj = {
    user_id: userId,
    type: 'deposit',                        // 거래 유형
    amount: parseFloat(initialBalance),     // 숫자로 변환
    memo: '초기 입금 (지갑 생성)',           // 거래 설명
    // related_user_id: null,                // (필요 시 추가)
    // loan_id: null                         // (필요 시 추가)
  };
  console.log('[wallet/create] 4) wallet_transactions에 INSERT할 데이터 →', txObj);

  const { data: txInserted, error: txError } = await supabase
    .from('wallet_transactions')
    .insert([txObj])
    .select();  // select()를 붙이면 삽입된 레코드를 반환
  console.log('[wallet/create] 4) wallet_transactions INSERT 결과 →', { txInserted, txError });

  if (txError) {
    console.error('[wallet/create] wallet_transactions 삽입 실패 →', txError);
    return res.status(500).json({ error: '트랜잭션 기록 실패', detail: txError.message });
  }

  // 최종 응답
  console.log('[wallet/create] ✅ 지갑 생성 및 트랜잭션 기록 완료 → 지갑ID:', walletId);
  return res.status(200).json({ message: '지갑 생성 완료', wallet: walletId });
});


// ================= 체인코드 중간 라우트 =================
// GET /chain/createWallet?address=xxx&initialBalance=yyy
app.get('/chain/createWallet', async (req, res) => {
  const { address, initialBalance } = req.query;
  const args = [address, initialBalance || "0"];
  console.log('\n🔗 [chain/createWallet] 호출 → 함수: CreateWallet, 인자:', args);

  try {
    const result = await sdk.send(false, 'CreateWallet', args);
    console.log('🎉 [chain/createWallet] Submit 성공 → 응답:', result);
    return res.json(result);
  } catch (error) {
    console.error('🚨 [chain/createWallet] Submit 에러 →', error.message);
    return res.status(500).json({ error: error.message });
  }
});



// 지갑 잔액 조회
app.get('/getWalletBalance', async function (req, res) {
  let { address } = req.query;
  if (!address) return res.status(400).json({ error: '주소가 필요합니다.' });

  try {
    const result = await sdk.send(true, 'GetWalletBalance', [address]);
    return res.json(result);
  } catch (err) {
    console.error('[getWalletBalance] 에러 발생:', err);
    return res.status(500).json({ 
      error: err.message,
      details: err.stack,
      type: err.name
    });
  }
});

// ================= 대출 시스템 API ==================

// 대출 요청 생성
app.get('/createLoan', async function (req, res) {
  const { id, lender, borrower, amount, durationDays, interestRate } = req.query;
  const args = [id, lender, borrower, amount, durationDays, interestRate];

  try {
    const txId = await sdk.send(false, 'CreateLoanRequest', args); // txId 반환됨

    // 체인 호출 성공 → Supabase에 저장
    const { error } = await supabase.from('loans').insert([{
      id: id,                    // 체인에 저장한 loan ID를 그대로 사용
      loan_chain_id: id,         // 체인에 저장한 loan ID
      tx_hash: txId,             // 블록체인 트랜잭션 ID
      created_at: new Date().toISOString(),
      pool_id: null              // pool 없는 경우 null
    }]);

    if (error) {
      console.error('❌ DB 저장 실패:', error);
      return res.status(500).json({ error: 'DB 저장 실패' });
    }

    return res.json({ message: 'Loan created on chain and DB', txId });

  } catch (err) {
    console.error('❌ 체인 오류:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 대출 승인
// GET /approveLoan?id=<loanId>
app.get('/approveLoan', async (req, res) => {
  const { id: loanId } = req.query;
  if (!loanId) {
    return res.status(400).json({ error: 'Loan ID가 필요합니다.' });
  }

  try {
    console.log('[ /approveLoan ] 1) 체인코드 호출 → ApproveLoanRequest(', loanId, ')');
    // 체인코드에 대출 승인 요청 (이때에만 지갑 간 잔액 이동 트랜잭션이 발생)
    const approveResult = await sdk.send(false, 'ApproveLoanRequest', [loanId]);
    console.log('✅ ApproveLoanRequest 성공, 체인 응답 →', approveResult);

    // 승인된 뒤 바로 체인코드에서 loanInfo를 조회
    console.log('[ /approveLoan ] 2) 체인코드 호출 → QueryLoanRequest(', loanId, ')');
    const loanInfo = await sdk.send(true, 'QueryLoanRequest', [loanId]);
    console.log('[ /approveLoan ] 2) 조회된 loanInfo →', loanInfo);
    // 예: loanInfo = {
    //   id: 'de7b8144-0eed-4552-9e19-58abc32b653f',
    //   lender: 'wallet_07187a3f_1748701343119',
    //   borrower: 'wallet_7ebeda91_1748701365403',
    //   amount: 1000000,
    //   durationDays: 360,
    //   interestRate: 5,
    //   status: 'Active',
    //   startTime: 1748701385,
    //   endTime: 1779805385,
    //   poolId: ''
    // }

    const { lender: lenderWalletAddr, borrower: borrowerWalletAddr, amount } = loanInfo;
    console.log('[ /approveLoan ] 2) 파싱된 lender/borrower/amount →', {
      lenderWalletAddr,
      borrowerWalletAddr,
      amount,
    });

    // ───────────────────────────────────────────────────────────────────────────
    // 3) “지갑 주소 → profiles.id(UUID)” 매핑
    //    profiles 테이블에서 wallet_id 칼럼이 실제 지갑 주소(예: 'wallet_07187a3f_...')로 저장되어 있다고 가정
    // ───────────────────────────────────────────────────────────────────────────
    // 3-1) lender 프로필 조회
    const { data: lenderProfile, error: lenderError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_id', lenderWalletAddr)
      .single();

    if (lenderError) {
      console.error('[ /approveLoan ] lender 프로필 조회 실패 →', lenderError);
      return res.status(500).json({ error: '대출자 프로필 조회 실패', detail: lenderError.message });
    }
    if (!lenderProfile) {
      console.error('[ /approveLoan ] 대출자 프로필을 찾을 수 없음 →', lenderWalletAddr);
      return res.status(404).json({ error: `lender 프로필이 존재하지 않습니다: ${lenderWalletAddr}` });
    }
    const lenderUserId = lenderProfile.id; // 실제 UUID
    console.log('[ /approveLoan ] 3-1) lenderUserId (UUID) →', lenderUserId);

    // 3-2) borrower 프로필 조회
    const { data: borrowerProfile, error: borrowerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_id', borrowerWalletAddr)
      .single();

    if (borrowerError) {
      console.error('[ /approveLoan ] borrower 프로필 조회 실패 →', borrowerError);
      return res.status(500).json({ error: '차입자 프로필 조회 실패', detail: borrowerError.message });
    }
    if (!borrowerProfile) {
      console.error('[ /approveLoan ] 차입자 프로필을 찾을 수 없음 →', borrowerWalletAddr);
      return res.status(404).json({ error: `borrower 프로필이 존재하지 않습니다: ${borrowerWalletAddr}` });
    }
    const borrowerUserId = borrowerProfile.id;
    console.log('[ /approveLoan ] 3-2) borrowerUserId (UUID) →', borrowerUserId);

    // ───────────────────────────────────────────────────────────────────────────
    // 4) wallet_transactions 테이블에 “loan_sent”(대출자 출금) & “loan_received”(차입자 입금) 기록
    // ───────────────────────────────────────────────────────────────────────────
    const txOut = {
      user_id: lenderUserId,         // 이제 “프로필 UUID”를 넣어야 함
      type: 'loan_sent',
      amount: -Math.abs(amount),     // 출금 금액은 음수
      related_user_id: borrowerUserId,
      loan_id: loanId,
      memo: '친구 대출 승인 - 출금',
      // created_at: 생략하면 default now()가 자동으로 들어갑니다.
    };
    const txIn = {
      user_id: borrowerUserId,
      type: 'loan_received',
      amount: Math.abs(amount),      // 입금은 양수
      related_user_id: lenderUserId,
      loan_id: loanId,
      memo: '친구 대출 승인 - 입금',
    };

    console.log('[ /approveLoan ] 4) Supabase 에 INSERT할 txOut →', txOut);
    console.log('[ /approveLoan ] 4) Supabase 에 INSERT할 txIn →', txIn);

    const { data: txData, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([txOut, txIn]);

    if (txError) {
      console.error('[ /approveLoan ] Supabase INSERT 실패 →', txError);
      return res.status(500).json({ error: 'wallet_transactions 기록 실패', detail: txError.message });
    }

    console.log('[ /approveLoan ] 4) Supabase INSERT 결과 →', txData);

    // 최종 응답
    return res.json({
      success: true,
      message: '대출 승인 완료 (체인+DB 기록됨)',
      chainResult: approveResult,
      transactions: txData,
    });

  } catch (err) {
    console.error('[ /approveLoan ] 🚨 에러 발생 →', err);
    return res.status(500).json({ error: err.message });
  }
});

// 대출 거절
app.get('/denyLoan', async (req, res) => {
  const { id } = req.query;
  console.log('📥 대출 거절 요청 도착 id =', id);

  try {
    const result = await sdk.send(false, 'DenyLoanRequest', [id]);
    console.log('✅ DenyLoanRequest 성공, 체인코드 응답 =', result);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('❌ DenyLoanRequest 오류:', err.message);
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// 대출 상환
app.get('/repayLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(false, 'RepayLoan', args, res);
});

// 단일 대출 요청 조회
// app.get('/queryLoan', function (req, res) {
//     let { id } = req.query;
//     let args = [id];
//     sdk.send(true, 'QueryLoanRequest', args, res);
// });
app.get('/queryLoan', async function (req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Loan ID가 필요합니다.' });

  try {
    const result = await sdk.send(true, 'QueryLoanRequest', [id]);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// 전체 대출 요청 조회
// app.get('/queryAllLoans', function (req, res) {
//     sdk.send(true, 'QueryAllLoanRequests', [], res);
// });
app.get('/queryAllLoans', async (req, res) => {
  try {
    const result = await sdk.send(true, 'QueryAllLoanRequests', []);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 로그인한 유저 관련 대출만 반환하는 API
app.get('/myLoans', async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: '지갑 주소가 필요합니다.' });

  try {
    // 체인코드 직접 호출
    const loans = await sdk.send(true, 'QueryMyLoans', [wallet]);
    res.json(loans);
  } catch (err) {
    console.error('myLoans API 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

//= ================= 대출풀 시스템 API ==================
// 대출풀 생성
// server.js - createPool
app.post('/createPool', async (req, res) => {
  const { id, name, minDeposit, interestRate, durationMonths } = req.body;
  const args = [id, name, minDeposit.toString(), interestRate.toString(), durationMonths.toString()];

  console.log("📥 풀 생성 요청 받음:", req.body);
  console.log("📤 체인코드 호출 시작");

  try {
    const result = await sdk.send(false, 'CreatePool', args);  // ✅ res 넘기지 않음
    console.log("✅ 체인코드 호출 결과:", result);

    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + parseInt(durationMonths));

    const { error } = await supabase.from('pools').insert({
      id,
      name,
      min_deposit: minDeposit,
      interest_rate: interestRate,
      start_time: now.toISOString(),
      end_time: end.toISOString(),
      status: 'Open',
      total_deposit: 0,
      total_interest: 0,
    });

    if (error) {
      console.error('❌ Supabase 저장 오류:', error);
      return res.status(500).json({ error: 'Supabase 저장 실패', detail: error.message });
    }

    return res.status(200).json({ message: '풀 생성 완료', poolId: id });

  } catch (err) {
    console.error('❌ 풀 생성 중 서버 오류:', err);
    return res.status(500).json({ error: '풀 생성 실패', detail: err.message || '서버 오류 발생' });
  }
});

app.get('/queryPool', async function (req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing pool ID' });

  try {
    const result = await sdk.send(true, 'QueryPool', [id]);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/queryAllPools', async (req, res) => {
  try {
    const result = await sdk.send(true, 'QueryAllPools', []);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/joinPool', async (req, res) => {
  const { poolID, userAddress, deposit } = req.body;

  if (!poolID || !userAddress || !deposit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await sdk.send(false, 'JoinPool', [poolID, userAddress, deposit.toString()]);
    return res.json({ message: '참여 완료', result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
    const { data, error: dbError } = await supabase
      .from('inquiries')
      .insert([
        {
          name,
          email,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (dbError) {
      console.error('Supabase 에러:', dbError);
      throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
    }

    console.log('저장된 문의:', data);

    // 자동 응답 이메일 전송
    try {
      // 개발 환경에서는 이메일 전송 로그만 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: 이메일 전송 시뮬레이션');
        console.log('수신자:', email);
        console.log('제목: 문의가 접수되었습니다');
        console.log('내용:', `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">문의 접수 확인</h2>
            <p style="margin-bottom: 15px;">안녕하세요, ${name}님</p>
            <p style="margin-bottom: 15px;">문의하신 내용이 성공적으로 접수되었습니다.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-bottom: 15px;">문의하신 내용을 검토해보겠습니다. 모든 문의사항에 대해 답변을 드리지 못할 수 있음을 양해 부탁드립니다.</p>
            <p style="margin-bottom: 15px;">추가 문의사항이 있으시면 언제든지 문의해 주세요.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">이 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.</p>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">고객센터: 1234-5678 (평일 09:00 - 18:00)</p>
          </div>
        `);
      } else {
        // 프로덕션 환경에서는 실제 이메일 전송
        await resend.emails.send({
          from: '깐부대출 <noreply@fitend.com>',
          to: email,
          subject: '문의가 접수되었습니다',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">문의 접수 확인</h2>
              <p style="margin-bottom: 15px;">안녕하세요, ${name}님</p>
              <p style="margin-bottom: 15px;">문의하신 내용이 성공적으로 접수되었습니다.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="margin-bottom: 15px;">문의하신 내용을 검토해보겠습니다. 모든 문의사항에 대해 답변을 드리지 못할 수 있음을 양해 부탁드립니다.</p>
              <p style="margin-bottom: 15px;">추가 문의사항이 있으시면 언제든지 문의해 주세요.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">이 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.</p>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">고객센터: 1234-5678 (평일 09:00 - 18:00)</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('이메일 전송 에러:', emailError);
      // 이메일 전송 실패는 전체 프로세스를 실패시키지 않음
    }

    res.json({ success: true, data });
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
      },
      timeout: 5000, // 5초 타임아웃
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.data.success) {
      console.error('reCAPTCHA 검증 실패:', response.data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    // 네트워크 오류 시에도 true 반환 (개발 환경에서만 ★실제 배포될경우 네트워크 오류시에는 false로 꼭 바꿔야함 꼭!!)
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경: reCAPTCHA 검증 우회');
      return true;
    }
    return false;
  }
}

// 이메일 확인 API
app.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Supabase에서 사용자 확인
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.json({ exists: false });
    }
    
    return res.json({
      exists: true,
      provider: user.app_metadata.provider || 'email'
    });
  } catch (error) {
    console.error('이메일 확인 에러:', error);
    res.status(500).json({ error: '이메일 확인 중 오류가 발생했습니다.' });
  }
});

// ================= 지갑 동기화 함수 ==================
// 서버 시작 시 DB의 모든 지갑을 체인코드에 복구
async function syncWalletsToChaincode() {
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('wallet_id');
    if (error) {
      console.error('지갑 동기화 실패:', error);
      return;
    }
    for (const profile of profiles) {
      if (profile.wallet_id) {
        try {
          // 체인코드에 지갑 생성 요청 (이미 있으면 에러 무시)
          await axios.get(`http://localhost:${PORT}/chain/createWallet`, {
            params: {
              address: profile.wallet_id,
              initialBalance: 1000000 // 필요에 따라 0 또는 DB 잔액으로 변경 가능
            }
          });
          console.log('체인코드에 지갑 동기화:', profile.wallet_id);
        } catch (err) {
          if (err.response && err.response.data && err.response.data.error?.includes('already exists')) {
            // 이미 존재하면 무시
            console.log('이미 존재하는 지갑:', profile.wallet_id);
          } else {
            console.error('지갑 동기화 중 에러:', profile.wallet_id, err.message);
          }
        }
      }
    }
  } catch (e) {
    console.error('지갑 동기화 전체 실패:', e);
  }
}

// 서버 시작
app.listen(PORT, HOST, async () => {
  console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
  // 서버 시작 직후 동기화 실행
  await syncWalletsToChaincode();
});

// ================= 친구 API ==================

// 친구 추가 요청
app.post('/api/friends/add', async (req, res) => {
  const { userId, friendEmail } = req.body;

  try {
    // 친구 이메일로 사용자 검색
    const { data: targetUser, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', friendEmail)
      .single();

    if (searchError || !targetUser) {
      return res.status(404).json({ error: '해당 이메일의 사용자를 찾을 수 없습니다.' });
    }

    // 기존 친구 요청 확인
    const { data: existing, error: existingError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_user_id', targetUser.id)
      .maybeSingle();

    if (existing && existing.status === 'pending') {
      return res.status(400).json({ error: '이미 친구 요청을 보냈습니다.' });
    }

    // 친구 요청 추가
    const { error: insertError } = await supabase.from('friends').insert([
      {
        user_id: userId,
        friend_user_id: targetUser.id,
        status: 'pending',
      },
    ]);

    if (insertError) {
      return res.status(500).json({ error: '친구 요청 추가 중 오류가 발생했습니다.' });
    }

    res.status(200).json({ message: '친구 요청이 전송되었습니다.' });
  } catch (err) {
    console.error('친구 추가 요청 처리 중 오류:', err);
    res.status(500).json({ error: '친구 추가 요청 처리 중 오류가 발생했습니다.' });
  }
});

// 친구 목록 조회
app.get('/api/friends', async (req, res) => {
  const { userId } = req.query;

  try {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      return res.status(500).json({ error: '친구 목록 조회 중 오류가 발생했습니다.' });
    }

    res.status(200).json({ friends: data });
  } catch (err) {
    console.error('친구 목록 조회 처리 중 오류:', err);
    res.status(500).json({ error: '친구 목록 조회 처리 중 오류가 발생했습니다.' });
  }
});

// 친구 요청 수락/거절
app.patch('/api/friends/request', async (req, res) => {
  const { requestId, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      return res.status(500).json({ error: '친구 요청 업데이트 중 오류가 발생했습니다.' });
    }

    res.status(200).json({ message: '친구 요청이 업데이트되었습니다.' });
  } catch (err) {
    console.error('친구 요청 업데이트 처리 중 오류:', err);
    res.status(500).json({ error: '친구 요청 업데이트 처리 중 오류가 발생했습니다.' });
  }
});
