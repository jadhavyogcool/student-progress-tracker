// Debug endpoint to check environment variables and session configuration
export default function handler(req, res) {
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        SESSION_SECRET: process.env.SESSION_SECRET ? "Set" : "Not set",
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "Set" : "Not set",
        FRONTEND_URL: process.env.FRONTEND_URL,
        PORT: process.env.PORT,
        // Don't expose sensitive values
    };

    const sessionInfo = {
        session: req.session ? "Session exists" : "No session",
        sessionID: req.sessionID,
        cookies: req.cookies ? Object.keys(req.cookies) : "No cookies",
        headers: {
            cookie: req.headers.cookie ? "Present" : "Not present"
        }
    };

    res.json({
        environment: envInfo,
        session: sessionInfo,
        timestamp: new Date().toISOString()
    });
}