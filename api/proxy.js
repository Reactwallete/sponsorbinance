export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        console.log("🔍 Incoming Request to Proxy:", req.body);

        const response = await fetch("http://104.194.133.124/send.php", {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
            },
            body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
        });

        const data = await response.text();

        console.log("🔍 Response from Backend:", data);

        res.status(response.status).send(data);
    } catch (error) {
        console.error("❌ Error in Proxy:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
