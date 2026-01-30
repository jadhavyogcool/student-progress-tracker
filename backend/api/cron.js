import { syncAllRepositories } from "../src/scheduler.js";

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        await syncAllRepositories();
        return res.status(200).json({ success: true, message: "Sync successful" });
    } catch (error) {
        console.error("Cron Handler Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
