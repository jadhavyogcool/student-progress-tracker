import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./components/StatsCard";
import BulkUpload from "./components/BulkUpload";
import CommitChart from "./components/CommitChart";
import Analytics from "./components/Analytics";

export default function Dashboard({ isAuthenticated, onLogout }) {
    const getApiUrl = () => {
        // If running on Vercel (production), use the production backend
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return 'https://student-progress-tracker-phi.vercel.app';
        }
        // Otherwise use env var or localhost
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
    const [expandedRepo, setExpandedRepo] = useState(null);
    const [contributorData, setContributorData] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetailData, setStudentDetailData] = useState(null);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
            onLogout();
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const fetchData = async () => {
        try {
            const [summaryRes, studentsRes, leaderboardRes] = await Promise.all([
                fetch(`${API_BASE}/api/summary`),
                fetch(`${API_BASE}/api/students`),
                fetch(`${API_BASE}/api/leaderboard`)
            ]);
            const summaryData = await summaryRes.json();
            const studentsData = await studentsRes.json();
            const leaderboardData = await leaderboardRes.json();

            setSummary(summaryData);
            setStudents(studentsData);
            setLeaderboard(leaderboardData);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContributorData = async (repoId) => {
        if (contributorData[repoId]) return;
        try {
            const res = await fetch(`${API_BASE}/api/repository/${repoId}/contributors`);
            const data = await res.json();
            // Ensure data has required fields with fallbacks
            const safeData = {
                contributors: data.contributors || [],
                timeline: data.timeline || [],
                total_commits: data.total_commits || 0
            };
            setContributorData(prev => ({ ...prev, [repoId]: safeData }));
        } catch (err) {
            console.error("Failed to fetch contributor data", err);
            // Set empty data so section still renders
            setContributorData(prev => ({
                ...prev,
                [repoId]: { contributors: [], timeline: [], total_commits: 0 }
            }));
        }
    };

    const toggleRepo = (repoId) => {
        if (expandedRepo === repoId) {
            setExpandedRepo(null);
        } else {
            setExpandedRepo(repoId);
            fetchContributorData(repoId);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newStudent)
            });
            if (res.ok) {
                setNewStudent({ name: "", email: "", repoUrl: "" });
                fetchData();
            } else {
                alert("Failed to add student. Please login as admin.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this student?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/student/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete student. Please login as admin.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSync = async (repoId) => {
        try {
            await fetch(`${API_BASE}/api/sync/${repoId}`, { method: "POST" });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSyncAll = async () => {
        try {
            const allRepos = students.flatMap(s => s.repositories || []);
            await Promise.all(allRepos.map(repo =>
                fetch(`${API_BASE}/api/sync/${repo.id}`, { method: "POST" })
            ));
            fetchData();
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
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const showStudentDetail = async (studentName) => {
        const student = students.find(s => s.name === studentName);
        if (student) {
            setSelectedStudent(student);
            // Fetch detailed analytics for this student's repos
            try {
                const repoDetails = await Promise.all(
                    (student.repositories || []).map(async (repo) => {
                        const [qualityRes, consistencyRes] = await Promise.all([
                            fetch(`${API_BASE}/api/analytics/code-quality/${repo.id}`).then(r => r.json()).catch(() => null),
                            fetch(`${API_BASE}/api/analytics/consistency/${repo.id}`).then(r => r.json()).catch(() => null)
                        ]);
                        return { ...repo, quality: qualityRes, consistency: consistencyRes };
                    })
                );
                setStudentDetailData({ ...student, repositories: repoDetails });
            } catch (err) {
                console.error(err);
                setStudentDetailData(student);
            }
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allRepositories = students.flatMap(s =>
        (s.repositories || []).map(r => ({ ...r, studentName: s.name, studentEmail: s.email }))
    );

    const filteredRepositories = allRepositories.filter(r =>
        r.repo_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-backdrop">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const renderOverview = () => (
        <>
            <div className="stats-grid">
                <StatsCard
                    title="Total Students"
                    value={summary.students}
                    icon="$"
                    colorClass="blue"
                    change={`+${Math.floor(summary.students * 0.1) || 1} this week`}
                    changeType="positive"
                />
                <StatsCard
                    title="Repositories"
                    value={summary.repositories}
                    icon="#"
                    colorClass="green"
                    change="Active tracking"
                    changeType="neutral"
                />
                <StatsCard
                    title="Total Commits"
                    value={summary.commits}
                    icon="+"
                    colorClass="purple"
                    change="+12.5% vs last week"
                    changeType="positive"
                />
                <StatsCard
                    title="Active (7 days)"
                    value={summary.active}
                    icon="^"
                    colorClass="orange"
                    change="recent commits"
                    changeType="neutral"
                />
            </div>

            <div className="dashboard-grid">
                <div className="main-column">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Project Leaderboard</div>
                                <div className="card-subtitle">Top performing repositories by commit count</div>
                            </div>
                        </div>
                        <div className="leaderboard-list">
                            {leaderboard.slice(0, 5).map((item, index) => (
                                <div key={item.id} className="leaderboard-item">
                                    <div className={`rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                                        {index + 1}
                                    </div>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-name">{item.name}</div>
                                        <div className="leaderboard-student">{item.student_name}</div>
                                    </div>
                                    <div className="commit-badge">
                                        {item.commit_count} commits
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <div className="no-data">
                                    <div className="no-data-text">No data available yet</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Recent Projects</div>
                                <div className="card-subtitle">Latest student activity</div>
                            </div>
                        </div>
                        <div className="student-list">
                            {students.slice(0, 4).map(student => (
                                <div key={student.id} className="student-card">
                                    <div className="student-info">
                                        <h3>{student.name}</h3>
                                        <p>{student.email}</p>
                                        {student.repositories?.slice(0, 1).map(repo => (
                                            <div key={repo.id} className="repo-mini">
                                                <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="repo-link">
                                                    {repo.owner}/{repo.repo_name}
                                                </a>
                                                {repo.insights && (
                                                    <span className="mini-stat">{repo.insights.total_commits} commits</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="side-column">
                    <div className="card system-card">
                        <div className="card-header">
                            <div className="card-title">System Overview</div>
                        </div>
                        <div className="card-body">
                            <div className="system-stat">
                                <div className="system-stat-label">Total Students</div>
                                <div className="system-stat-value">{summary.students}</div>
                            </div>
                            <div className="system-stat">
                                <div className="system-stat-label">Repositories Tracked</div>
                                <div className="system-stat-value">{summary.repositories}</div>
                            </div>
                            <div className="system-stat">
                                <div className="system-stat-label">Total Commits</div>
                                <div className="system-stat-value">{summary.commits}</div>
                            </div>
                            <div className="system-stat">
                                <div className="system-stat-label">Active (7 days)</div>
                                <div className="system-stat-value">{summary.active}</div>
                            </div>
                            <div className="system-divider"></div>
                            <div className="system-stat">
                                <div className="system-stat-label">Avg per Student</div>
                                <div className="system-stat-value">
                                    {summary.students > 0 ? Math.round(summary.commits / summary.students) : 0}
                                </div>
                            </div>
                            <div className="system-stat">
                                <div className="system-stat-label">Avg per Repository</div>
                                <div className="system-stat-value">
                                    {summary.repositories > 0 ? Math.round(summary.commits / summary.repositories) : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Recent Activity</div>
                                <div className="card-subtitle">Live feed</div>
                            </div>
                        </div>
                        <div className="activity-list">
                            {leaderboard.slice(0, 5).map((item, i) => (
                                <div key={item.id} className="activity-item">
                                    <div className={`activity-dot ${i === 0 ? 'success' : i < 3 ? 'info' : 'warning'}`}></div>
                                    <div className="activity-content">
                                        <div className="activity-text">{item.student_name}</div>
                                        <div className="activity-time">{item.commit_count} commits total</div>
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <div className="no-data">
                                    <div className="no-data-text">No recent activity</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderAnalytics = () => (
        <>
            <div className="stats-grid">
                <StatsCard
                    title="Total Commits"
                    value={summary.commits}
                    icon="+"
                    colorClass="purple"
                    change="+12.5% growth"
                    changeType="positive"
                />
                <StatsCard
                    title="Active Contributors"
                    value={summary.active}
                    icon="^"
                    colorClass="green"
                    change="in last 7 days"
                    changeType="neutral"
                />
                <StatsCard
                    title="Avg Commits/Repo"
                    value={summary.repositories > 0 ? Math.round(summary.commits / summary.repositories) : 0}
                    icon="~"
                    colorClass="blue"
                    change="per repository"
                    changeType="neutral"
                />
                <StatsCard
                    title="Avg Commits/Student"
                    value={summary.students > 0 ? Math.round(summary.commits / summary.students) : 0}
                    icon="="
                    colorClass="orange"
                    change="per student"
                    changeType="neutral"
                />
            </div>

            <div className="dashboard-grid">
                <div className="main-column">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Full Leaderboard</div>
                                <div className="card-subtitle">All repositories ranked by commits - click to view details</div>
                            </div>
                        </div>
                        <div className="leaderboard-list">
                            {leaderboard.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="leaderboard-item clickable"
                                    onClick={() => showStudentDetail(item.student_name)}
                                >
                                    <div className={`rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                                        {index + 1}
                                    </div>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-name">{item.name}</div>
                                        <div className="leaderboard-student">{item.student_name}</div>
                                    </div>
                                    <div className="commit-badge">
                                        {item.commit_count} commits
                                    </div>
                                    <div className="view-arrow">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <div className="no-data">
                                    <div className="no-data-text">No rankings available</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="side-column">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Statistics Summary</div>
                        </div>
                        <div className="card-body">
                            <div className="stat-row">
                                <span className="stat-label">Total Students</span>
                                <span className="stat-value-inline">{summary.students}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Total Repositories</span>
                                <span className="stat-value-inline">{summary.repositories}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Total Commits</span>
                                <span className="stat-value-inline">{summary.commits}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Active (7 days)</span>
                                <span className="stat-value-inline">{summary.active}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Activity Rate</span>
                                <span className="stat-value-inline">{summary.commits > 0 ? Math.round((summary.active / summary.commits) * 100) : 0}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Top Performers</div>
                        </div>
                        <div className="activity-list">
                            {leaderboard.slice(0, 3).map((item, i) => (
                                <div
                                    key={item.id}
                                    className="activity-item clickable"
                                    onClick={() => showStudentDetail(item.student_name)}
                                >
                                    <div className={`activity-dot ${i === 0 ? 'success' : i === 1 ? 'info' : 'warning'}`}></div>
                                    <div className="activity-content">
                                        <div className="activity-text">{item.student_name}</div>
                                        <div className="activity-time">{item.name} - {item.commit_count} commits</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="student-detail-modal" onClick={() => { setSelectedStudent(null); setStudentDetailData(null); }}>
                    <div className="student-detail-content" onClick={(e) => e.stopPropagation()}>
                        <div className="student-detail-header">
                            <div className="student-avatar-large">{selectedStudent.name?.charAt(0)}</div>
                            <div className="student-detail-info">
                                <h2>{selectedStudent.name}</h2>
                                <p>{selectedStudent.email}</p>
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedStudent(null); setStudentDetailData(null); }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                        <div className="student-detail-body">
                            <div className="student-stats-row">
                                <div className="student-stat-card">
                                    <div className="stat-number">{(studentDetailData || selectedStudent).repositories?.length || 0}</div>
                                    <div className="stat-text">Repositories</div>
                                </div>
                                <div className="student-stat-card">
                                    <div className="stat-number">
                                        {(studentDetailData || selectedStudent).repositories?.reduce((sum, r) => sum + (r.insights?.total_commits || 0), 0) || 0}
                                    </div>
                                    <div className="stat-text">Total Commits</div>
                                </div>
                                <div className="student-stat-card">
                                    <div className="stat-number">
                                        {(studentDetailData || selectedStudent).repositories?.reduce((sum, r) => sum + (r.insights?.recent_commits || 0), 0) || 0}
                                    </div>
                                    <div className="stat-text">Last 7 Days</div>
                                </div>
                            </div>
                            <h3>Repositories</h3>
                            <div className="student-repos-list">
                                {(studentDetailData || selectedStudent).repositories?.map(repo => (
                                    <div key={repo.id} className="student-repo-card">
                                        <div className="repo-card-header">
                                            <a href={repo.url || `https://github.com/${repo.owner}/${repo.repo_name}`} target="_blank" rel="noopener noreferrer">
                                                {repo.owner}/{repo.repo_name}
                                            </a>
                                            {repo.is_group && <span className="group-badge">Group Project</span>}
                                        </div>
                                        <div className="repo-card-stats">
                                            <div className="repo-stat">
                                                <span className="label">Total Commits</span>
                                                <span className="value">{repo.insights?.total_commits || 0}</span>
                                            </div>
                                            <div className="repo-stat">
                                                <span className="label">Recent</span>
                                                <span className="value">{repo.insights?.recent_commits || 0}</span>
                                            </div>
                                            <div className="repo-stat">
                                                <span className="label">Last Activity</span>
                                                <span className="value">{formatRelativeTime(repo.insights?.last_commit_date)}</span>
                                            </div>
                                            {repo.quality && (
                                                <div className="repo-stat grade">
                                                    <span className="label">Quality Grade</span>
                                                    <span className={`grade-value grade-${repo.quality.grade}`}>{repo.quality.grade}</span>
                                                </div>
                                            )}
                                        </div>
                                        {repo.consistency?.is_cramming && (
                                            <div className="cramming-warning">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                                </svg>
                                                Cramming detected: {repo.consistency.cramming_percentage}% commits in last 48h
                                            </div>
                                        )}
                                        {repo.tech_stack && repo.tech_stack.length > 0 && (
                                            <div className="tech-tags">
                                                {repo.tech_stack.map((tech, i) => (
                                                    <span key={i} className="tech-tag-small">{tech}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const renderStudents = () => (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage and track all enrolled students</p>
                </div>
                <div className="page-actions">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="main-column">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">All Students ({filteredStudents.length})</div>
                                <div className="card-subtitle">Click to expand repository details</div>
                            </div>
                        </div>
                        <div className="student-list">
                            {filteredStudents.map(student => (
                                <div key={student.id} className="student-card">
                                    <div className="student-info">
                                        <h3>{student.name}</h3>
                                        <p>{student.email}</p>
                                        {student.repositories?.map(repo => (
                                            <div key={repo.id} className="repo-section">
                                                <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="repo-link">
                                                    {repo.owner}/{repo.repo_name}
                                                </a>
                                                {repo.insights && (
                                                    <div className="repo-insights">
                                                        <div className="insight-item">
                                                            <span className="insight-text">
                                                                {repo.insights.total_commits} commits
                                                            </span>
                                                        </div>
                                                        <div className="insight-item">
                                                            <span className="insight-text">
                                                                {repo.insights.recent_commits} recent
                                                            </span>
                                                        </div>
                                                        {repo.insights.last_commit_date && (
                                                            <div className="insight-item">
                                                                <span className="insight-text">
                                                                    {formatRelativeTime(repo.insights.last_commit_date)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => toggleRepo(repo.id)}
                                                    className="btn-text"
                                                >
                                                    {expandedRepo === repo.id ? 'Hide Details' : 'View Details'}
                                                </button>

                                                {expandedRepo === repo.id && contributorData[repo.id] && (
                                                    <div className="contributor-details animate-fade-in">
                                                        <div className="contributor-list">
                                                            <h4>Contributors</h4>
                                                            {contributorData[repo.id].contributors?.length > 0 ? (
                                                                <div className="contributor-grid">
                                                                    {contributorData[repo.id].contributors.map(c => (
                                                                        <div key={c.author} className="contributor-stat-card">
                                                                            <div className="contributor-name">{c.author}</div>
                                                                            <div className="contributor-commits">{c.commit_count} commits</div>
                                                                            <div className="contributor-percentage">{c.percentage}%</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="no-contributors">
                                                                    <p>No contributor data available yet</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <CommitChart
                                                            timeline={contributorData[repo.id].timeline || []}
                                                            contributors={contributorData[repo.id].contributors || []}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="actions">
                                        {student.repositories?.map(repo => (
                                            <button key={repo.id} onClick={() => handleSync(repo.id)} className="btn-icon" title="Sync Repository">
                                                ↻
                                            </button>
                                        ))}
                                        {isAuthenticated && (
                                            <button onClick={() => handleDelete(student.id)} className="btn-icon danger" title="Delete Student">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredStudents.length === 0 && (
                                <div className="no-data">
                                    <div className="no-data-text">
                                        {searchQuery ? 'No students match your search' : 'No students added yet'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="side-column">
                    {isAuthenticated && (
                        <>
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">Add New Student</div>
                                </div>
                                <div className="card-body">
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
                                                placeholder="https://github.com/user/repo"
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary">Add Student</button>
                                    </form>
                                </div>
                            </div>

                            <BulkUpload onUploadComplete={fetchData} API_BASE={API_BASE} />
                        </>
                    )}

                    {!isAuthenticated && (
                        <div className="card">
                            <div className="card-body">
                                <p className="text-muted">Login as admin to add or manage students.</p>
                                <button className="btn-primary" onClick={() => navigate('/admin')}>
                                    Admin Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderRepositories = () => (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Repositories</h1>
                    <p className="page-subtitle">All tracked GitHub repositories</p>
                </div>
                <div className="page-actions">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-secondary" onClick={handleSyncAll}>
                        Sync All
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">All Repositories ({filteredRepositories.length})</div>
                        <div className="card-subtitle">Click sync to update commit data</div>
                    </div>
                </div>
                <div className="repo-table">
                    <div className="repo-table-header">
                        <div className="repo-col-name">Repository</div>
                        <div className="repo-col-student">Student</div>
                        <div className="repo-col-commits">Commits</div>
                        <div className="repo-col-recent">Recent</div>
                        <div className="repo-col-last">Last Activity</div>
                        <div className="repo-col-actions">Actions</div>
                    </div>
                    {filteredRepositories.map(repo => (
                        <div key={repo.id} className="repo-table-row">
                            <div className="repo-col-name">
                                <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="repo-link">
                                    {repo.owner}/{repo.repo_name}
                                </a>
                            </div>
                            <div className="repo-col-student">{repo.studentName}</div>
                            <div className="repo-col-commits">{repo.insights?.total_commits || 0}</div>
                            <div className="repo-col-recent">{repo.insights?.recent_commits || 0}</div>
                            <div className="repo-col-last">{formatRelativeTime(repo.insights?.last_commit_date)}</div>
                            <div className="repo-col-actions">
                                <button onClick={() => handleSync(repo.id)} className="btn-icon" title="Sync">
                                    ↻
                                </button>
                                <button onClick={() => toggleRepo(repo.id)} className="btn-icon" title="Details">
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredRepositories.length === 0 && (
                        <div className="no-data">
                            <div className="no-data-text">
                                {searchQuery ? 'No repositories match your search' : 'No repositories tracked yet'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {expandedRepo && contributorData[expandedRepo] && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <div className="card-title">Repository Details</div>
                        <button className="btn-text" onClick={() => setExpandedRepo(null)}>Close</button>
                    </div>
                    <div className="card-body">
                        <div className="contributor-list">
                            <h4>Contributors</h4>
                            <div className="contributor-grid">
                                {contributorData[expandedRepo].contributors.map(c => (
                                    <div key={c.author} className="contributor-stat-card">
                                        <div className="contributor-name">{c.author}</div>
                                        <div className="contributor-commits">{c.commit_count} commits</div>
                                        <div className="contributor-percentage">{c.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <CommitChart
                            timeline={contributorData[expandedRepo].timeline}
                            contributors={contributorData[expandedRepo].contributors}
                        />
                    </div>
                </div>
            )}
        </>
    );

    const renderSettings = () => (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your dashboard and account preferences</p>
                </div>
            </div>

            <div className="settings-container">
                {/* Account Section */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="settings-section-title">Account</h2>
                            <p className="settings-section-desc">Manage your account and session</p>
                        </div>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Administrator Status</div>
                                <div className="settings-row-desc">Your current access level and permissions</div>
                            </div>
                            <div className="settings-row-right">
                                <span className="status-badge active">
                                    <span className="status-dot"></span>
                                    Active
                                </span>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Current Session</div>
                                <div className="settings-row-desc">Logged in as Admin since this session started</div>
                            </div>
                            <div className="settings-row-right">
                                <button className="btn-outline-danger" onClick={handleLogout}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16,17 21,12 16,7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Management Section */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="settings-section-title">Data Management</h2>
                            <p className="settings-section-desc">Sync and refresh your repository data</p>
                        </div>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Synchronize All Repositories</div>
                                <div className="settings-row-desc">Fetch latest commit data from GitHub for all tracked repositories</div>
                            </div>
                            <div className="settings-row-right">
                                <button className="btn-action" onClick={handleSyncAll}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                                    </svg>
                                    Sync All
                                </button>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Refresh Dashboard</div>
                                <div className="settings-row-desc">Reload all statistics and student data from the server</div>
                            </div>
                            <div className="settings-row-right">
                                <button className="btn-action" onClick={fetchData}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="23,4 23,10 17,10" />
                                        <polyline points="1,20 1,14 7,14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Export Data</div>
                                <div className="settings-row-desc">Download all student and commit data as CSV</div>
                            </div>
                            <div className="settings-row-right">
                                <button className="btn-action" onClick={() => alert('Export feature coming soon!')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7,10 12,15 17,10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Information Section */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="settings-section-title">System Information</h2>
                            <p className="settings-section-desc">Technical details and configuration</p>
                        </div>
                    </div>
                    <div className="settings-section-content">
                        <div className="info-grid">
                            <div className="info-card">
                                <div className="info-card-label">API Endpoint</div>
                                <div className="info-card-value mono">{API_BASE}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-card-label">Total Students</div>
                                <div className="info-card-value">{summary.students}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-card-label">Total Repositories</div>
                                <div className="info-card-value">{summary.repositories}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-card-label">Total Commits</div>
                                <div className="info-card-value">{summary.commits}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-card-label">Auto-refresh Interval</div>
                                <div className="info-card-value">15 minutes</div>
                            </div>
                            <div className="info-card">
                                <div className="info-card-label">Last Updated</div>
                                <div className="info-card-value">{new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <div className="settings-section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="settings-section-title">Preferences</h2>
                            <p className="settings-section-desc">Customize your dashboard experience</p>
                        </div>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Theme</div>
                                <div className="settings-row-desc">Choose your preferred color scheme</div>
                            </div>
                            <div className="settings-row-right">
                                <div className="theme-selector">
                                    <button className="theme-btn active">Light</button>
                                    <button className="theme-btn" disabled>Dark</button>
                                </div>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-left">
                                <div className="settings-row-label">Notifications</div>
                                <div className="settings-row-desc">Get notified about important updates</div>
                            </div>
                            <div className="settings-row-right">
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'leaderboard': return renderAnalytics();
            case 'analytics': return <Analytics />;
            case 'students': return renderStudents();
            case 'repositories': return renderRepositories();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">S</div>
                        <span className="logo-text">Student Progress</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Platform</div>
                        <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                            <span className="nav-item-icon">◎</span>
                            Command Center
                        </button>
                        <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                            <span className="nav-item-icon">◆</span>
                            Analytics
                        </button>
                        <button className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                            <span className="nav-item-icon">★</span>
                            Leaderboard
                        </button>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Management</div>
                        <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                            <span className="nav-item-icon">●</span>
                            Students
                        </button>
                        <button className={`nav-item ${activeTab === 'repositories' ? 'active' : ''}`} onClick={() => setActiveTab('repositories')}>
                            <span className="nav-item-icon">▣</span>
                            Repositories
                        </button>
                    </div>

                    {isAuthenticated && (
                        <div className="nav-section">
                            <div className="nav-section-title">Configuration</div>
                            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                                <span className="nav-item-icon">⚙</span>
                                Settings
                            </button>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {isAuthenticated ? (
                        <div className="user-info">
                            <div className="user-avatar">A</div>
                            <div className="user-details">
                                <div className="user-name">Admin</div>
                                <div className="user-role">Administrator</div>
                            </div>
                        </div>
                    ) : (
                        <button className="nav-item" onClick={() => navigate('/admin')}>
                            <span className="nav-item-icon">→</span>
                            Admin Login
                        </button>
                    )}
                </div>
            </aside>

            <main className="main-content">
                <div className="top-bar">
                    <div className="greeting">
                        {getGreeting()}, <strong>{isAuthenticated ? 'Admin' : 'Guest'}</strong>. Operations are running smoothly.
                    </div>
                    <div className="top-bar-actions">
                        <div className="tab-group">
                            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
                            <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Students</button>
                            <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Rankings</button>
                        </div>
                        <button className="icon-btn" title="Refresh Data" onClick={fetchData}>↻</button>
                        {isAuthenticated && (
                            <button className="btn-logout" onClick={handleLogout}>
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>

                <div className="dashboard-content animate-fade-in" key={activeTab}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
