import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCommits() {
    const { count } = await supabase
        .from('commits')
        .select('*', { count: 'exact', head: true });

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

    const { data: repos } = await supabase.from('repositories').select('id, repo_name');
    const result = {
        total: count,
        repos: repos.map(r => ({ name: r.repo_name, commits: counts[r.id] || 0 }))
    };

    fs.writeFileSync('db-result.json', JSON.stringify(result, null, 2), 'utf-8');
}

checkCommits();
