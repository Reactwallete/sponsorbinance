export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    let targetUrl;
    
    if (req.query.api === "send") {
        // درخواست برای send.php
        targetUrl = "http://104.194.133.124/send.php";
    } else if (req.query.url) {
        // درخواست‌های دیگر از طریق CORS-Anywhere
        targetUrl = `http://107.189.16.137:8080/${req.query.url}`;
    } else {
        return res.status(400).json({ error: "Missing URL parameter" });
    }

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
            },
            body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
        });

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        console.error("❌ Proxy Error:", error);
        res.status(500).json({ error: "Proxy request failed" });
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
