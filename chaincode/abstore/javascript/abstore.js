'use strict';

const shim = require('fabric-shim');
const util = require('util');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
const LoanShim = class {

  // =========================
  // Init: 체인코드 초기화 엔트리포인트
  // =========================
  async Init(stub) {
    console.info('========= LoanShim Init =========');
    // Invoke 예시 정보를 로그로 남김
    let ret = stub.getFunctionAndParameters();
    console.info('Init called with:', ret);
    try {
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  // =========================
  // Invoke: 트랜잭션 엔트리포인트
  //  - stub.getFunctionAndParameters() 로 호출된 함수 이름(ret.fcn)과 매개변수(ret.params)를 가져온 뒤,
  //    this[함수명] 으로 해당 메서드를 동적으로 호출
  // =========================
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info('Invoke called with:', ret);

    // ret.fcn 에 해당하는 메서드를 클래스에서 찾음
    let method = this[ret.fcn];
    if (!method) {
      console.log(`No method named "${ret.fcn}" found`);
      return shim.success(); // 잘못된 함수명이라도 에러 대신 성공으로 리턴하도록
    }
    try {
      // 실제 비즈니스 로직 함수 호출. payload는 Buffer 또는 문자열 형태
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.error(err);
      return shim.error(err);
    }
  }


  // =========================
  // CreateWallet: 지갑 생성
  // args = [address, initialBalance]
  // =========================
  async CreateWallet(stub, args) {
    if (args.length !== 2) {
      throw new Error('Incorrect number of arguments. Expecting 2: [address, initialBalance]');
    }
    const address = args[0];
    const initialBalanceStr = args[1];

    // 이미 존재하는 지갑인지 확인
    let walletBytes = await stub.getState(address);
    if (walletBytes && walletBytes.length > 0) {
      throw new Error(`wallet ${address} already exists`);
    }

    // 초기 잔액을 정수로 변환
    let balance = 0;
    if (initialBalanceStr !== '') {
      balance = parseInt(initialBalanceStr, 10);
      if (isNaN(balance)) {
        throw new Error(`invalid initial balance: ${initialBalanceStr}`);
      }
    }

    // Wallet 구조체와 동일하게 JSON 객체 생성
    const wallet = {
      address: address,
      balance: balance,
      createdAt: Math.floor(Date.now() / 1000) // 초 단위 타임스탬프
    };

    // 상태 저장
    await stub.putState(address, Buffer.from(JSON.stringify(wallet)));
    return;
  }

  // =========================
  // GetWalletBalance: 지갑 잔액 조회
  // args = [address]
  // 리턴: balance (int)을 Buffer로 반환
  // =========================
  async GetWalletBalance(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [address]');
    }
    const address = args[0];

    let walletBytes = await stub.getState(address);
    if (!walletBytes || walletBytes.length === 0) {
      throw new Error(`wallet ${address} does not exist`);
    }
    const wallet = JSON.parse(walletBytes.toString());
    // balance 자체를 문자열 Buffer로 리턴
    return Buffer.from(wallet.balance.toString());
  }

  // =========================
  // CreateLoanRequest: 개별 자금 대출 요청 생성
  // args = [id, lender, borrower, amount, durationDays, interestRate]
  // =========================
  async CreateLoanRequest(stub, args) {
    if (args.length !== 6) {
      throw new Error('Incorrect number of arguments. Expecting 6: [id, lender, borrower, amount, durationDays, interestRate]');
    }
    const id = args[0];
    const lender = args[1];
    const borrower = args[2];
    const amount = parseInt(args[3], 10);
    const durationDays = parseInt(args[4], 10);
    const interestRate = parseInt(args[5], 10);

    if (isNaN(amount) || isNaN(durationDays) || isNaN(interestRate)) {
      throw new Error('Amount, durationDays, interestRate must be integers');
    }

    // 중복 대출 요청 ID 확인
    let existingLoanBytes = await stub.getState(id);
    if (existingLoanBytes && existingLoanBytes.length > 0) {
      throw new Error(`loan request ${id} already exists`);
    }

    // lender 잔액 확인
    let lenderWalletBytes = await stub.getState(lender);
    if (!lenderWalletBytes || lenderWalletBytes.length === 0) {
      throw new Error(`lender wallet ${lender} does not exist`);
    }
    const lenderWallet = JSON.parse(lenderWalletBytes.toString());
    if (lenderWallet.balance < amount) {
      throw new Error(`insufficient balance for lender ${lender}`);
    }

    // LoanRequest 구조체와 동일하게 JSON 객체 생성
    const loan = {
      id: id,
      poolId: '',              // 개별 자금 대출이므로 빈 문자열
      lender: lender,
      borrower: borrower,
      amount: amount,
      durationDays: durationDays,
      interestRate: interestRate,
      status: 'Pending',
      startTime: 0,
      endTime: 0
    };

    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // ApproveLoanRequest: 개별 자금 대출 승인
  // args = [id]
  // =========================
  async ApproveLoanRequest(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    // 존재 여부 확인
    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Pending') {
      throw new Error(`loan request ${id} is not pending`);
    }

    // lender 지갑 조회 및 잔액 차감
    let lenderWalletBytes = await stub.getState(loan.lender);
    if (!lenderWalletBytes || lenderWalletBytes.length === 0) {
      throw new Error(`lender wallet ${loan.lender} does not exist`);
    }
    let lenderWallet = JSON.parse(lenderWalletBytes.toString());
    lenderWallet.balance -= loan.amount;
    await stub.putState(loan.lender, Buffer.from(JSON.stringify(lenderWallet)));

    // borrower 지갑 조회 및 잔액 증가
    let borrowerWalletBytes = await stub.getState(loan.borrower);
    if (!borrowerWalletBytes || borrowerWalletBytes.length === 0) {
      throw new Error(`borrower wallet ${loan.borrower} does not exist`);
    }
    let borrowerWallet = JSON.parse(borrowerWalletBytes.toString());
    borrowerWallet.balance += loan.amount;
    await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));

    // 대출 상태 업데이트
    loan.status = 'Active';
    loan.startTime = Math.floor(Date.now() / 1000); 
    // durationDays 이후(초 단위)
    loan.endTime = Math.floor((Date.now() + durationDays * 24 * 60 * 60 * 1000) / 1000);

    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // DenyLoanRequest: 개별 자금 대출 거절
  // args = [id]
  // =========================
  async DenyLoanRequest(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Pending') {
      throw new Error(`loan request ${id} is not pending`);
    }

    loan.status = 'Denied';
    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // RepayLoan: 개별 자금 대출 상환
  // args = [id]
  // =========================
  async RepayLoan(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Active') {
      throw new Error(`loan request ${id} is not active`);
    }

    // 이자 계산: (amount * interestRate * durationDays) / (365 * 100)
    const interest = Math.floor((loan.amount * loan.interestRate * loan.durationDays) / (365 * 100));
    const totalAmount = loan.amount + interest;

    // borrower 지갑 조회 및 잔액 확인
    let borrowerWalletBytes = await stub.getState(loan.borrower);
    if (!borrowerWalletBytes || borrowerWalletBytes.length === 0) {
      throw new Error(`borrower wallet ${loan.borrower} does not exist`);
    }
    let borrowerWallet = JSON.parse(borrowerWalletBytes.toString());
    if (borrowerWallet.balance < totalAmount) {
      throw new Error(`insufficient balance for borrower ${loan.borrower}`);
    }

    // borrower 잔액 차감
    borrowerWallet.balance -= totalAmount;
    await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));

    // lender 지갑 조회 및 잔액 증가
    let lenderWalletBytes = await stub.getState(loan.lender);
    if (!lenderWalletBytes || lenderWalletBytes.length === 0) {
      throw new Error(`lender wallet ${loan.lender} does not exist`);
    }
    let lenderWallet = JSON.parse(lenderWalletBytes.toString());
    lenderWallet.balance += totalAmount;
    await stub.putState(loan.lender, Buffer.from(JSON.stringify(lenderWallet)));

    // 대출 상태 업데이트
    loan.status = 'Repaid';
    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // DeleteLoanRequest: 대출 요청 삭제
  // args = [id]
  // =========================
  async DeleteLoanRequest(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    await stub.deleteState(id);
    return;
  }

  // =========================
  // UpdateLoanRequest: 대출 요청 수정 (Pending 상태만)
  // args = [id, newAmount, newDurationDays]
  // =========================
  async UpdateLoanRequest(stub, args) {
    if (args.length !== 3) {
      throw new Error('Incorrect number of arguments. Expecting 3: [id, newAmount, newDurationDays]');
    }
    const id = args[0];
    const newAmount = parseInt(args[1], 10);
    const newDurationDays = parseInt(args[2], 10);

    if (isNaN(newAmount) || isNaN(newDurationDays)) {
      throw new Error('newAmount and newDurationDays must be integers');
    }

    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Pending') {
      throw new Error(`cannot update loan request ${id} because it is not pending`);
    }

    loan.amount = newAmount;
    loan.durationDays = newDurationDays;
    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // QueryLoanRequest: 단일 대출 요청 조회
  // args = [id]
  // 리턴: LoanRequest JSON Buffer
  // =========================
  async QueryLoanRequest(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    // 단순히 JSON 형태로 리턴
    return loanBytes;
  }

  // =========================
  // QueryAllLoanRequests: 모든 대출 요청 조회
  // args = []
  // 리턴: LoanRequest 객체들이 JSON 배열로 직렬화된 Buffer
  // =========================
  async QueryAllLoanRequests(stub, args) {
    if (args.length !== 0) {
      throw new Error('Incorrect number of arguments. Expecting 0');
    }

    const iterator = await stub.getStateByRange('', '');
    let allResults = [];
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        try {
          const obj = JSON.parse(res.value.value.toString('utf8'));
          // obj에 "lender" 필드가 있으면 LoanRequest로 간주
          if (obj.id && obj.lender !== undefined && obj.borrower !== undefined) {
            allResults.push(obj);
          }
        } catch (err) {
          // JSON 파싱 실패 시 무시
        }
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    // 최종 결과를 Buffer로 리턴
    return Buffer.from(JSON.stringify(allResults));
  }

  // =========================
  // CreatePool: 풀 생성
  // args = [id, name, minDeposit, interestRate, durationMonths]
  // =========================
  async CreatePool(stub, args) {
    if (args.length !== 5) {
      throw new Error('Incorrect number of arguments. Expecting 5: [id, name, minDeposit, interestRate, durationMonths]');
    }
    const id = args[0];
    const name = args[1];
    const minDeposit = parseInt(args[2], 10);
    const interestRate = parseInt(args[3], 10);
    const durationMonths = parseInt(args[4], 10);

    if (isNaN(minDeposit) || isNaN(interestRate) || isNaN(durationMonths)) {
      throw new Error('minDeposit, interestRate, durationMonths must be integers');
    }

    // 중복 풀 확인
    let poolBytes = await stub.getState(id);
    if (poolBytes && poolBytes.length > 0) {
      throw new Error(`pool with ID ${id} already exists`);
    }

    if (interestRate > 5) {
      throw new Error('interest rate must be 5% or less');
    }

    // Go 코드에서 EndTime은 ms 단위로 설정했으므로 JS도 ms로 계산
    const nowMs = Date.now();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);
    const endMs = endDate.getTime();

    const pool = {
      id: id,
      name: name,
      minDeposit: minDeposit,
      interestRate: interestRate,
      startTime: nowMs,
      endTime: endMs,
      totalDeposit: 0,
      totalInterest: 0,
      status: 'Open',
      participants: [],
      weights: {} 
    };

    await stub.putState(id, Buffer.from(JSON.stringify(pool)));
    return;
  }

  // =========================
  // QueryPool: 단일 풀 조회
  // args = [id]
  // 리턴: Pool JSON Buffer
  // =========================
  async QueryPool(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    let poolBytes = await stub.getState(id);
    if (!poolBytes || poolBytes.length === 0) {
      throw new Error(`pool ${id} does not exist`);
    }
    return poolBytes;
  }

  // =========================
  // QueryAllPools: 모든 풀 조회
  // args = []
  // 리턴: Pool 객체들이 JSON 배열로 직렬화된 Buffer
  // =========================
  async QueryAllPools(stub, args) {
    if (args.length !== 0) {
      throw new Error('Incorrect number of arguments. Expecting 0');
    }

    const iterator = await stub.getStateByRange('', '');
    let allResults = [];
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        try {
          const obj = JSON.parse(res.value.value.toString('utf8'));
          // obj에 "name" 필드가 있으면 Pool으로 간주
          if (obj.id && obj.name !== undefined && obj.minDeposit !== undefined) {
            allResults.push(obj);
          }
        } catch (err) {
          // JSON 파싱 실패 시 무시
        }
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    return Buffer.from(JSON.stringify(allResults));
  }

  // =========================
  // JoinPool: 사용자가 Pool에 예치 참여
  // args = [poolID, userAddress, depositAmount]
  // =========================
  async JoinPool(stub, args) {
    if (args.length !== 3) {
      throw new Error('Incorrect number of arguments. Expecting 3: [poolID, userAddress, depositAmount]');
    }
    const poolID = args[0];
    const userAddress = args[1];
    const depositAmount = parseInt(args[2], 10);

    if (!userAddress) {
      throw new Error('userAddress must not be empty');
    }
    if (isNaN(depositAmount)) {
      throw new Error('depositAmount must be an integer');
    }

    let poolBytes = await stub.getState(poolID);
    if (!poolBytes || poolBytes.length === 0) {
      throw new Error(`pool ${poolID} does not exist`);
    }
    let pool = JSON.parse(poolBytes.toString());

    // 가중치 계산 및 업데이트
    pool.totalDeposit += depositAmount;
    if (!pool.weights[userAddress]) {
      pool.weights[userAddress] = 0.0;
    }
    pool.weights[userAddress] += depositAmount;
    pool.participants.push(userAddress);

    await stub.putState(poolID, Buffer.from(JSON.stringify(pool)));
    return;
  }

  // =========================
  // CreateLoanRequestFromPool: 풀 자금으로 대출 요청 생성
  // args = [id, poolID, borrower, amount, durationDays]
  // =========================
  async CreateLoanRequestFromPool(stub, args) {
    if (args.length !== 5) {
      throw new Error('Incorrect number of arguments. Expecting 5: [id, poolID, borrower, amount, durationDays]');
    }
    const id = args[0];
    const poolID = args[1];
    const borrower = args[2];
    const amount = parseInt(args[3], 10);
    const durationDays = parseInt(args[4], 10);

    if (isNaN(amount) || isNaN(durationDays)) {
      throw new Error('amount and durationDays must be integers');
    }

    // 풀 확인
    let poolBytes = await stub.getState(poolID);
    if (!poolBytes || poolBytes.length === 0) {
      throw new Error(`pool ${poolID} does not exist`);
    }
    let pool = JSON.parse(poolBytes.toString());

    if (pool.status !== 'Closed') {
      throw new Error(`pool ${poolID} is not ready for lending (status: ${pool.status})`);
    }
    if (pool.totalDeposit < amount) {
      throw new Error(`not enough funds in pool ${poolID}`);
    }

    // 중복 ID 확인
    let existingLoanBytes = await stub.getState(id);
    if (existingLoanBytes && existingLoanBytes.length > 0) {
      throw new Error(`loan request ${id} already exists`);
    }

    // LoanRequest 구조체 생성 (풀 기반)
    const loan = {
      id: id,
      poolId: poolID,
      lender: poolID,     // lender를 poolID로 처리
      borrower: borrower,
      amount: amount,
      durationDays: durationDays,
      interestRate: pool.interestRate,
      status: 'Pending',
      startTime: 0,
      endTime: 0
    };

    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

    // =========================
  // ApproveLoanRequest: 개별 자금 대출 승인
  // args = [id]
  // =========================
  async ApproveLoanRequest(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    // 존재 여부 확인
    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Pending') {
      throw new Error(`loan request ${id} is not pending`);
    }

    // lender 지갑 조회 및 잔액 차감
    let lenderWalletBytes = await stub.getState(loan.lender);
    if (!lenderWalletBytes || lenderWalletBytes.length === 0) {
      throw new Error(`lender wallet ${loan.lender} does not exist`);
    }
    let lenderWallet = JSON.parse(lenderWalletBytes.toString());
    lenderWallet.balance -= loan.amount;
    await stub.putState(loan.lender, Buffer.from(JSON.stringify(lenderWallet)));

    // borrower 지갑 조회 및 잔액 증가
    let borrowerWalletBytes = await stub.getState(loan.borrower);
    if (!borrowerWalletBytes || borrowerWalletBytes.length === 0) {
      throw new Error(`borrower wallet ${loan.borrower} does not exist`);
    }
    let borrowerWallet = JSON.parse(borrowerWalletBytes.toString());
    borrowerWallet.balance += loan.amount;
    await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));

    // 대출 상태 업데이트
    loan.status = 'Active';
    loan.startTime = Math.floor(Date.now() / 1000);

    // ❗ 여기에서 durationDays 대신 loan.durationDays로 참조해야 합니다.
    loan.endTime = Math.floor((Date.now() + loan.durationDays * 24 * 60 * 60 * 1000) / 1000);

    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // RepayLoanToPool: 풀 기반 대출 상환 및 이자 누적
  // args = [id]
  // =========================
  async RepayLoanToPool(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [id]');
    }
    const id = args[0];

    // 대출 요청 조회
    let loanBytes = await stub.getState(id);
    if (!loanBytes || loanBytes.length === 0) {
      throw new Error(`loan request ${id} does not exist`);
    }
    let loan = JSON.parse(loanBytes.toString());

    if (loan.status !== 'Active') {
      throw new Error(`loan ${id} is not active`);
    }

    // 이자 계산
    const interest = Math.floor((loan.amount * loan.interestRate * loan.durationDays) / (365 * 100));
    const totalAmount = loan.amount + interest;

    // borrower 지갑 조회 및 잔액 확인
    let borrowerWalletBytes = await stub.getState(loan.borrower);
    if (!borrowerWalletBytes || borrowerWalletBytes.length === 0) {
      throw new Error(`borrower wallet ${loan.borrower} does not exist`);
    }
    let borrowerWallet = JSON.parse(borrowerWalletBytes.toString());
    if (borrowerWallet.balance < totalAmount) {
      throw new Error(`insufficient balance for repayment`);
    }
    borrowerWallet.balance -= totalAmount;

    // 풀 조회 및 이자 누적
    let poolBytes = await stub.getState(loan.poolId);
    if (!poolBytes || poolBytes.length === 0) {
      throw new Error(`pool ${loan.poolId} does not exist`);
    }
    let pool = JSON.parse(poolBytes.toString());
    pool.totalDeposit += loan.amount;
    pool.totalInterest += interest;

    // 대출 상태 업데이트
    loan.status = 'Repaid';

    // 변경된 차입자 지갑, 풀, 대출 요청 모두 저장
    await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));
    await stub.putState(loan.poolId, Buffer.from(JSON.stringify(pool)));
    await stub.putState(id, Buffer.from(JSON.stringify(loan)));
    return;
  }

  // =========================
  // QueryMyLoans: 특정 유저의 대출 요청 조회 (lender 또는 borrower 기준)
  // args = [userAddress]
  // 리턴: 해당 유저가 lender 또는 borrower인 LoanRequest들의 JSON 배열 Buffer
  // =========================
  async QueryMyLoans(stub, args) {
    if (args.length !== 1) {
      throw new Error('Incorrect number of arguments. Expecting 1: [userAddress]');
    }
    const userAddress = args[0];

    const iterator = await stub.getStateByRange('', '');
    let userLoans = [];
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        try {
          const obj = JSON.parse(res.value.value.toString('utf8'));
          // lender 또는 borrower 필드가 userAddress인 경우만 포함
          if ((obj.lender === userAddress) || (obj.borrower === userAddress)) {
            userLoans.push(obj);
          }
        } catch (err) {
          // JSON 파싱 실패 시 무시
        }
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    return Buffer.from(JSON.stringify(userLoans));
  }

  // =========================
  // (Optional) WalletExists, LoanRequestExists 메서드는 내부에서 직접 stub.getState로 체크하므로 생략 가능
  // =========================
};

shim.start(new LoanShim());
=======
// Wallet class equivalent to Go's Wallet struct
class Wallet {
    constructor(address, balance, createdAt) {
        this.address = address;
        this.balance = balance;
        this.createdAt = createdAt;
    }
}

// LoanRequest class equivalent to Go's LoanRequest struct
class LoanRequest {
    constructor(id, poolId, lender, borrower, amount, durationDays, interestRate, status, startTime, endTime) {
        this.id = id;
        this.poolId = poolId;
        this.lender = lender;
        this.borrower = borrower;
        this.amount = amount;
        this.durationDays = durationDays;
        this.interestRate = interestRate;
        this.status = status;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

// Pool class equivalent to Go's Pool struct
class Pool {
    constructor(id, name, minDeposit, interestRate, startTime, endTime, totalDeposit, totalInterest, status, participants, weights) {
        this.id = id;
        this.name = name;
        this.minDeposit = minDeposit;
        this.interestRate = interestRate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalDeposit = totalDeposit;
        this.totalInterest = totalInterest;
        this.status = status;
        this.participants = participants;
        this.weights = weights;
    }
}

// LoanContract chaincode class
class LoanContract {
    // Initialize the chaincode
    async Init(stub) {
        console.info('=========== Instantiated LoanContract chaincode ===========');
        return shim.success();
    }

    // Invoke function to handle transactions
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        let method = this[ret.fcn];
        if (!method) {
            console.error('no function of name:' + ret.fcn + ' found');
            return shim.error(new Error('no function of name:' + ret.fcn + ' found'));
        }
        try {
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.error(err);
            return shim.error(err);
        }
    }

    // Create a new wallet
    async CreateWallet(stub, args) {
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2: address, initialBalance');
        }
        let address = args[0];
        let initialBalance = args[1];

        // Check if wallet already exists
        let walletData = await stub.getState(address);
        if (walletData && walletData.length > 0) {
            throw new Error(`Wallet ${address} already exists`);
        }

        // Convert initial balance to integer
        let balance = 0;
        if (initialBalance) {
            balance = parseInt(initialBalance);
            if (isNaN(balance)) {
                throw new Error('Invalid initial balance');
            }
        }

=======
// Wallet class equivalent to Go's Wallet struct
class Wallet {
    constructor(address, balance, createdAt) {
        this.address = address;
        this.balance = balance;
        this.createdAt = createdAt;
    }
}

// LoanRequest class equivalent to Go's LoanRequest struct
class LoanRequest {
    constructor(id, poolId, lender, borrower, amount, durationDays, interestRate, status, startTime, endTime) {
        this.id = id;
        this.poolId = poolId;
        this.lender = lender;
        this.borrower = borrower;
        this.amount = amount;
        this.durationDays = durationDays;
        this.interestRate = interestRate;
        this.status = status;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

// Pool class equivalent to Go's Pool struct
class Pool {
    constructor(id, name, minDeposit, interestRate, startTime, endTime, totalDeposit, totalInterest, status, participants, weights) {
        this.id = id;
        this.name = name;
        this.minDeposit = minDeposit;
        this.interestRate = interestRate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalDeposit = totalDeposit;
        this.totalInterest = totalInterest;
        this.status = status;
        this.participants = participants;
        this.weights = weights;
    }
}

// LoanContract chaincode class
class LoanContract {
    // Initialize the chaincode
    async Init(stub) {
        console.info('=========== Instantiated LoanContract chaincode ===========');
        return shim.success();
    }

    // Invoke function to handle transactions
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        let method = this[ret.fcn];
        if (!method) {
            console.error('no function of name:' + ret.fcn + ' found');
            return shim.error(new Error('no function of name:' + ret.fcn + ' found'));
        }
        try {
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.error(err);
            return shim.error(err);
        }
    }

    // Create a new wallet
    async CreateWallet(stub, args) {
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2: address, initialBalance');
        }
        let address = args[0];
        let initialBalance = args[1];

        // Check if wallet already exists
        let walletData = await stub.getState(address);
        if (walletData && walletData.length > 0) {
            throw new Error(`Wallet ${address} already exists`);
        }

        // Convert initial balance to integer
        let balance = 0;
        if (initialBalance) {
            balance = parseInt(initialBalance);
            if (isNaN(balance)) {
                throw new Error('Invalid initial balance');
            }
        }

>>>>>>> Stashed changes
        let wallet = new Wallet(address, balance, Math.floor(Date.now() / 1000));
        let walletJSON = JSON.stringify(wallet);
        await stub.putState(address, Buffer.from(walletJSON));
        return Buffer.from('Wallet created successfully');
    }

    // Get wallet balance
    async GetWalletBalance(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: address');
        }
        let address = args[0];
        let walletData = await stub.getState(address);
        if (!walletData || walletData.length === 0) {
            throw new Error(`Wallet ${address} does not exist`);
        }

        let wallet = JSON.parse(walletData.toString());
        return Buffer.from(wallet.balance.toString());
    }

    // Create a loan request
    async CreateLoanRequest(stub, args) {
        if (args.length !== 6) {
            throw new Error('Incorrect number of arguments. Expecting 6: id, lender, borrower, amount, durationDays, interestRate');
        }
        let [id, lender, borrower, amount, durationDays, interestRate] = args;
        amount = parseInt(amount);
        durationDays = parseInt(durationDays);
        interestRate = parseInt(interestRate);

        // Check if loan request exists
        let loanData = await stub.getState(id);
        if (loanData && loanData.length > 0) {
            throw new Error(`Loan request ${id} already exists`);
        }

        // Check lender balance
        let lenderWalletData = await stub.getState(lender);
        if (!lenderWalletData || lenderWalletData.length === 0) {
            throw new Error(`Lender wallet ${lender} does not exist`);
        }
        let lenderWallet = JSON.parse(lenderWalletData.toString());
        if (lenderWallet.balance < amount) {
            throw new Error(`Insufficient balance for lender ${lender}`);
        }

        let loan = new LoanRequest(id, '', lender, borrower, amount, durationDays, interestRate, 'Pending', 0, 0);
        let loanJSON = JSON.stringify(loan);
        await stub.putState(id, Buffer.from(loanJSON));
        return Buffer.from('Loan request created successfully');
    }

    // Approve a loan request
    async ApproveLoanRequest(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Pending') {
            throw new Error(`Loan request ${id} is not pending`);
        }

        // Deduct from lender's wallet
        let lenderWalletData = await stub.getState(loan.lender);
        let lenderWallet = JSON.parse(lenderWalletData.toString());
        lenderWallet.balance -= loan.amount;
        await stub.putState(loan.lender, Buffer.from(JSON.stringify(lenderWallet)));

        // Add to borrower's wallet
        let borrowerWalletData = await stub.getState(loan.borrower);
        let borrowerWallet = JSON.parse(borrowerWalletData.toString());
        borrowerWallet.balance += loan.amount;
        await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));

        // Update loan status
        loan.status = 'Active';
        loan.startTime = Math.floor(Date.now() / 1000);
        loan.endTime = Math.floor((new Date().setDate(new Date().getDate() + loan.durationDays)) / 1000);
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan request approved successfully');
    }

    // Deny a loan request
    async DenyLoanRequest(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Pending') {
            throw new Error(`Loan request ${id} is not pending`);
        }

        loan.status = 'Denied';
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan request denied successfully');
    }

    // Repay a loan
    async RepayLoan(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Active') {
            throw new Error(`Loan request ${id} is not active`);
        }

        // Calculate interest
        let interest = Math.floor((loan.amount * loan.interestRate * loan.durationDays) / (365 * 100));
        let totalAmount = loan.amount + interest;

        // Deduct from borrower's wallet
        let borrowerWalletData = await stub.getState(loan.borrower);
        let borrowerWallet = JSON.parse(borrowerWalletData.toString());
        if (borrowerWallet.balance < totalAmount) {
            throw new Error(`Insufficient balance for borrower ${loan.borrower}`);
        }
        borrowerWallet.balance -= totalAmount;
        await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));

        // Add to lender's wallet
        let lenderWalletData = await stub.getState(loan.lender);
        let lenderWallet = JSON.parse(lenderWalletData.toString());
        lenderWallet.balance += totalAmount;
        await stub.putState(loan.lender, Buffer.from(JSON.stringify(lenderWallet)));

        // Update loan status
        loan.status = 'Repaid';
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan repaid successfully');
    }

    // Delete a loan request
    async DeleteLoanRequest(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        await stub.deleteState(id);
        return Buffer.from('Loan request deleted successfully');
    }

    // Update a loan request
    async UpdateLoanRequest(stub, args) {
        if (args.length !== 3) {
            throw new Error('Incorrect number of arguments. Expecting 3: id, newAmount, newDurationDays');
        }
        let [id, newAmount, newDurationDays] = args;
        newAmount = parseInt(newAmount);
        newDurationDays = parseInt(newDurationDays);

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Pending') {
            throw new Error(`Cannot update loan request ${id} because it is not pending`);
        }

        loan.amount = newAmount;
        loan.durationDays = newDurationDays;
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan request updated successfully');
    }

    // Query a single loan request
    async QueryLoanRequest(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        return Buffer.from(loanData.toString());
    }

    // Query all loan requests
    async QueryAllLoanRequests(stub, args) {
        let iterator = await stub.getStateByRange('', '');
        let results = [];
        while (true) {
            let res = await iterator.next();
            if (res.value) {
                try {
                    let loan = JSON.parse(res.value.value.toString());
                    if (loan.id) {
                        results.push(loan);
                    }
                } catch (err) {
                    // Skip non-JSON or non-loan data
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return Buffer.from(JSON.stringify(results));
    }

    // Check if loan request exists
    async LoanRequestExists(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];
        let loanData = await stub.getState(id);
        return Buffer.from((loanData && loanData.length > 0).toString());
    }

    // Check if wallet exists
    async WalletExists(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: address');
        }
        let address = args[0];
        let walletData = await stub.getState(address);
        return Buffer.from((walletData && walletData.length > 0).toString());
    }

    // Create a pool
    async CreatePool(stub, args) {
        if (args.length !== 5) {
            throw new Error('Incorrect number of arguments. Expecting 5: id, name, minDeposit, interestRate, durationMonths');
        }
        let [id, name, minDeposit, interestRate, durationMonths] = args;
        minDeposit = parseInt(minDeposit);
        interestRate = parseInt(interestRate);
        durationMonths = parseInt(durationMonths);

        let poolData = await stub.getState(id);
        if (poolData && poolData.length > 0) {
            throw new Error(`Pool with ID ${id} already exists`);
        }

        if (interestRate > 5) {
            throw new Error('Interest rate must be 5% or less');
        }

        let now = Math.floor(Date.now());
        let end = Math.floor((new Date().setMonth(new Date().getMonth() + durationMonths)));
        let pool = new Pool(id, name, minDeposit, interestRate, now, end, 0, 0, 'Open', [], {});
        let poolJSON = JSON.stringify(당구);
        await stub.putState(id, Buffer.from(poolJSON));
        return Buffer.from('Pool created successfully');
    }

    // Query a pool
    async QueryPool(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let poolData = await stub.getState(id);
        if (!poolData || poolData.length === 0) {
            throw new Error(`Pool ${id} does not exist`);
        }
        return Buffer.from(poolData.toString());
    }

    // Query all pools
    async QueryAllPools(stub, args) {
        let iterator = await stub.getStateByRange('', '');
        let results = [];
        while (true) {
            let res = await iterator.next();
            if (res.value) {
                try {
                    let pool = JSON.parse(res.value.value.toString());
                    if (pool.id) {
                        results.push(당구);
                    }
                } catch (err) {
                    // Skip non-JSON or non-pool data
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return Buffer.from(JSON.stringify(results));
    }

    // Join a pool
    async JoinPool(stub, args) {
        if (args.length !== 3) {
            throw new Error('Incorrect number of arguments. Expecting 3: poolID, userAddress, depositAmount');
        }
        let [poolID, userAddress, depositAmount] = args;
        depositAmount = parseInt(depositAmount);

        let poolData = await stub.getState(poolID);
        if (!poolData || poolData.length === 0) {
            throw new Error(`Pool ${poolID} does not exist`);
        }
        let pool = JSON.parse(poolData.toString());

        pool.totalDeposit += depositAmount;
        pool.weights[userAddress] = (pool.weights[userAddress] || 0) + depositAmount;
        pool.participants.push(userAddress);

        await stub.putState(poolID, Buffer.from(JSON.stringify(당구)));
        return Buffer.from('Joined pool successfully');
    }

    // Create a loan request from a pool
    async CreateLoanRequestFromPool(stub, args) {
        if (args.length !== 5) {
            throw new Error('Incorrect number of arguments. Expecting 5: id, poolID, borrower, amount, durationDays');
        }
        let [id, poolID, borrower, amount, durationDays] = args;
        amount = parseInt(amount);
        durationDays = parseInt(durationDays);

        let poolData = await stub.getState(poolID);
        if (!poolData || poolData.length === 0) {
            throw new Error(`Pool ${poolID} does not exist`);
        }
        let pool = JSON.parse(poolData.toString());

        if (pool.status !== 'Closed') {
            throw new Error(`Pool ${poolID} is not ready for lending (status: ${pool.status})`);
        }
        if (pool.totalDeposit < amount) {
            throw new Error(`Not enough funds in pool ${poolID}`);
        }

        let loanData = await stub.getState(id);
        if (loanData && loanData.length > 0) {
            throw new Error(`Loan request ${id} already exists`);
        }

        let loan = new LoanRequest(id, poolID, poolID, borrower, amount, durationDays, pool.interestRate, 'Pending', 0, 0);
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan request from pool created successfully');
    }

    // Approve a loan request from a pool
    async ApproveLoanRequestFromPool(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Pending') {
            throw new Error(`Loan ${id} is not pending`);
        }

        let poolData = await stub.getState(loan.poolId);
        if (!poolData || poolData.length === 0) {
            throw new Error(`Pool ${loan.poolId} does not exist`);
        }
        let pool = JSON.parse(poolData.toString());
        if (pool.totalDeposit < loan.amount) {
            throw new Error(`Pool ${loan.poolId} has insufficient funds`);
        }

        pool.totalDeposit -= loan.amount;

        let borrowerWalletData = await stub.getState(loan.borrower);
        if (!borrowerWalletData || borrowerWalletData.length === 0) {
            throw new Error(`Borrower wallet ${loan.borrower} does not exist`);
        }
        let borrowerWallet = JSON.parse(borrowerWalletData.toString());
        borrowerWallet.balance += loan.amount;

        loan.status = 'Active';
        loan.startTime = Math.floor(Date.now() / 1000);
        loan.endTime = Math.floor((new Date().setDate(new Date().getDate() + loan.durationDays)) / 1000);

        await stub.putState(loan.poolId, Buffer.from(JSON.stringify(당구)));
        await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan request from pool approved successfully');
    }

    // Repay a loan to a pool
    async RepayLoanToPool(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: id');
        }
        let id = args[0];

        let loanData = await stub.getState(id);
        if (!loanData || loanData.length === 0) {
            throw new Error(`Loan request ${id} does not exist`);
        }
        let loan = JSON.parse(loanData.toString());
        if (loan.status !== 'Active') {
            throw new Error(`Loan ${id} is not active`);
        }

        let interest = Math.floor((loan.amount * loan.interestRate * loan.durationDays) / (365 * 100));
        let totalAmount = loan.amount + interest;

        let borrowerWalletData = await stub.getState(loan.borrower);
        if (!borrowerWalletData || borrowerWalletData.length === 0) {
            throw new Error(`Borrower wallet ${loan.borrower} does not exist`);
        }
        let borrowerWallet = JSON.parse(borrowerWalletData.toString());
        if (borrowerWallet.balance < totalAmount) {
            throw new Error('Insufficient balance for repayment');
        }
        borrowerWallet.balance -= totalAmount;

        let poolData = await stub.getState(loan.poolId);
        if (!poolData || poolData.length === 0) {
            throw new Error(`Pool ${loan.poolId} does not exist`);
        }
        let pool = JSON.parse(poolData.toString());
        pool.totalDeposit += loan.amount;
        pool.totalInterest += interest;

        loan.status = 'Repaid';

        await stub.putState(loan.borrower, Buffer.from(JSON.stringify(borrowerWallet)));
        await stub.putState(loan.poolId, Buffer.from(JSON.stringify(당구)));
        await stub.putState(id, Buffer.from(JSON.stringify(loan)));
        return Buffer.from('Loan repaid to pool successfully');
    }

    // Query loans for a specific user
    async QueryMyLoans(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1: userAddress');
        }
        let userAddress = args[0];

        let iterator = await stub.getStateByRange('', '');
        let results = [];
        while (true) {
            let res = await iterator.next();
            if (res.value) {
                try {
                    let loan = JSON.parse(res.value.value.toString());
                    if (loan.lender === userAddress || loan.borrower === userAddress) {
                        results.push(loan);
                    }
                } catch (err) {
                    // Skip non-JSON or non-loan data
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return Buffer.from(JSON.stringify(results));
    }
}

// Start the chaincode
<<<<<<< Updated upstream
shim.start(new LoanContract());
>>>>>>> Stashed changes
=======
shim.start(new LoanContract());
>>>>>>> Stashed changes
