// 2. server.js (Loan API만 남긴 최종 버전)

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

// static 파일 서비스 (index.html, app.js 제공)
app.use(express.static(path.join(__dirname, '../client')));

// 루트 접속 시 index.html 전달
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ================= 대출 시스템 API ==================

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

// 서버 시작
app.listen(PORT, HOST);
console.log(`서버 시작중 => http://${HOST}:${PORT}/`);
