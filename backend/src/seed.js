// Enhanced seed script with rich mock data for analytics features
import { localStore } from './localStore.js';

// Generate commits with varied patterns for analytics testing
const generateCommits = (repoId, authors, totalCount, pattern = 'consistent') => {
    const commits = [];
    const messages = {
        good: [
            "feat: implement user authentication with JWT tokens",
            "fix: resolve memory leak in data processing module",
            "docs: update API documentation with new endpoints",
            "refactor: extract common utilities into shared module",
            "test: add unit tests for payment processing",
            "perf: optimize database queries for faster loading",
            "feat: add real-time notifications using WebSocket",
            "fix: handle edge case in date formatting",
            "chore: update dependencies to latest versions",
            "feat: implement search functionality with filters",
            "fix: correct validation logic for email fields",
            "docs: add setup instructions to README",
            "feat: create dashboard analytics component",
            "refactor: improve error handling in API routes",
            "test: increase test coverage for auth module"
        ],
        bad: [
            "fix", "update", "changes", "wip", "test", ".", "stuff", "misc",
            "commit", "save", "done", "asdf", "temp", "final", "v2"
        ]
    };

    const now = new Date();
    const projectStart = new Date(now);
    projectStart.setDate(projectStart.getDate() - 60);

    // Distribute authors' contributions
    const authorDistribution = {};
    if (pattern === 'unbalanced') {
        // One author does 80% of work
        authorDistribution[authors[0]] = Math.floor(totalCount * 0.8);
        const remaining = totalCount - authorDistribution[authors[0]];
        for (let i = 1; i < authors.length; i++) {
            authorDistribution[authors[i]] = Math.floor(remaining / (authors.length - 1));
        }
    } else {
        // Balanced distribution
        const perAuthor = Math.floor(totalCount / authors.length);
        authors.forEach(author => {
            authorDistribution[author] = perAuthor;
        });
    }

    // Generate commits based on pattern
    let commitIndex = 0;
    for (const [author, count] of Object.entries(authorDistribution)) {
        for (let i = 0; i < count; i++) {
            let date;
            
            if (pattern === 'cramming') {
                // 70% of commits in last 48 hours
                if (i < count * 0.7) {
                    date = new Date(now);
                    date.setHours(date.getHours() - Math.floor(Math.random() * 48));
                } else {
                    const daysAgo = Math.floor(Math.random() * 58) + 2;
                    date = new Date(now);
                    date.setDate(date.getDate() - daysAgo);
                }
            } else if (pattern === 'consistent') {
                // Evenly spread with some variation
                const daySpread = Math.floor((60 / totalCount) * commitIndex);
                date = new Date(projectStart);
                date.setDate(date.getDate() + daySpread + Math.floor(Math.random() * 3));
            } else {
                // Random distribution
                const daysAgo = Math.floor(Math.random() * 60);
                date = new Date(now);
                date.setDate(date.getDate() - daysAgo);
            }

            date.setHours(Math.floor(Math.random() * 14) + 8); // 8am to 10pm
            date.setMinutes(Math.floor(Math.random() * 60));

            // Determine message quality
            const useGoodMessage = pattern === 'professional' ? 
                Math.random() > 0.1 : // 90% good
                pattern === 'sloppy' ?
                Math.random() > 0.7 : // 30% good
                Math.random() > 0.3;  // 70% good

            const messagePool = useGoodMessage ? messages.good : messages.bad;
            const message = messagePool[Math.floor(Math.random() * messagePool.length)];

            // Simulate lines changed
            const linesChanged = pattern === 'sloppy' && Math.random() > 0.7 ?
                Math.floor(Math.random() * 800) + 500 : // Huge commits
                Math.floor(Math.random() * 200) + 10;   // Normal commits

            commits.push({
                repo_id: repoId,
                sha: `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
                message,
                author,
                commit_date: date.toISOString(),
                lines_changed: linesChanged
            });

            commitIndex++;
        }
    }

    return commits.sort((a, b) => new Date(a.commit_date) - new Date(b.commit_date));
};

export const seedData = () => {
    // Reset the store first
    localStore.reset();

    const mockStudents = [
        {
            name: "Arjun Sharma",
            email: "arjun.sharma@university.edu",
            repositories: [{
                repo_url: "https://github.com/arjunsharma/ecommerce-platform",
                owner: "arjunsharma",
                repo_name: "ecommerce-platform",
                tech_stack: ["react", "next", "typescript", "prisma", "postgresql", "tailwindcss"],
                is_group: false
            }],
            pattern: 'consistent',
            commitCount: 45
        },
        {
            name: "Priya Patel",
            email: "priya.patel@university.edu",
            repositories: [{
                repo_url: "https://github.com/priyapatel/ai-chatbot",
                owner: "priyapatel",
                repo_name: "ai-chatbot",
                tech_stack: ["react", "vite", "express", "mongodb", "openai"],
                is_group: false
            }],
            pattern: 'professional',
            commitCount: 52
        },
        {
            name: "Rahul Verma",
            email: "rahul.verma@university.edu",
            repositories: [{
                repo_url: "https://github.com/rahulverma/task-manager",
                owner: "rahulverma",
                repo_name: "task-manager",
                tech_stack: ["vue", "express", "mongodb", "tailwindcss"],
                is_group: false
            }],
            pattern: 'cramming',
            commitCount: 38
        },
        {
            name: "Sneha Gupta",
            email: "sneha.gupta@university.edu",
            repositories: [{
                repo_url: "https://github.com/snehagupta/portfolio-website",
                owner: "snehagupta",
                repo_name: "portfolio-website",
                tech_stack: ["react", "next", "tailwindcss", "framer-motion"],
                is_group: false
            }],
            pattern: 'consistent',
            commitCount: 32
        },
        {
            name: "Vikram Singh",
            email: "vikram.singh@university.edu",
            repositories: [{
                repo_url: "https://github.com/vikramsingh/social-media-app",
                owner: "vikramsingh",
                repo_name: "social-media-app",
                tech_stack: ["react", "firebase", "redux", "tailwindcss"],
                is_group: true,
                contributors: ["vikramsingh", "teammate1", "teammate2"]
            }],
            pattern: 'unbalanced',
            commitCount: 65
        },
        {
            name: "Ananya Reddy",
            email: "ananya.reddy@university.edu",
            repositories: [{
                repo_url: "https://github.com/ananyareddy/weather-dashboard",
                owner: "ananyareddy",
                repo_name: "weather-dashboard",
                tech_stack: ["react", "vite", "axios", "chart.js"],
                is_group: false
            }],
            pattern: 'sloppy',
            commitCount: 28
        },
        {
            name: "Karthik Kumar",
            email: "karthik.kumar@university.edu",
            repositories: [{
                repo_url: "https://github.com/karthikkumar/recipe-finder",
                owner: "karthikkumar",
                repo_name: "recipe-finder",
                tech_stack: ["angular", "express", "mongodb", "bootstrap"],
                is_group: false
            }],
            pattern: 'random',
            commitCount: 35
        },
        {
            name: "Meera Iyer",
            email: "meera.iyer@university.edu",
            repositories: [{
                repo_url: "https://github.com/meeraiyer/fitness-tracker",
                owner: "meeraiyer",
                repo_name: "fitness-tracker",
                tech_stack: ["react", "express", "postgresql", "prisma", "tailwindcss"],
                is_group: false
            }],
            pattern: 'professional',
            commitCount: 48
        },
        {
            name: "Aditya Joshi",
            email: "aditya.joshi@university.edu",
            repositories: [{
                repo_url: "https://github.com/adityajoshi/blog-platform",
                owner: "adityajoshi",
                repo_name: "blog-platform",
                tech_stack: ["next", "typescript", "prisma", "postgresql", "tailwindcss"],
                is_group: false
            }],
            pattern: 'consistent',
            commitCount: 41
        },
        {
            name: "Divya Nair",
            email: "divya.nair@university.edu",
            repositories: [{
                repo_url: "https://github.com/divyanair/movie-recommender",
                owner: "divyanair",
                repo_name: "movie-recommender",
                tech_stack: ["python", "flask", "pandas", "scikit-learn", "react"],
                is_group: true,
                contributors: ["divyanair", "partner1"]
            }],
            pattern: 'consistent',
            commitCount: 55
        }
    ];

    // Seed students and generate commits
    mockStudents.forEach(studentData => {
        const { pattern, commitCount, ...studentInfo } = studentData;
        const repoData = studentInfo.repositories[0];
        
        // Add student
        const student = localStore.addStudent({
            name: studentInfo.name,
            email: studentInfo.email
        });

        // Add repository with tech stack
        const repo = localStore.addRepository({
            student_id: student.id,
            repo_url: repoData.repo_url,
            owner: repoData.owner,
            repo_name: repoData.repo_name,
            tech_stack: repoData.tech_stack,
            is_group: repoData.is_group || false
        });

        // Generate commits
        const authors = repoData.contributors || [repoData.owner];
        const commits = generateCommits(repo.id, authors, commitCount, pattern);
        localStore.addCommits(commits);
    });

    // Print summary
    const summary = localStore.getSummary();
    console.log(`✅ Mock data seeded successfully!`);
    console.log(`   📚 Students: ${summary.students}`);
    console.log(`   📦 Repositories: ${summary.repositories}`);
    console.log(`   ⚡ Total Commits: ${summary.commits}`);
    console.log(`   📈 Active (7 days): ${summary.active}`);
};
