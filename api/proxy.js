export default async function handler(req, res) {
    const response = await fetch("http://104.194.133.124/send.php", {
        method: req.method,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: req.method === "POST" ? new URLSearchParams(req.body).toString() : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
}
