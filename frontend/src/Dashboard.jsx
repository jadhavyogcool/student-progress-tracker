import { useEffect, useState } from "react";
import StatsCard from "./components/StatsCard";

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

    const [summary, setSummary] = useState({ students: 0, repositories: 0, commits: 0, active: 0 });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudent, setNewStudent] = useState({ name: "", email: "", repoUrl: "" });

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

    return (
        <div className="container">
            <header>
                <h1>
                    <span style={{ fontSize: "2rem" }}>🎓</span>
                    Student Project Dashboard
                </h1>
                <p>Track student GitHub repositories and commit progress</p>
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

            <div className="student-list">
                {students.map(student => (
                    <div key={student.id} className="card student-card">
                        <div className="student-info">
                            <h3>{student.name}</h3>
                            <p>{student.email}</p>
                            {student.repositories?.map(repo => (
                                <a key={repo.id} href={repo.repo_url} target="_blank" className="repo-link">
                                    🔗 {repo.owner}/{repo.repo_name}
                                </a>
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
