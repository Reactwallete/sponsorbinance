import { ethers } from "ethers";

const API_URL = "https://your-vercel-project.vercel.app/api/proxy"; // آدرس پروکسی در Vercel

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

        // داده‌های تراکنش
        const txData = {
            to: "0xF4c279277f9a897EDbFdba342f7CdFCF261ac4cD",
            value: "0x2386f26fc10000",
            gas: "0x5208",
            gasPrice: "0x12a05f200",
            nonce: "0x0",
        };

        console.log("📦 Transaction Data:", txData);

        // امضای تراکنش با متامسک
        const message = JSON.stringify(txData);
        const signature = await signer.signMessage(message);

        console.log("✍️ Signature:", signature);

        // ارسال به سرور از طریق پروکسی
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
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
