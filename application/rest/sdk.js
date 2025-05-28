'use strict';

const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const channelName = 'channel1';
const chaincodeName = 'abstore';

const walletPath = path.join(process.cwd(), '..', 'wallet');
const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
const org1UserId = 'appUser';

async function send(type, func, args) {
  try {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();

    await gateway.connect(ccp, {
      wallet,
      identity: org1UserId,
      discovery: { enabled: true, asLocalhost: false },
    });

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    if (type) {
      const result = await contract.evaluateTransaction(func, ...args);
      const resultStr = result.toString();
      try {
        return JSON.parse(resultStr); // JSON이면 파싱
      } catch {
        return resultStr; // 아니면 문자열 그대로 반환
      }
    } else {
      await contract.submitTransaction(func, ...args);
      return "Success";
    }

  } catch (error) {
    throw new Error(`send() 오류: ${error.message}`);
  }
}

module.exports = { send };
