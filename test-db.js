import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in backend/.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCommits() {
    const { count, error } = await supabase
        .from('commits')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching commits:", error);
    } else {
        console.log(`Total commits in database: ${count}`);

        // Group by repo
        const { data: repoCommits, error: repoError } = await supabase
            .rpc('get_commit_counts_by_repo'); // custom RPC if exists, or do a count query manually

        // Let's just fetch all and count locally for check
        let allCommits = [];
        let from = 0;
        while (true) {
            const { data } = await supabase.from('commits').select('repo_id').range(from, from + 999);
            if (!data || data.length === 0) break;
            allCommits = allCommits.concat(data);
            from += 1000;
        }

        const counts = {};
        for (const c of allCommits) {
            counts[c.repo_id] = (counts[c.repo_id] || 0) + 1;
        }
        console.log("Commits per repo_id:");
        for (const [repo_id, count] of Object.entries(counts)) {
            console.log(`Repo ${repo_id}: ${count} commits`);
        }
    }
}

checkCommits();
