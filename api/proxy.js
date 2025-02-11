export default async function handler(req, res) {
    const url = "http://104.194.133.124/send.php"; // سرور PHP شما
    const options = {
        method: req.method,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: req.body ? JSON.stringify(req.body) : null,
    };

    try {
        const response = await fetch(url, options);
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        res.status(500).json({ error: "Proxy Error", details: error.message });
    }
}
