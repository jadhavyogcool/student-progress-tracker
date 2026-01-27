import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminLogin from './AdminLogin';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL?.startsWith("http")
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_API_URL
            ? `https://${import.meta.env.VITE_API_URL}`
            : "http://localhost:3000";

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

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <AdminLogin onLogin={() => setIsAuthenticated(true)} />
                        )
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        isAuthenticated ? (
                            <Dashboard />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
