import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import routes from "./routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration to allow credentials
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
    res.send("Student Progress Tracker API is running");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
});
