import { syncAllRepositories } from "../src/scheduler.js";

export default async function handler(req, res) {
    // Basic security check
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        console.log("Vercel Cron triggered...");
        await syncAllRepositories();
        return res.status(200).json({ success: true, message: "Sync completed" });
    } catch (error) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
