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
// 한국 시간으로 변환하는 함수
function getKoreanTime() {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreanTime.toISOString();
}

// 대출 요청 생성
app.get('/createLoan', async function (req, res) {
  const { id, lender, borrower, amount, durationDays, interestRate } = req.query;
  const args = [id, lender, borrower, amount, durationDays, interestRate];

  try {
    const txId = await sdk.send(false, 'CreateLoanRequest', args); // txId 반환됨

    // 체인 호출 성공 → Supabase에 해시 정보만 저장
    const { error } = await supabase.from('loans').insert([{
      id: id,                    // 체인에 저장한 loan ID를 그대로 사용
      loan_chain_id: id,         // 체인에 저장한 loan ID
      tx_hash: txId,             // 블록체인 트랜잭션 ID
      created_at: getKoreanTime() // 한국 시간으로 저장
    }]);

    if (error) {
      console.error('❌ DB 저장 실패:', error);
      return res.status(500).json({ error: 'DB 저장 실패' });
    }

    return res.json({ 
      message: 'Loan created on chain and DB', 
      txId
    });

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
app.post('/createPool', async (req, res) => {
  try {
    const { id, name, minDeposit, interestRate, durationMonths, creatorAddress, initialDeposit } = req.body;
    console.log('📥 풀 생성 요청:', req.body);

    // 필수 필드 검증
    if (!id || !name || !minDeposit || !interestRate || !durationMonths || !creatorAddress || !initialDeposit) {
      console.error('필수 필드 누락:', { id, name, minDeposit, interestRate, durationMonths, creatorAddress, initialDeposit });
      return res.status(400).json({ error: '모든 필수 필드를 입력해주세요.' });
    }

    // 모든 숫자 필드를 문자열로 변환
    const args = [
      id,
      name,
      minDeposit.toString(),
      interestRate.toString(),
      durationMonths.toString(),
      creatorAddress,
      initialDeposit.toString()
    ];

    console.log('🔗 체인코드 호출 → CreatePool()');
    console.log('📝 CreatePool 인자:', args);

    // 1. 체인코드 호출
    try {
      const result = await sdk.send(false, 'CreatePool', args);
      console.log('🎉 CreatePool 성공 → 응답:', result.toString());
    } catch (chainError) {
      console.error('❌ 체인코드 호출 실패:', chainError);
      return res.status(500).json({ error: '체인코드 호출 실패: ' + chainError.message });
    }

    // 2. Supabase에 풀 정보 저장
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setMonth(endTime.getMonth() + parseInt(durationMonths));

    // 기본 필드만 포함
    const poolData = {
      name,
      min_deposit: parseInt(minDeposit),
      interest_rate: parseInt(interestRate),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'open',
      total_deposit: parseInt(initialDeposit)
    };

    console.log('📝 Supabase에 저장할 풀 데이터:', poolData);

    try {
      const { data: insertedPool, error: poolError } = await supabase
        .from('pools')
        .insert(poolData)
        .select()
        .single();

      if (poolError) {
        console.error('❌ Supabase 풀 저장 실패:', poolError);
        throw new Error('풀 정보 저장 실패: ' + poolError.message);
      }

      console.log('✅ Supabase 풀 저장 성공:', insertedPool);
    } catch (dbError) {
      console.error('❌ Supabase 저장 중 에러:', dbError);
      return res.status(500).json({ error: '데이터베이스 저장 실패: ' + dbError.message });
    }

    console.log('✅ 풀 생성 완료');
    res.json({ message: '풀 생성 완료', poolId: id });

  } catch (err) {
    console.error('❌ 풀 생성 실패:', err);
    res.status(500).json({ error: err.message });
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
app.get('/QueryPoolsByUser', async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) {
    console.log('지갑 주소 누락');
    return res.status(400).json({ error: '지갑 주소가 필요합니다.' });
  }

  try {
    console.log('🔗 체인코드 호출 → QueryPoolsByUser(', wallet, ')');
    const result = await sdk.send(true, 'QueryPoolsByUser', [wallet]);
    console.log('🎉 QueryPoolsByUser 성공 → 원본 응답:', result);
    console.log('원본 응답 타입:', typeof result);
    console.log('원본 응답 문자열:', result?.toString());
    
    // 체인코드 응답이 없는 경우
    if (!result) {
      console.log('체인코드 응답 없음');
      return res.json([]);
    }

    // 체인코드 응답 파싱
    let pools = [];
    try {
      // 응답이 Buffer인 경우 문자열로 변환
      const responseStr = result.toString();
      console.log('응답 문자열:', responseStr);

      // 빈 문자열이나 null 체크
      if (!responseStr || responseStr.trim() === '') {
        console.log('빈 응답 반환');
        return res.json([]);
      }

      // JSON 파싱 시도
      try {
        // 응답이 이미 객체인 경우
        if (typeof result === 'object' && result !== null) {
          console.log('응답이 이미 객체임');
          pools = result;
        } else {
          // 문자열인 경우 JSON 파싱
          console.log('문자열을 JSON으로 파싱 시도');
          pools = JSON.parse(responseStr);
        }
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError);
        console.error('파싱 시도한 문자열:', responseStr);
        // 파싱 실패 시 빈 배열 반환
        return res.json([]);
      }
      
      // 응답이 배열이 아닌 경우 배열로 변환
      if (!Array.isArray(pools)) {
        console.log('단일 풀 객체를 배열로 변환');
        pools = [pools];
      }
      
      console.log('파싱된 풀 데이터:', pools);
      
      // participants와 deposits 필드 보정
      pools = pools.map(pool => {
        if (!pool) {
          console.log('null 풀 데이터 발견');
          return null;
        }

        console.log('처리할 풀 데이터:', pool);

        // 문자열로 된 participants와 deposits를 파싱
        let participants = [];
        let deposits = {};
        let joinedAt = {};

        try {
          if (typeof pool.participants === 'string') {
            participants = JSON.parse(pool.participants);
          } else if (Array.isArray(pool.participants)) {
            participants = pool.participants;
          }

          if (typeof pool.deposits === 'string') {
            deposits = JSON.parse(pool.deposits);
          } else if (typeof pool.deposits === 'object' && pool.deposits !== null) {
            deposits = pool.deposits;
          }

          if (typeof pool.joinedAt === 'string') {
            joinedAt = JSON.parse(pool.joinedAt);
          } else if (typeof pool.joinedAt === 'object' && pool.joinedAt !== null) {
            joinedAt = pool.joinedAt;
          }
        } catch (parseError) {
          console.error('풀 데이터 필드 파싱 실패:', parseError);
        }

        const processedPool = {
          ...pool,
          id: pool.id || pool.ID, // ID 필드 통일
          participants: Array.isArray(participants) ? participants : [],
          deposits: typeof deposits === 'object' && deposits !== null ? deposits : {},
          joinedAt: typeof joinedAt === 'object' && joinedAt !== null ? joinedAt : {},
          status: pool.status || 'Open',
          creator_address: pool.creator_address || pool.creatorAddress || wallet // 생성자 주소 추가
        };
        console.log('처리된 풀:', processedPool);
        return processedPool;
      }).filter(Boolean); // null 값 제거

    } catch (parseError) {
      console.error('풀 데이터 처리 실패:', parseError);
      console.error('원본 응답:', result.toString());
      return res.status(500).json({ error: '풀 데이터 처리 실패' });
    }
    
    console.log('최종 반환할 풀 목록:', pools);
    return res.json(pools);
  } catch (err) {
    console.error('사용자 풀 조회 실패:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 마지막에만 index.html 반환 (SPA 대응용)
// "캐치올" 라우트: 위에서 매칭되지 않은 모든 GET 요청에 대해 index.html을 내보낸다
app.get('*', function (req, res) {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// 서버 시작
app.listen(PORT, HOST, async () => {
  console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
  // 서버 시작 직후 동기화 실행
  await syncWalletsToChaincode();
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