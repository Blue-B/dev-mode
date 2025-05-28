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

// Content-Security-Policy 헤더 추가
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "connect-src 'self' https://*.supabase.co https://www.google.com https://www.gstatic.com; " +
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
    
    console.log("📦 잔액 조회 요청 address:", address);  
    if (!address) return res.status(400).json({ error: '주소가 필요합니다.' });

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

// 서버 시작
app.listen(PORT, HOST);
console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
