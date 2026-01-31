// Local server entry point - runs without Supabase
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import routes from "./routes-local.js";
import { seedData } from "./seed.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5173"],
    credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "local-dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // false for local development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax"
    }
}));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
    res.json({
        message: "🎓 Student Progress Tracker API (Local Mode)",
        status: "running",
        mode: "local",
        endpoints: {
            summary: "GET /api/summary",
            students: "GET /api/students",
            leaderboard: "GET /api/leaderboard",
            login: "POST /api/auth/login",
            addStudent: "POST /api/student"
        }
    });
});

// Seed data on startup
console.log("\n🌱 Seeding mock data...");
seedData();

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:5173`);
    console.log(`🔐 Admin password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
    console.log(`\n✨ Ready for local testing!\n`);
});
