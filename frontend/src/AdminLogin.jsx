import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ onLogin }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const getApiUrl = () => {
        // If running on Vercel (production), use the production backend
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return 'https://student-tracker-backend-woad.vercel.app';
        }
        // Otherwise use env var or localhost
        const url = import.meta.env.VITE_API_URL;
        if (!url) return "http://localhost:3000";
        if (url.startsWith("http")) return url;
        return `https://${url}`;
    };
    const API_BASE = getApiUrl();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                onLogin();
                navigate("/");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">S</div>
                        <h1 className="login-title">Admin Access</h1>
                        <p className="login-subtitle">Scholar Progress Tracker</p>
                    </div>
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label>Admin Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                required
                                autoFocus
                            />
                        </div>
                        {error && <div className="login-error">{error}</div>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Authenticating..." : "Sign In"}
                        </button>
                        <div className="login-footer">
                            <p>Default password: admin123</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
