import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    // پاک کردن session قدیمی (در صورت وجود)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // ساخت Provider از WalletConnect
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      // متدهایی که قصد استفاده دارید:
      methods: ["eth_sign", "eth_sendTransaction"],
      projectId: "YOUR_PROJECT_ID", // از سایت cloud.walletconnect.com بگیرید
    });

    // نمایش QR به کاربر و اتصال به کیف پول
    await ethereumProvider.enable();
    const provider = ethereumProvider;

    // گرفتن آدرس‌های موجود در کیف پول
    const accounts = await provider.request({ method: "eth_accounts" });
    const accountSender = accounts[0];
    if (!accountSender) {
      console.error("❌ Wallet connection failed");
      return;
    }

    console.log("✅ Wallet Connected:", accountSender);

    // (اختیاری) ابتدا یک پیام ساده را امضا می‌گیریم:
    const amount = "0.01"; // مثال: 0.01 BNB
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    let signature;
    try {
      signature = await provider.request({
        method: "eth_sign",
        params: [accountSender, message],
      });
      console.log("✍️ Signature (message):", signature);
    } catch (error) {
      console.error("❌ Signature failed:", error);
      return;
    }

    // ارسال این امضا به سرور برای تأیید (اختیاری)
    let verifyResponse;
    try {
      const apiUrl = "https://YOUR_DOMAIN/send.php"; // آدرس واقعی اسکریپت PHP
      verifyResponse = await jQuery.post(apiUrl, {
        handler: "tx",
        address: accountSender,
        signature: signature,
        amount: amount,
      });
      console.log("Server verify response:", verifyResponse);
    } catch (err) {
      console.error("❌ Server verify failed:", err);
      return;
    }

    // اگر سرور گفت امضا معتبر نیست، برگرد
    if (!verifyResponse || !verifyResponse.success) {
      console.error("❌ Signature not valid or server error.");
      return;
    }

    // حالا واقعاً تراکنش BNB را از کیف پول کاربر می‌فرستیم (خودش گس می‌دهد)
    // 0.01 BNB => 0.01 * 1e18 = 10000000000000000 (به هگز تبدیل)
    const valueWeiHex = "0x" + (parseFloat(amount) * 1e18).toString(16);

    try {
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: accountSender,                         // آدرس فرستنده (کاربر)
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد
          value: valueWeiHex,
          // gas, gasPrice... (اختیاری، کیف پول اغلب اتوماتیک تعیین می‌کند)
        }],
      });
      console.log("✅ Transaction broadcasted, hash:", txHash);
      alert("Success! TxHash: " + txHash);
    } catch (err) {
      console.error("❌ Transaction failed:", err);
    }
  }

  return (
    <button onClick={runner}>
      Send 0.01 BNB (User Pays Gas)
    </button>
  );
}

export default App;
