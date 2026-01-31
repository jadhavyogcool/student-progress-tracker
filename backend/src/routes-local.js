// Local routes using in-memory data store (no Supabase)
import express from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { localStore } from "./localStore.js";
import { requireAuth } from "./middleware/auth.js";
import * as analytics from "./analytics.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ========== AUTHENTICATION ROUTES ========== */

// Login
router.post("/auth/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password === adminPassword) {
        req.session.isAuthenticated = true;
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ error: "Session error" });
            }
            res.json({ success: true, message: "Logged in successfully" });
        });
    } else {
        res.status(401).json({ error: "Invalid password" });
    }
});

// Logout
router.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// Verify authentication
router.get("/auth/verify", (req, res) => {
    if (req.session && req.session.isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

/* ========== STUDENT ROUTES ========== */

/* Add student + repo */
router.post("/student", requireAuth, async (req, res) => {
    try {
        const { name, email, repoUrl } = req.body;
        const parts = repoUrl.split("/");
        const owner = parts[parts.length - 2];
        const repo_name = parts[parts.length - 1];

        if (!owner || !repo_name) {
            return res.status(400).json({ error: "Invalid GitHub URL" });
        }

        const student = localStore.addStudent({ name, email });
        localStore.addRepository({
            student_id: student.id,
            repo_url: repoUrl,
            owner,
            repo_name
        });

        res.json({ success: true, student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Dashboard summary */
router.get("/summary", (_, res) => {
    try {
        const summary = localStore.getSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* List students */
router.get("/students", (_, res) => {
    try {
        const students = localStore.getStudentsWithRepos();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Delete student */
router.delete("/student/:id", requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = localStore.deleteStudent(id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Student not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Leaderboard */
router.get("/leaderboard", (_, res) => {
    try {
        const leaderboard = localStore.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Sync repo (mock - just returns success for local testing) */
router.post("/sync/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const repo = localStore.getRepositoryById(repoId);
        
        if (!repo) {
            return res.status(404).json({ error: "Repository not found" });
        }

        // For local testing, we'll just return success
        // In production, this would fetch from GitHub
        res.json({ success: true, message: "Sync completed (mock)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Sync all */
router.post("/sync-all", requireAuth, (_, res) => {
    try {
        res.json({ success: true, message: "All repositories synced (mock)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Contributors for a repo */
router.get("/repository/:repoId/contributors", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const data = localStore.getContributors(repoId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Bulk upload CSV */
router.post("/upload-csv", requireAuth, upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const results = [];
        const errors = [];
        let processedCount = 0;

        const stream = Readable.from(req.file.buffer.toString());
        
        stream
            .pipe(csv())
            .on("data", (row) => {
                const name = row.name || row.Name;
                const email = row.email || row.Email || "";
                const repoUrl = row.repoUrl || row.repo_url || row.RepoUrl || row.github;

                if (!name || !repoUrl) {
                    errors.push({ row: processedCount + 1, error: "Missing name or repoUrl" });
                    processedCount++;
                    return;
                }

                try {
                    const parts = repoUrl.split("/");
                    const owner = parts[parts.length - 2];
                    const repo_name = parts[parts.length - 1];

                    if (!owner || !repo_name) {
                        errors.push({ row: processedCount + 1, error: "Invalid GitHub URL" });
                        processedCount++;
                        return;
                    }

                    const student = localStore.addStudent({ name, email });
                    localStore.addRepository({
                        student_id: student.id,
                        repo_url: repoUrl,
                        owner,
                        repo_name
                    });

                    results.push({ name, repoUrl });
                } catch (err) {
                    errors.push({ row: processedCount + 1, error: err.message });
                }
                processedCount++;
            })
            .on("end", () => {
                res.json({
                    success: true,
                    imported: results.length,
                    errors: errors.length > 0 ? errors : undefined
                });
            })
            .on("error", (err) => {
                res.status(500).json({ error: err.message });
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== ANALYTICS ROUTES ========== */

/* Class-wide analytics */
router.get("/analytics/class", (req, res) => {
    try {
        const data = analytics.getClassAnalytics();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Repository analytics */
router.get("/analytics/repository/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const data = analytics.getRepositoryAnalytics(repoId);
        if (!data) {
            return res.status(404).json({ error: "Repository not found" });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Tech stack radar */
router.get("/analytics/tech-stack", (req, res) => {
    try {
        const repos = localStore.getRepositories();
        const data = analytics.analyzeTechStack(repos);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Contribution balance for a repo */
router.get("/analytics/contribution-balance/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const data = analytics.getContributionBalance(repoId);
        if (!data) {
            return res.status(404).json({ error: "Repository not found" });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Consistency analysis for a repo */
router.get("/analytics/consistency/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const commits = localStore.getCommitsByRepoId(repoId);
        const data = analytics.analyzeConsistency(commits);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Code quality analysis for a repo */
router.get("/analytics/code-quality/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const commits = localStore.getCommitsByRepoId(repoId);
        const data = analytics.analyzeCommitQuality(commits);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Get milestones */
router.get("/milestones", (req, res) => {
    try {
        const milestones = analytics.getMilestones();
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Set milestones */
router.post("/milestones", requireAuth, (req, res) => {
    try {
        const { milestones } = req.body;
        const updated = analytics.setMilestones(milestones);
        res.json({ success: true, milestones: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Get milestone progress for a repo */
router.get("/analytics/milestone-progress/:repoId", (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const data = analytics.getMilestoneProgress(repoId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* AI Summary (Code Pulse) */
router.get("/analytics/ai-summary/:repoId", async (req, res) => {
    try {
        const repoId = parseInt(req.params.repoId);
        const data = await analytics.generateAISummary(repoId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* All students analytics (for overview) */
router.get("/analytics/students", (req, res) => {
    try {
        const students = localStore.getStudentsWithRepos();
        const analyticsData = students.map(student => {
            const repoAnalytics = student.repositories?.map(repo => {
                const commits = localStore.getCommitsByRepoId(repo.id);
                const quality = analytics.analyzeCommitQuality(commits);
                const consistency = analytics.analyzeConsistency(commits);
                const balance = analytics.getContributionBalance(repo.id);
                const milestones = analytics.getMilestoneProgress(repo.id);
                
                return {
                    ...repo,
                    analytics: {
                        quality,
                        consistency,
                        balance,
                        milestones
                    }
                };
            }) || [];

            return {
                ...student,
                repositories: repoAnalytics
            };
        });

        res.json(analyticsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Weekly activity for all students */
router.get("/analytics/weekly-activity", (req, res) => {
    try {
        const commits = localStore.getCommits();
        const students = localStore.getStudents();
        const now = new Date();
        const weekAgo = new Date(now - 7 * 86400000);
        
        // Group commits by student per day
        const dailyActivity = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(now - i * 86400000);
            const dateStr = date.toISOString().split('T')[0];
            dailyActivity[dateStr] = {};
            students.forEach(s => {
                dailyActivity[dateStr][s.id] = 0;
            });
        }
        
        commits.filter(c => new Date(c.commit_date) >= weekAgo).forEach(commit => {
            const dateStr = new Date(commit.commit_date).toISOString().split('T')[0];
            const repo = localStore.getRepositoryById(commit.repo_id);
            if (repo && dailyActivity[dateStr]) {
                dailyActivity[dateStr][repo.student_id] = (dailyActivity[dateStr][repo.student_id] || 0) + 1;
            }
        });

        res.json({
            dates: Object.keys(dailyActivity).sort(),
            students: students.map(s => ({ id: s.id, name: s.name })),
            activity: dailyActivity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Get at-risk students (low activity or poor quality) */
router.get("/analytics/at-risk", (req, res) => {
    try {
        const students = localStore.getStudentsWithRepos();
        const atRiskStudents = [];
        
        students.forEach(student => {
            const issues = [];
            let totalCommits = 0;
            let recentCommits = 0;
            const weekAgo = new Date(Date.now() - 7 * 86400000);
            
            student.repositories?.forEach(repo => {
                const commits = localStore.getCommitsByRepoId(repo.id);
                totalCommits += commits.length;
                recentCommits += commits.filter(c => new Date(c.commit_date) >= weekAgo).length;
                
                const quality = analytics.analyzeCommitQuality(commits);
                const consistency = analytics.analyzeConsistency(commits);
                
                if (quality.grade === 'F') {
                    issues.push({ type: 'quality', message: `Poor commit quality in ${repo.repo_name}`, severity: 'high' });
                } else if (quality.grade === 'D') {
                    issues.push({ type: 'quality', message: `Low commit quality in ${repo.repo_name}`, severity: 'medium' });
                }
                
                if (consistency.isCramming) {
                    issues.push({ type: 'cramming', message: `Cramming detected in ${repo.repo_name}`, severity: 'high' });
                }
            });
            
            if (recentCommits === 0 && totalCommits > 0) {
                issues.push({ type: 'inactive', message: 'No commits in the last 7 days', severity: 'medium' });
            }
            
            if (totalCommits < 5) {
                issues.push({ type: 'low-activity', message: 'Very few commits overall', severity: 'medium' });
            }
            
            if (issues.length > 0) {
                atRiskStudents.push({
                    student: { id: student.id, name: student.name, email: student.email },
                    issues,
                    totalCommits,
                    recentCommits,
                    riskScore: issues.filter(i => i.severity === 'high').length * 2 + issues.filter(i => i.severity === 'medium').length
                });
            }
        });
        
        res.json(atRiskStudents.sort((a, b) => b.riskScore - a.riskScore));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Get class progress over time */
router.get("/analytics/progress-timeline", (req, res) => {
    try {
        const commits = localStore.getCommits();
        const sortedCommits = commits.sort((a, b) => new Date(a.commit_date) - new Date(b.commit_date));
        
        // Group by week
        const weeklyData = {};
        sortedCommits.forEach(commit => {
            const date = new Date(commit.commit_date);
            const weekStart = new Date(date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { commits: 0, activeStudents: new Set() };
            }
            weeklyData[weekKey].commits++;
            const repo = localStore.getRepositoryById(commit.repo_id);
            if (repo) {
                weeklyData[weekKey].activeStudents.add(repo.student_id);
            }
        });
        
        const timeline = Object.entries(weeklyData)
            .map(([week, data]) => ({
                week,
                commits: data.commits,
                activeStudents: data.activeStudents.size,
                cumulativeCommits: 0
            }))
            .sort((a, b) => a.week.localeCompare(b.week));
        
        // Calculate cumulative
        let cumulative = 0;
        timeline.forEach(item => {
            cumulative += item.commits;
            item.cumulativeCommits = cumulative;
        });
        
        res.json(timeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== LEADERBOARD ROUTES ========== */

// Get leaderboard
router.get('/analytics/leaderboard/:period?', (req, res) => {
    try {
        const period = req.params.period || 'all';
        const leaderboard = analytics.getLeaderboard(period);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== COMPARISON ROUTES ========== */

// Compare two students
router.get('/analytics/compare/:studentId1/:studentId2', (req, res) => {
    try {
        const { studentId1, studentId2 } = req.params;
        const comparison = analytics.compareStudents(parseInt(studentId1), parseInt(studentId2));
        res.json(comparison);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== STREAK ROUTES ========== */

// Get student streaks
router.get('/analytics/streaks/:studentId', (req, res) => {
    try {
        const { studentId } = req.params;
        const repos = localStore.getRepositories().filter(r => r.student_id === parseInt(studentId));
        const repoIds = repos.map(r => r.id);
        const commits = localStore.getCommits().filter(c => repoIds.includes(c.repo_id));
        
        const streaks = analytics.calculateStreaks(commits);
        res.json(streaks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== TIMELINE ROUTES ========== */

// Get student progress timeline
router.get('/analytics/timeline/:studentId', (req, res) => {
    try {
        const { studentId } = req.params;
        const timeline = analytics.getProgressTimeline(parseInt(studentId));
        res.json(timeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== BADGES ROUTES ========== */

// Get student badges
router.get('/analytics/badges/:studentId', (req, res) => {
    try {
        const { studentId } = req.params;
        const badges = analytics.getStudentBadges(parseInt(studentId));
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ========== EXPORT ROUTES ========== */

// Export analytics data
router.get('/analytics/export/:format?', (req, res) => {
    try {
        const format = req.params.format || 'json';
        const exportData = analytics.exportAnalyticsData(format);
        
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=student-analytics.csv');
            res.send(exportData.csvString);
        } else {
            res.json(exportData);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
