// Local in-memory data store for testing without Supabase

let students = [];
let repositories = [];
let commits = [];
let idCounters = { students: 1, repositories: 1, commits: 1 };

export const localStore = {
    // Students
    getStudents: () => students,
    getStudentById: (id) => students.find(s => s.id === id),
    addStudent: (student) => {
        const newStudent = {
            ...student,
            id: idCounters.students++,
            created_at: new Date().toISOString()
        };
        students.push(newStudent);
        return newStudent;
    },
    deleteStudent: (id) => {
        const index = students.findIndex(s => s.id === id);
        if (index > -1) {
            students.splice(index, 1);
            // Also delete associated repositories and commits
            const repoIds = repositories.filter(r => r.student_id === id).map(r => r.id);
            repositories = repositories.filter(r => r.student_id !== id);
            commits = commits.filter(c => !repoIds.includes(c.repo_id));
            return true;
        }
        return false;
    },

    // Repositories
    getRepositories: () => repositories,
    getRepositoryById: (id) => repositories.find(r => r.id === id),
    getRepositoriesByStudentId: (studentId) => repositories.filter(r => r.student_id === studentId),
    addRepository: (repo) => {
        const newRepo = {
            ...repo,
            id: idCounters.repositories++,
            created_at: new Date().toISOString()
        };
        repositories.push(newRepo);
        return newRepo;
    },

    // Commits
    getCommits: () => commits,
    getCommitsByRepoId: (repoId) => commits.filter(c => c.repo_id === repoId),
    addCommit: (commit) => {
        // Check if commit with same SHA exists
        const existing = commits.find(c => c.sha === commit.sha && c.repo_id === commit.repo_id);
        if (existing) return existing;

        const newCommit = {
            ...commit,
            id: idCounters.commits++,
            created_at: new Date().toISOString()
        };
        commits.push(newCommit);
        return newCommit;
    },
    addCommits: (newCommits) => {
        const added = [];
        for (const commit of newCommits) {
            const result = localStore.addCommit(commit);
            added.push(result);
        }
        return added;
    },

    // Summary stats
    getSummary: () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        const activeCommits = commits.filter(c => new Date(c.commit_date) >= sevenDaysAgo);

        return {
            students: students.length,
            repositories: repositories.length,
            commits: commits.length,
            active: activeCommits.length
        };
    },

    // Students with repositories (joined)
    getStudentsWithRepos: () => {
        return students.map(student => ({
            ...student,
            repositories: repositories
                .filter(r => r.student_id === student.id)
                .map(repo => {
                    const repoCommits = commits.filter(c => c.repo_id === repo.id);
                    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
                    const recentCommits = repoCommits.filter(c => new Date(c.commit_date) >= sevenDaysAgo);
                    const lastCommit = repoCommits.sort((a, b) =>
                        new Date(b.commit_date) - new Date(a.commit_date)
                    )[0];

                    return {
                        ...repo,
                        insights: {
                            total_commits: repoCommits.length,
                            recent_commits: recentCommits.length,
                            last_commit_date: lastCommit?.commit_date || null
                        }
                    };
                })
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // Leaderboard
    getLeaderboard: () => {
        return repositories.map(repo => {
            const student = students.find(s => s.id === repo.student_id);
            const repoCommits = commits.filter(c => c.repo_id === repo.id);
            return {
                id: repo.id,
                name: `${repo.owner}/${repo.repo_name}`,
                student_name: student?.name || 'Unknown',
                commit_count: repoCommits.length
            };
        }).sort((a, b) => b.commit_count - a.commit_count).slice(0, 10);
    },

    // Contributors for a repo
    getContributors: (repoId) => {
        const repoCommits = commits.filter(c => c.repo_id === repoId);
        const contributorMap = {};

        repoCommits.forEach(commit => {
            const author = commit.author || 'Unknown';
            if (!contributorMap[author]) {
                contributorMap[author] = 0;
            }
            contributorMap[author]++;
        });

        const total = repoCommits.length;
        const contributors = Object.entries(contributorMap).map(([author, count]) => ({
            author,
            commit_count: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        })).sort((a, b) => b.commit_count - a.commit_count);

        // Timeline (last 30 days) with commits_by_author
        const timelineMap = {};
        repoCommits.forEach(commit => {
            const date = commit.commit_date.split('T')[0]; // Get date part only
            const author = commit.author || "Unknown";

            if (!timelineMap[date]) {
                timelineMap[date] = {};
            }
            if (!timelineMap[date][author]) {
                timelineMap[date][author] = 0;
            }
            timelineMap[date][author]++;
        });

        // Convert timeline map to array
        const timeline = Object.entries(timelineMap).map(([date, commits_by_author]) => ({
            date,
            commits_by_author
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        return { contributors, timeline, total_commits: total };
    },

    // Reset store (for testing)
    reset: () => {
        students = [];
        repositories = [];
        commits = [];
        idCounters = { students: 1, repositories: 1, commits: 1 };
    },

    // Seed with data
    seed: (data) => {
        if (data.students) {
            data.students.forEach(s => {
                const student = localStore.addStudent(s);
                if (s.repositories) {
                    s.repositories.forEach(r => {
                        const repo = localStore.addRepository({ ...r, student_id: student.id });
                        if (r.commits) {
                            r.commits.forEach(c => {
                                localStore.addCommit({ ...c, repo_id: repo.id });
                            });
                        }
                    });
                }
            });
        }
    }
};

export default localStore;
