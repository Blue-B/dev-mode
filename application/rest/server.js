// 2. server.js (Loan API + React 정적 파일 처리 순서 수정)

'use strict';

const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';

// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= 대출 시스템 API ==================
// 반드시 React 정적 파일 서빙보다 먼저 정의해야 함!

// 대출 요청 생성
app.get('/createLoan', function (req, res) {
    let { id, requester, amount, durationDays } = req.query;
    let args = [id, requester, amount, durationDays];
    sdk.send(false, 'CreateLoanRequest', args, res);
});

// 대출 요청 승인
app.get('/approveLoan', function (req, res) {
    let { id, provider } = req.query;
    let args = [id, provider];
    sdk.send(false, 'ApproveLoanRequest', args, res);
});

// 대출 요청 삭제
app.get('/deleteLoan', function (req, res) {
    let { id } = req.query;
    let args = [id];
    sdk.send(false, 'DeleteLoanRequest', args, res);
});

// 대출 요청 수정
app.get('/updateLoan', function (req, res) {
    let { id, newAmount, newDurationDays } = req.query;
    let args = [id, newAmount, newDurationDays];
    sdk.send(false, 'UpdateLoanRequest', args, res);
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
