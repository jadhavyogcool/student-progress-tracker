import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./components/StatsCard";
import BulkUpload from "./components/BulkUpload";

export default function Dashboard() {
    // Render provides 'host' in VITE_API_URL via fromService, so we might need to prepend https:// if it's missing protocol
    // However, usually we can just set VITE_API_URL to the full URL in .env or Render dashboard manually for simplicity
    // But to be robust with the render.yaml fromService config which returns 'host':
    const getApiUrl = () => {
        const url = import.meta.env.VITE_API_URL;
        if (!url) return "http://localhost:3000";
        if (url.startsWith("http")) return url;
        return `https://${url}`;
    };
    const API_BASE = getApiUrl();
    const navigate = useNavigate();

    const [summary, setSummary] = useState({ students: 0, repositories: 0, commits: 0, active: 0 });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudent, setNewStudent] = useState({ name: "", email: "", repoUrl: "" });

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
            navigate("/");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };


    const fetchData = async () => {
        try {
            const [summaryRes, studentsRes] = await Promise.all([
                fetch(`${API_BASE}/api/summary`),
                fetch(`${API_BASE}/api/students`)
            ]);
            const summaryData = await summaryRes.json();
            const studentsData = await studentsRes.json();

            setSummary(summaryData);
            setStudents(studentsData);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStudent)
            });
            if (res.ok) {
                setNewStudent({ name: "", email: "", repoUrl: "" });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`${API_BASE}/api/student/${id}`, { method: "DELETE" });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSync = async (repoId) => {
        try {
            await fetch(`${API_BASE}/api/sync/${repoId}`, { method: "POST" });
            fetchData();
            alert("Synced successfully!");
        } catch (err) {
            console.error(err);
        }
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="container">
            <header className="dashboard-header">
                <div>
                    <h1>
                        <span style={{ fontSize: "2rem" }}>🎓</span>
                        Student Project Dashboard
                    </h1>
                    <p>Track student GitHub repositories and commit progress</p>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    🚪 Logout
                </button>
            </header>

            <div className="stats-grid">
                <StatsCard
                    title="Total Students"
                    value={summary.students}
                    icon="👥"
                    colorClass="icon-blue"
                />
                <StatsCard
                    title="Repositories"
                    value={summary.repositories}
                    icon="🔗"
                    colorClass="icon-green"
                />
                <StatsCard
                    title="Total Commits"
                    value={summary.commits}
                    icon="⚡"
                    colorClass="icon-purple"
                />
                <StatsCard
                    title="Active (7 days)"
                    value={summary.active}
                    subtext="commits"
                    icon="📈"
                    colorClass="icon-orange"
                />
            </div>

            <div className="card form-section">
                <h2 className="form-title">Add Student Project</h2>
                <form onSubmit={handleAddStudent}>
                    <div className="input-group">
                        <label>Student Name *</label>
                        <input
                            className="form-input"
                            required
                            value={newStudent.name}
                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={newStudent.email}
                            onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label>GitHub Repository URL *</label>
                        <input
                            className="form-input"
                            required
                            value={newStudent.repoUrl}
                            onChange={e => setNewStudent({ ...newStudent, repoUrl: e.target.value })}
                            placeholder="https://github.com/username/repo"
                        />
                    </div>
                    <button type="submit" className="btn-primary">+ Add Student</button>
                </form>
            </div>

            <BulkUpload onUploadComplete={fetchData} API_BASE={API_BASE} />

            <div className="student-list">
                {students.map(student => (
                    <div key={student.id} className="card student-card">
                        <div className="student-info">
                            <h3>{student.name}</h3>
                            <p>{student.email}</p>
                            {student.repositories?.map(repo => (
                                <div key={repo.id} className="repo-section">
                                    <a href={repo.repo_url} target="_blank" className="repo-link">
                                        🔗 {repo.owner}/{repo.repo_name}
                                    </a>
                                    {repo.insights && (
                                        <div className="repo-insights">
                                            <div className="insight-item">
                                                <span className="insight-icon">📊</span>
                                                <span className="insight-text">
                                                    {repo.insights.total_commits} commit{repo.insights.total_commits !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="insight-item">
                                                <span className="insight-icon">📈</span>
                                                <span className="insight-text">
                                                    {repo.insights.recent_commits} recent (7 days)
                                                </span>
                                            </div>
                                            {repo.insights.last_commit_date && (
                                                <div className="insight-item">
                                                    <span className="insight-icon">🕒</span>
                                                    <span className="insight-text">
                                                        Last: {formatRelativeTime(repo.insights.last_commit_date)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="actions">
                            {student.repositories?.map(repo => (
                                <button key={repo.id} onClick={() => handleSync(repo.id)} className="btn-icon" title="Sync Commits">
                                    🔄
                                </button>
                            ))}
                            <button onClick={() => handleDelete(student.id)} className="btn-icon" title="Delete Student">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
