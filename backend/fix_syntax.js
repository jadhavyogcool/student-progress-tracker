import fs from 'fs';

let text = fs.readFileSync('src/routes.js', 'utf-8');

text = text.replace('}\\n\\n// Fetch all data in parallel to avoid N+1 query performance issues\\nasync function getGlobalData() {', '}\\n\\n// Fetch all data in parallel to avoid N+1 query performance issues\\nasync function getGlobalData() {');

// wait, the literal string has a backslash n.
// I will just use regex to replace everything from `async function fetchAllRecords` to `if (commitsRes.error) throw commitsRes.error;` with the proper clean code.

const startToken = 'async function fetchAllRecords(table, selectQuery) {';
const endToken = '    if (commitsRes.error) throw commitsRes.error;';

const startIndex = text.indexOf(startToken);
const endIndex = text.indexOf(endToken) + endToken.length;

if (startIndex !== -1 && endIndex !== -1) {
    const cleanLogic = `async function fetchAllRecords(table, selectQuery) {
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
}

// Fetch all data in parallel to avoid N+1 query performance issues
async function getGlobalData() {
    const [studentsRes, reposRes, commitsRes] = await Promise.all([
        fetchAllRecords("students", "id, name, email, created_at").then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
        fetchAllRecords("repositories", "id, student_id, repo_name, owner, repo_url").then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
        fetchAllRecords("commits", "repo_id, commit_date, author, sha").then(data => ({ data, error: null })).catch(error => ({ data: null, error }))
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (reposRes.error) throw reposRes.error;
    if (commitsRes.error) throw commitsRes.error;`;

    text = text.substring(0, startIndex) + cleanLogic + text.substring(endIndex);
    fs.writeFileSync('src/routes.js', text, 'utf-8');
    console.log('Fixed routes.js syntax and logic');
} else {
    console.log('Could not find tokens');
}
