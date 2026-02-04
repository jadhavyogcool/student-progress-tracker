import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminLogin from './AdminLogin';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        // Check if user is already authenticated
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/verify`, {
                    credentials: "include"
                });
                const data = await res.json();
                setIsAuthenticated(data.authenticated);
            } catch (err) {
                console.error("Auth check failed", err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public dashboard route */}
                <Route
                    path="/"
                    element={<Dashboard isAuthenticated={isAuthenticated} onLogout={handleLogout} />}
                />
                {/* Admin login route */}
                <Route
                    path="/admin"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/" replace />
                        ) : (
                            <AdminLogin onLogin={handleLogin} />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
