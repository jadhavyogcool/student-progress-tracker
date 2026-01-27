import express from "express";
import { supabase } from "./supabase.js";
import { fetchCommits } from "./github.js";

const router = express.Router();

/* Add student + repo */
router.post("/student", async (req, res) => {
    const { name, email, repoUrl } = req.body;
    const [, , , owner, repo_name] = repoUrl.split("/");

    const { data: student } = await supabase
        .from("students")
        .insert({ name, email })
        .select()
        .single();

    await supabase.from("repositories").insert({
        student_id: student.id,
        repo_url: repoUrl,
        owner,
        repo_name
    });

    res.json({ success: true });
});

/* Dashboard summary */
router.get("/summary", async (_, res) => {
    const students = await supabase.from("students").select("*", { count: "exact", head: true });
    const repos = await supabase.from("repositories").select("*", { count: "exact", head: true });
    const commits = await supabase.from("commits").select("*", { count: "exact", head: true });

    const active = await supabase
        .from("commits")
        .select("*", { count: "exact", head: true })
        .gte("commit_date", new Date(Date.now() - 7 * 86400000));

    res.json({
        students: students.count,
        repositories: repos.count,
        commits: commits.count,
        active: active.count
    });
});

/* List students */
router.get("/students", async (_, res) => {
    const { data } = await supabase
        .from("students")
        .select(`
      id, name, email,
      repositories ( id, repo_url )
    `);

    res.json(data);
});

/* Sync commits */
router.post("/sync/:repoId", async (req, res) => {
    const { repoId } = req.params;

    const { data: repo } = await supabase
        .from("repositories")
        .select("*")
        .eq("id", repoId)
        .single();

    const commits = await fetchCommits(repo.owner, repo.repo_name);

    for (const c of commits) {
        await supabase.from("commits").upsert({
            sha: c.sha,
            repo_id: repo.id,
            author: c.commit.author?.name,
            commit_date: c.commit.author?.date
        });
    }

    res.json({ synced: true });
});

export default router;
