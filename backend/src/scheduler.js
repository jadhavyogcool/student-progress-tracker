import cron from "node-cron";
import { supabase } from "./supabase.js";
import { fetchCommits } from "./github.js";

/**
 * Sync all repositories' commits
 */
export async function syncAllRepositories() {
    console.log(`[Scheduler] Starting auto-sync at ${new Date().toISOString()}`);

    try {
        // Fetch all repositories
        const { data: repos, error } = await supabase.from("repositories").select("*");

        if (error) throw error;
        if (!repos || repos.length === 0) {
            console.log("[Scheduler] No repositories found to sync.");
            return;
        }

        console.log(`[Scheduler] Found ${repos.length} repositories. Syncing...`);

        for (const repo of repos) {
            try {
                const commits = await fetchCommits(repo.owner, repo.repo_name);

                if (commits && commits.length > 0) {
                    console.log(`[Scheduler] Fetched ${commits.length} commits for ${repo.owner}/${repo.repo_name}. Saving...`);

                    // Bulk upsert commits (handle in chunks of 100 to avoid request size limits)
                    const commitData = commits.map(c => ({
                        sha: c.sha,
                        repo_id: repo.id,
                        author: c.commit.author?.name,
                        commit_date: c.commit.author?.date
                    }));

                    for (let i = 0; i < commitData.length; i += 100) {
                        const chunk = commitData.slice(i, i + 100);
                        const { error: upsertError } = await supabase
                            .from("commits")
                            .upsert(chunk, { onConflict: 'sha' });

                        if (upsertError) throw upsertError;
                    }
                }

                // Update last synced timestamp
                await supabase
                    .from("repositories")
                    .update({ synced_at: new Date().toISOString() })
                    .eq("id", repo.id);

                console.log(`[Scheduler] Successfully synced ${repo.owner}/${repo.repo_name}`);
            } catch (repoError) {
                console.error(`[Scheduler] Error syncing ${repo.owner}/${repo.repo_name}:`, repoError.message);
            }
        }

        console.log(`[Scheduler] Auto-sync completed at ${new Date().toISOString()}`);
    } catch (error) {
        console.error("[Scheduler] Fatal error during auto-sync:", error.message);
    }
}

/**
 * Initialize the scheduler
 */
export function initScheduler() {
    // Run every 15 minutes: '*/15 * * * *'
    // For immediate testing, can be set to every minute: '* * * * *'
    const interval = process.env.SYNC_INTERVAL || '*/15 * * * *';

    cron.schedule(interval, () => {
        syncAllRepositories();
    });

    console.log(`[Scheduler] Initialized with interval: ${interval}`);

    // Optional: Run once on startup
    if (process.env.SYNC_ON_STARTUP === "true") {
        syncAllRepositories();
    }
}
