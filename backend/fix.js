import fs from 'fs';

const path = 'src/routes.js';
let src = fs.readFileSync(path, 'utf-8');

const helper = `async function fetchAllRecords(table, selectQuery) {
    let allData = [];
    let from = 0;
    const step = 1000;
    while (true) {
        const { data, error } = await supabase.from(table).select(selectQuery).range(from, from + step - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
    }
    return allData;
}`;

const oldQueryBlock = `        supabase.from("students").select("id, name, email, created_at"),
        supabase.from("repositories").select("id, student_id, repo_name, owner, repo_url"),
        supabase.from("commits").select("repo_id, commit_date, author, sha")`;

const newQueryBlock = `        fetchAllRecords("students", "id, name, email, created_at").then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
        fetchAllRecords("repositories", "id, student_id, repo_name, owner, repo_url").then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
        fetchAllRecords("commits", "repo_id, commit_date, author, sha").then(data => ({ data, error: null })).catch(error => ({ data: null, error }))`;

src = src.replace('async function getGlobalData() {', helper + '\\n\\n// Fetch all data in parallel to avoid N+1 query performance issues\\nasync function getGlobalData() {');
src = src.replace(oldQueryBlock, newQueryBlock);

fs.writeFileSync(path, src, 'utf-8');
console.log('Fixed routes.js');
