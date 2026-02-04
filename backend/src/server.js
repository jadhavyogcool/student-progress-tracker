import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import routes from "./routes.js";
import { initScheduler } from "./scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration to allow credentials
const allowedOrigins = new Set([
    "http://localhost:5173",
    "https://student-progress-tracker-f5ql.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean));

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    // Allow any Vercel preview/production domain
    return origin.endsWith(".vercel.app");
};

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

app.use(express.json());

// Avoid 304 responses for API fetches in browsers
app.set("etag", false);
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// For production (e.g. Render), trust the first proxy
app.set("trust proxy", 1);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
    res.send("Student Progress Tracker API is running");
});

// Only run the server if not in Vercel environment (Vercel handles the server via export)
// On Vercel, process.env.VERCEL is usually set, or NODE_ENV=production.
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Backend running on port ${PORT}`);
        // Sync logic updated for Vercel Cron compatibility
        initScheduler();
    });
}

// Export for Vercel
export default app;
