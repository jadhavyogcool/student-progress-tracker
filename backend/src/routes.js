import express from "express";
import { supabase } from "./supabase.js";
import { fetchCommits } from "./github.js";

const router = express.Router();

/* Add student + repo */
router.post("/student", async (req, res) => {
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
        const { data } = await supabase
            .from("students")
            .select(`
        id, name, email, created_at,
        repositories ( id, repo_url, owner, repo_name )
      `)
            .order('created_at', { ascending: false });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* Delete Student */
router.delete("/student/:id", async (req, res) => {
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

export default router;
