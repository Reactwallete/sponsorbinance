export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const targetUrl = "http://107.189.16.137/send.php";

    try {
        console.log("📡 Forwarding request to:", targetUrl);
        console.log("📦 Request Body:", req.body);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
            },
            body: req.method === "POST" ? JSON.stringify(req.body || {}) : undefined,
        });

        const responseData = await response.text();
        console.log("✅ Response from server:", responseData);

        res.status(response.status).send(responseData);
    } catch (error) {
        console.error("❌ Proxy Error:", error);
        res.status(500).json({ error: "Proxy request failed", details: error.message });
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
