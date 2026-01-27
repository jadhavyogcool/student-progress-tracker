import express from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { supabase } from "./supabase.js";
import { fetchCommits } from "./github.js";
import { requireAuth } from "./middleware/auth.js";

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

        const { data: student, error: studentError } = await supabase
            .from("students")
            .insert({ name, email })
            .select()
            .single();

        if (studentError) throw studentError;

        await supabase.from("repositories").insert({
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
router.get("/summary", async (_, res) => {
    try {
        const { count: students } = await supabase.from("students").select("*", { count: "exact", head: true });
        const { count: repositories } = await supabase.from("repositories").select("*", { count: "exact", head: true });
        const { count: commits } = await supabase.from("commits").select("*", { count: "exact", head: true });

        const { count: active } = await supabase
            .from("commits")
            .select("*", { count: "exact", head: true })
            .gte("commit_date", new Date(Date.now() - 7 * 86400000).toISOString());

        res.json({
            students: students || 0,
            repositories: repositories || 0,
            commits: commits || 0,
            active: active || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* List students */
router.get("/students", async (_, res) => {
    try {
        const { data: students } = await supabase
            .from("students")
            .select(`
        id, name, email, created_at,
        repositories ( id, repo_url, owner, repo_name )
      `)
            .order('created_at', { ascending: false });

        // Fetch insights for each repository
        if (students) {
            for (const student of students) {
                if (student.repositories) {
                    for (const repo of student.repositories) {
                        // Get total commits for this repository
                        const { count: totalCommits } = await supabase
                            .from("commits")
                            .select("*", { count: "exact", head: true })
                            .eq("repo_id", repo.id);

                        // Get recent commits (last 7 days)
                        const { count: recentCommits } = await supabase
                            .from("commits")
                            .select("*", { count: "exact", head: true })
                            .eq("repo_id", repo.id)
                            .gte("commit_date", new Date(Date.now() - 7 * 86400000).toISOString());

                        // Get last commit date
                        const { data: lastCommit } = await supabase
                            .from("commits")
                            .select("commit_date")
                            .eq("repo_id", repo.id)
                            .order("commit_date", { ascending: false })
                            .limit(1)
                            .single();

                        // Add insights to repository object
                        repo.insights = {
                            total_commits: totalCommits || 0,
                            recent_commits: recentCommits || 0,
                            last_commit_date: lastCommit?.commit_date || null
                        };
                    }
                }
            }
        }

        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Delete Student */
router.delete("/student/:id", requireAuth, async (req, res) => {
    try {
        const { error } = await supabase.from("students").delete().eq("id", req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Sync commits */
router.post("/sync/:repoId", async (req, res) => {
    try {
        const { repoId } = req.params;

        const { data: repo } = await supabase
            .from("repositories")
            .select("*")
            .eq("id", repoId)
            .single();

        if (!repo) return res.status(404).json({ error: "Repo not found" });

        const commits = await fetchCommits(repo.owner, repo.repo_name);

        for (const c of commits) {
            await supabase.from("commits").upsert({
                sha: c.sha,
                repo_id: repo.id,
                author: c.commit.author?.name,
                commit_date: c.commit.author?.date
            }, { onConflict: 'sha' });
        }

        res.json({ synced: true, count: commits.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/* Bulk upload students via CSV */
router.post("/students/bulk", requireAuth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const results = [];
        const errors = [];
        const csvData = [];

        // Parse CSV from buffer
        const stream = Readable.from(req.file.buffer.toString());

        stream
            .pipe(csv())
            .on("data", (row) => {
                csvData.push(row);
            })
            .on("end", async () => {
                // Process each row
                for (let i = 0; i < csvData.length; i++) {
                    const row = csvData[i];
                    const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed

                    try {
                        const { name, email, repo_url } = row;

                        // Validate required fields
                        if (!name || !repo_url) {
                            errors.push({
                                row: rowNumber,
                                data: row,
                                error: "Missing required fields (name, repo_url)"
                            });
                            continue;
                        }

                        // Parse GitHub URL
                        const parts = repo_url.trim().split("/");
                        const owner = parts[parts.length - 2];
                        const repo_name = parts[parts.length - 1];

                        if (!owner || !repo_name) {
                            errors.push({
                                row: rowNumber,
                                data: row,
                                error: "Invalid GitHub URL format"
                            });
                            continue;
                        }

                        // Insert student
                        const { data: student, error: studentError } = await supabase
                            .from("students")
                            .insert({ name: name.trim(), email: email?.trim() || null })
                            .select()
                            .single();

                        if (studentError) throw studentError;

                        // Insert repository
                        const { error: repoError } = await supabase
                            .from("repositories")
                            .insert({
                                student_id: student.id,
                                repo_url: repo_url.trim(),
                                owner,
                                repo_name
                            });

                        if (repoError) throw repoError;

                        results.push({
                            row: rowNumber,
                            student: student.name,
                            success: true
                        });

                    } catch (error) {
                        errors.push({
                            row: rowNumber,
                            data: row,
                            error: error.message
                        });
                    }
                }

                // Send response
                res.json({
                    success: true,
                    imported: results.length,
                    failed: errors.length,
                    results,
                    errors
                });
            })
            .on("error", (error) => {
                res.status(500).json({ error: "CSV parsing failed: " + error.message });
            });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
