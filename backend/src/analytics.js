// Advanced Analytics Module for Student Progress Tracker
import { localStore } from './localStore.js';

/**
 * Calculate Gini Coefficient for contribution inequality
 * 0 = perfect equality, 1 = maximum inequality
 */
export const calculateGiniCoefficient = (contributions) => {
    if (!contributions || contributions.length === 0) return 0;
    if (contributions.length === 1) return 0;

    const sorted = [...contributions].sort((a, b) => a - b);
    const n = sorted.length;
    const total = sorted.reduce((sum, val) => sum + val, 0);
    
    if (total === 0) return 0;

    let numerator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    return numerator / (n * total);
};

/**
 * Analyze commit message quality
 */
export const analyzeCommitQuality = (commits) => {
    const badPatterns = [
        /^fix$/i, /^update$/i, /^changes$/i, /^wip$/i, /^test$/i,
        /^\.+$/, /^asdf/i, /^temp/i, /^stuff/i, /^misc/i,
        /^commit$/i, /^save$/i, /^done$/i
    ];

    let goodMessages = 0;
    let badMessages = 0;
    let hugeCommits = 0;
    let totalLinesChanged = 0;

    commits.forEach(commit => {
        const message = commit.message || '';
        const isBad = badPatterns.some(pattern => pattern.test(message.trim())) || message.length < 5;
        
        if (isBad) {
            badMessages++;
        } else {
            goodMessages++;
        }

        // Simulate lines changed (in real implementation, this would come from GitHub API)
        const linesChanged = commit.lines_changed || Math.floor(Math.random() * 300);
        totalLinesChanged += linesChanged;
        
        if (linesChanged > 500) {
            hugeCommits++;
        }
    });

    const total = commits.length;
    const messageQualityScore = total > 0 ? (goodMessages / total) * 100 : 0;
    const commitSizeScore = total > 0 ? Math.max(0, 100 - (hugeCommits / total) * 100) : 100;
    
    // Calculate overall professionalism grade
    const overallScore = (messageQualityScore * 0.6) + (commitSizeScore * 0.4);
    
    let grade;
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';

    return {
        grade,
        overallScore: Math.round(overallScore),
        messageQualityScore: Math.round(messageQualityScore),
        commitSizeScore: Math.round(commitSizeScore),
        goodMessages,
        badMessages,
        hugeCommits,
        totalCommits: total,
        avgLinesPerCommit: total > 0 ? Math.round(totalLinesChanged / total) : 0
    };
};

/**
 * Calculate consistency score and detect procrastination
 */
export const analyzeConsistency = (commits, projectDuration = 60) => {
    if (!commits || commits.length === 0) {
        return {
            consistencyScore: 0,
            isCramming: false,
            crammingPercentage: 0,
            heatmapData: [],
            commitsByDay: {},
            variance: 0
        };
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - projectDuration);

    // Create daily commit counts
    const dailyCounts = {};
    const heatmapData = [];
    
    for (let i = 0; i < projectDuration; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyCounts[dateStr] = 0;
    }

    // Count commits per day
    commits.forEach(commit => {
        if (commit.commit_date) {
            const dateStr = commit.commit_date.split('T')[0];
            if (dailyCounts.hasOwnProperty(dateStr)) {
                dailyCounts[dateStr]++;
            }
        }
    });

    // Build heatmap data
    const values = Object.values(dailyCounts);
    const maxCount = Math.max(...values, 1);
    
    Object.entries(dailyCounts).forEach(([date, count]) => {
        heatmapData.push({
            date,
            count,
            level: Math.ceil((count / maxCount) * 4)
        });
    });

    // Calculate variance (lower is better consistency)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Check for cramming (>50% commits in last 48 hours)
    const last48Hours = new Date(now);
    last48Hours.setHours(last48Hours.getHours() - 48);
    
    const recentCommits = commits.filter(c => new Date(c.commit_date) >= last48Hours).length;
    const crammingPercentage = commits.length > 0 ? (recentCommits / commits.length) * 100 : 0;
    const isCramming = crammingPercentage > 50;

    // Calculate consistency score (0-100)
    // Lower variance = higher consistency
    const maxExpectedVariance = 10;
    const varianceScore = Math.max(0, 100 - (variance / maxExpectedVariance) * 100);
    const crammingPenalty = isCramming ? 30 : 0;
    const consistencyScore = Math.max(0, Math.min(100, varianceScore - crammingPenalty));

    // Days with activity
    const activeDays = values.filter(v => v > 0).length;
    const activityRate = (activeDays / projectDuration) * 100;

    return {
        consistencyScore: Math.round(consistencyScore),
        isCramming,
        crammingPercentage: Math.round(crammingPercentage),
        heatmapData,
        commitsByDay: dailyCounts,
        variance: Math.round(variance * 100) / 100,
        activeDays,
        activityRate: Math.round(activityRate),
        recentCommits,
        totalCommits: commits.length
    };
};

/**
 * Analyze tech stack from package.json / requirements.txt data
 */
export const analyzeTechStack = (repositories) => {
    const techCounts = {};
    const categoryMap = {
        // Frontend
        'react': { name: 'React', category: 'Frontend' },
        'vue': { name: 'Vue.js', category: 'Frontend' },
        'angular': { name: 'Angular', category: 'Frontend' },
        'next': { name: 'Next.js', category: 'Frontend' },
        'svelte': { name: 'Svelte', category: 'Frontend' },
        'tailwindcss': { name: 'Tailwind CSS', category: 'Frontend' },
        'bootstrap': { name: 'Bootstrap', category: 'Frontend' },
        
        // Backend
        'express': { name: 'Express.js', category: 'Backend' },
        'fastapi': { name: 'FastAPI', category: 'Backend' },
        'django': { name: 'Django', category: 'Backend' },
        'flask': { name: 'Flask', category: 'Backend' },
        'nestjs': { name: 'NestJS', category: 'Backend' },
        
        // Database
        'mongodb': { name: 'MongoDB', category: 'Database' },
        'mongoose': { name: 'MongoDB', category: 'Database' },
        'pg': { name: 'PostgreSQL', category: 'Database' },
        'mysql': { name: 'MySQL', category: 'Database' },
        'prisma': { name: 'Prisma', category: 'Database' },
        'sequelize': { name: 'Sequelize', category: 'Database' },
        'sqlite': { name: 'SQLite', category: 'Database' },
        'supabase': { name: 'Supabase', category: 'Database' },
        'firebase': { name: 'Firebase', category: 'Database' },
        
        // Tools
        'typescript': { name: 'TypeScript', category: 'Language' },
        'vite': { name: 'Vite', category: 'Build Tool' },
        'webpack': { name: 'Webpack', category: 'Build Tool' },
        'jest': { name: 'Jest', category: 'Testing' },
        'axios': { name: 'Axios', category: 'HTTP Client' },
        'redux': { name: 'Redux', category: 'State Management' },
        'zustand': { name: 'Zustand', category: 'State Management' },
        
        // Python
        'pandas': { name: 'Pandas', category: 'Data Science' },
        'numpy': { name: 'NumPy', category: 'Data Science' },
        'tensorflow': { name: 'TensorFlow', category: 'ML/AI' },
        'pytorch': { name: 'PyTorch', category: 'ML/AI' },
        'scikit-learn': { name: 'Scikit-learn', category: 'ML/AI' },
    };

    repositories.forEach(repo => {
        if (repo.tech_stack && Array.isArray(repo.tech_stack)) {
            repo.tech_stack.forEach(tech => {
                const techLower = tech.toLowerCase();
                const techInfo = categoryMap[techLower] || { name: tech, category: 'Other' };
                const key = techInfo.name;
                
                if (!techCounts[key]) {
                    techCounts[key] = { count: 0, category: techInfo.category };
                }
                techCounts[key].count++;
            });
        }
    });

    const totalRepos = repositories.length;
    const techArray = Object.entries(techCounts)
        .map(([name, data]) => ({
            name,
            count: data.count,
            category: data.category,
            percentage: Math.round((data.count / totalRepos) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    // Group by category
    const byCategory = {};
    techArray.forEach(tech => {
        if (!byCategory[tech.category]) {
            byCategory[tech.category] = [];
        }
        byCategory[tech.category].push(tech);
    });

    return {
        technologies: techArray,
        byCategory,
        totalRepositories: totalRepos
    };
};

/**
 * Get contribution balance for a repository (group project detection)
 */
export const getContributionBalance = (repoId) => {
    const data = localStore.getContributors(repoId);
    
    if (!data || !data.contributors || data.contributors.length === 0) {
        return null;
    }

    const contributions = data.contributors.map(c => c.commit_count);
    const gini = calculateGiniCoefficient(contributions);
    
    // Find dominant contributor
    const maxContributor = data.contributors[0];
    const hasSlacker = maxContributor && maxContributor.percentage > 80;
    
    // Calculate balance status
    let balanceStatus;
    if (gini < 0.2) balanceStatus = 'excellent';
    else if (gini < 0.4) balanceStatus = 'good';
    else if (gini < 0.6) balanceStatus = 'moderate';
    else balanceStatus = 'poor';

    return {
        ...data,
        giniCoefficient: Math.round(gini * 100) / 100,
        balanceStatus,
        hasSlackerWarning: hasSlacker,
        dominantContributor: maxContributor ? {
            name: maxContributor.author,
            percentage: maxContributor.percentage
        } : null
    };
};

/**
 * Get all analytics for a repository
 */
export const getRepositoryAnalytics = (repoId) => {
    const commits = localStore.getCommitsByRepoId(repoId);
    const repo = localStore.getRepositoryById(repoId);
    
    if (!repo) return null;

    const codeQuality = analyzeCommitQuality(commits);
    const consistency = analyzeConsistency(commits);
    const contributionBalance = getContributionBalance(repoId);

    return {
        repository: repo,
        codeQuality,
        consistency,
        contributionBalance,
        totalCommits: commits.length
    };
};

/**
 * Get class-wide analytics summary
 */
export const getClassAnalytics = () => {
    const students = localStore.getStudentsWithRepos();
    const allRepos = localStore.getRepositories();
    const allCommits = localStore.getCommits();
    const techStack = analyzeTechStack(allRepos);
    
    // Aggregate metrics
    let totalConsistencyScore = 0;
    let totalQualityScore = 0;
    let crammingCount = 0;
    let slackerWarnings = 0;
    const studentAnalytics = [];
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const crammingAlerts = [];

    students.forEach(student => {
        if (student.repositories) {
            student.repositories.forEach(repo => {
                const commits = localStore.getCommitsByRepoId(repo.id);
                const quality = analyzeCommitQuality(commits);
                const consistency = analyzeConsistency(commits);
                const balance = getContributionBalance(repo.id);

                totalConsistencyScore += consistency.consistencyScore;
                totalQualityScore += quality.overallScore;
                
                // Count grades
                if (gradeDistribution.hasOwnProperty(quality.grade)) {
                    gradeDistribution[quality.grade]++;
                }
                
                if (consistency.isCramming) {
                    crammingCount++;
                    crammingAlerts.push({
                        student: student.name,
                        repo: repo.repo_name,
                        percentage: consistency.cramming_percentage || Math.round(consistency.crammingPercentage) || 50
                    });
                }
                if (balance?.hasSlackerWarning) slackerWarnings++;

                studentAnalytics.push({
                    studentId: student.id,
                    studentName: student.name,
                    repoId: repo.id,
                    repoName: `${repo.owner}/${repo.repo_name}`,
                    consistencyScore: consistency.consistencyScore,
                    qualityGrade: quality.grade,
                    qualityScore: quality.overallScore,
                    isCramming: consistency.isCramming,
                    hasSlackerWarning: balance?.hasSlackerWarning || false,
                    totalCommits: commits.length
                });
            });
        }
    });

    // Generate class-wide heatmap from all commits
    const heatmap = generateClassHeatmap(allCommits);

    const repoCount = studentAnalytics.length;
    const totalCommits = allCommits.length;
    
    return {
        summary: {
            avgConsistencyScore: repoCount > 0 ? Math.round(totalConsistencyScore / repoCount) : 0,
            avgQualityScore: repoCount > 0 ? Math.round(totalQualityScore / repoCount) : 0,
            crammingAlerts: crammingCount,
            slackerWarnings,
            totalStudents: students.length,
            totalRepositories: repoCount
        },
        total_students: students.length,
        total_repos: repoCount,
        total_commits: totalCommits,
        avg_commits_per_repo: repoCount > 0 ? Math.round(totalCommits / repoCount * 10) / 10 : 0,
        grade_distribution: gradeDistribution,
        cramming_alerts: crammingAlerts,
        heatmap,
        techStack,
        studentAnalytics: studentAnalytics.sort((a, b) => b.consistencyScore - a.consistencyScore)
    };
};

/**
 * Generate heatmap data from commits
 */
const generateClassHeatmap = (commits) => {
    const heatmapData = [];
    const now = new Date();
    
    // Generate 12 weeks of data
    for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 7; day++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() - (11 - week) * 7 - (6 - day));
            
            const dayCommits = commits.filter(c => {
                const commitDate = new Date(c.commit_date);
                return commitDate.toDateString() === targetDate.toDateString();
            }).length;
            
            heatmapData.push({
                week,
                day,
                count: dayCommits,
                date: targetDate.toISOString()
            });
        }
    }
    
    return heatmapData;
};

/**
 * Milestones tracking
 */
let milestones = [
    { id: 1, name: 'Design Phase', date: new Date(Date.now() - 45 * 86400000).toISOString(), required_commits: 5 },
    { id: 2, name: 'Alpha Release', date: new Date(Date.now() - 20 * 86400000).toISOString(), required_commits: 15 },
    { id: 3, name: 'Beta Release', date: new Date(Date.now() + 10 * 86400000).toISOString(), required_commits: 30 }
];

export const getMilestones = () => milestones;

export const setMilestones = (newMilestones) => {
    milestones = newMilestones;
    return milestones;
};

export const getMilestoneProgress = (repoId) => {
    const commits = localStore.getCommitsByRepoId(repoId);
    
    return milestones.map(milestone => {
        const milestoneDate = new Date(milestone.date);
        const commitsBeforeMilestone = commits.filter(c => 
            new Date(c.commit_date) <= milestoneDate
        ).length;
        
        const progress = Math.min(100, (commitsBeforeMilestone / milestone.required_commits) * 100);
        const isMet = commitsBeforeMilestone >= milestone.required_commits;
        const isPast = milestoneDate < new Date();
        
        return {
            ...milestone,
            commitsAchieved: commitsBeforeMilestone,
            progress: Math.round(progress),
            isMet,
            isPast,
            status: isPast ? (isMet ? 'completed' : 'missed') : (isMet ? 'ahead' : 'in-progress')
        };
    });
};

/**
 * Generate AI summary (mock - in production, use OpenAI/Gemini)
 */
export const generateAISummary = async (repoId) => {
    const commits = localStore.getCommitsByRepoId(repoId);
    const repo = localStore.getRepositoryById(repoId);
    const student = localStore.getStudents().find(s => s.id === repo?.student_id);
    
    if (!repo || commits.length === 0) {
        return { 
            summary: "No commits found for this repository.",
            patterns: [],
            recommendations: ["Start committing code to build your project history."]
        };
    }

    // Analyze commit messages to generate summary
    const recentCommits = commits
        .sort((a, b) => new Date(b.commit_date) - new Date(a.commit_date))
        .slice(0, 50);

    const messageLower = recentCommits.map(c => c.message.toLowerCase()).join(' ');
    
    // Simple keyword analysis (in production, send to LLM)
    const topics = [];
    if (messageLower.includes('auth') || messageLower.includes('login')) topics.push('authentication');
    if (messageLower.includes('ui') || messageLower.includes('component') || messageLower.includes('design')) topics.push('UI/frontend');
    if (messageLower.includes('api') || messageLower.includes('endpoint') || messageLower.includes('route')) topics.push('API development');
    if (messageLower.includes('database') || messageLower.includes('query') || messageLower.includes('model')) topics.push('database');
    if (messageLower.includes('test')) topics.push('testing');
    if (messageLower.includes('fix') || messageLower.includes('bug')) topics.push('bug fixes');
    if (messageLower.includes('refactor') || messageLower.includes('clean')) topics.push('code refactoring');
    if (messageLower.includes('performance') || messageLower.includes('optim')) topics.push('performance optimization');
    if (messageLower.includes('doc') || messageLower.includes('readme')) topics.push('documentation');
    
    const consistency = analyzeConsistency(commits);
    const quality = analyzeCommitQuality(commits);
    
    // Generate patterns based on analysis
    const patterns = [];
    
    // Commit frequency pattern
    if (consistency.avg_commits_per_day > 3) {
        patterns.push(`High commit frequency: averaging ${consistency.avg_commits_per_day.toFixed(1)} commits per active day`);
    } else if (consistency.avg_commits_per_day > 1) {
        patterns.push(`Moderate commit frequency: averaging ${consistency.avg_commits_per_day.toFixed(1)} commits per active day`);
    } else {
        patterns.push(`Low commit frequency: averaging ${consistency.avg_commits_per_day.toFixed(1)} commits per active day`);
    }
    
    // Work schedule pattern
    const hourlyDistribution = {};
    commits.forEach(c => {
        const hour = new Date(c.commit_date).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyDistribution).sort((a, b) => b[1] - a[1])[0];
    if (peakHour) {
        const hourNum = parseInt(peakHour[0]);
        const timeOfDay = hourNum < 12 ? 'morning' : hourNum < 17 ? 'afternoon' : hourNum < 21 ? 'evening' : 'night';
        patterns.push(`Most active during ${timeOfDay} hours (peak: ${hourNum}:00)`);
    }
    
    // Topic patterns
    if (topics.length > 0) {
        patterns.push(`Primary focus areas: ${topics.slice(0, 3).join(', ')}`);
    }
    
    // Quality pattern
    if ((quality.messageQualityScore || quality.overallScore || 0) > 80) {
        patterns.push('Excellent commit message quality with detailed descriptions');
    } else if ((quality.messageQualityScore || quality.overallScore || 0) > 60) {
        patterns.push('Good commit messages with room for improvement');
    } else {
        patterns.push('Many commits have brief or unclear messages');
    }
    
    // Cramming pattern
    if (consistency.isCramming) {
        patterns.push(`Cramming detected: ${consistency.cramming_percentage || 50}% of commits in last 48 hours`);
    }
    
    // Generate recommendations
    const recommendations = [];
    
    if (quality.grade === 'D' || quality.grade === 'F') {
        recommendations.push('Use more descriptive commit messages following conventional commit format (feat:, fix:, docs:, etc.)');
    }
    
    if (consistency.isCramming) {
        recommendations.push('Spread your work more evenly throughout the project timeline to avoid last-minute cramming');
    }
    
    if (consistency.active_days < 5 && commits.length > 10) {
        recommendations.push('Try to commit smaller changes more frequently rather than large batches');
    }
    
    if (!topics.includes('testing')) {
        recommendations.push('Consider adding unit tests to improve code reliability');
    }
    
    if (!topics.includes('documentation')) {
        recommendations.push('Add documentation commits to explain your code and setup instructions');
    }
    
    if (quality.avg_message_length < 20) {
        recommendations.push('Write longer, more detailed commit messages explaining the "why" behind changes');
    }
    
    // Tech-specific recommendations
    if (repo.tech_stack?.includes('React') && !topics.includes('testing')) {
        recommendations.push('Consider adding React Testing Library for component tests');
    }
    
    // Add at least one positive recommendation
    if (recommendations.length === 0 || quality.grade === 'A') {
        recommendations.push('Great work! Keep maintaining this quality throughout the project');
    }
    
    // Generate mock AI summary
    const topicStr = topics.length > 0 ? topics.slice(0, 3).join(', ') : 'general development';
    const crammingNote = consistency.isCramming ? 
        'However, there is evidence of cramming behavior with majority of commits in the last 48 hours.' : 
        'The work appears to be spread consistently over the project duration.';
    
    const qualityNote = quality.grade === 'A' || quality.grade === 'B' ?
        'Commit messages are descriptive and follow good practices.' :
        'Commit message quality could be improved - consider using more descriptive messages.';

    const summary = `${student?.name || 'Student'} has been focusing primarily on ${topicStr}, with ${commits.length} total commits across ${consistency.active_days} active days. ${crammingNote} ${qualityNote}`;
    
    return {
        summary,
        patterns,
        recommendations,
        topics,
        stats: {
            totalCommits: commits.length,
            activeDays: consistency.active_days || 0,
            avgCommitsPerDay: consistency.avg_commits_per_day || 0,
            qualityGrade: quality.grade || 'N/A',
            meaningfulCommits: quality.messageQualityScore || quality.overallScore || 0
        },
        generatedAt: new Date().toISOString()
    };
};

/**
 * Calculate streak data for a student
 */
export const calculateStreaks = (commits) => {
    if (!commits || commits.length === 0) {
        return { currentStreak: 0, longestStreak: 0, streakDates: [] };
    }

    // Get unique commit dates
    const commitDates = [...new Set(commits.map(c => {
        const d = new Date(c.commit_date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }))].sort();

    if (commitDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0, streakDates: [] };
    }

    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;
    let streakStart = commitDates[0];
    let longestStreakStart = commitDates[0];
    let longestStreakEnd = commitDates[0];

    for (let i = 1; i < commitDates.length; i++) {
        const prev = new Date(commitDates[i - 1]);
        const curr = new Date(commitDates[i]);
        const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
                longestStreakStart = streakStart;
                longestStreakEnd = commitDates[i];
            }
        } else {
            tempStreak = 1;
            streakStart = commitDates[i];
        }
    }

    // Calculate current streak (from today going back)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

    // Check if last commit was today or yesterday
    const lastCommitDate = commitDates[commitDates.length - 1];
    if (lastCommitDate !== todayStr && lastCommitDate !== yesterdayStr) {
        currentStreak = 0;
    } else {
        currentStreak = 1;
        for (let i = commitDates.length - 2; i >= 0; i--) {
            const curr = new Date(commitDates[i + 1]);
            const prev = new Date(commitDates[i]);
            const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    return {
        currentStreak,
        longestStreak,
        longestStreakStart,
        longestStreakEnd,
        totalActiveDays: commitDates.length,
        streakDates: commitDates.slice(-30) // Last 30 days for display
    };
};

/**
 * Generate leaderboard rankings
 */
export const getLeaderboard = (period = 'all') => {
    const students = localStore.getStudents();
    const repos = localStore.getRepositories();
    const allCommits = localStore.getCommits();

    const now = new Date();
    let startDate = new Date(0); // Beginning of time

    if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const leaderboardData = students.map(student => {
        const studentRepos = repos.filter(r => r.student_id === student.id);
        const repoIds = studentRepos.map(r => r.id);
        
        let commits = allCommits.filter(c => repoIds.includes(c.repo_id));
        if (period !== 'all') {
            commits = commits.filter(c => new Date(c.commit_date) >= startDate);
        }

        const quality = analyzeCommitQuality(commits);
        const consistency = analyzeConsistency(commits);
        const streaks = calculateStreaks(commits);

        // Calculate overall score (weighted)
        const commitScore = Math.min(commits.length * 2, 100); // Max 100 points
        const qualityScore = quality.meaningful_percentage;
        const consistencyScore = Math.min(consistency.active_days * 5, 100);
        const streakScore = Math.min(streaks.currentStreak * 10, 50);

        const overallScore = Math.round(
            commitScore * 0.3 +
            qualityScore * 0.3 +
            consistencyScore * 0.25 +
            streakScore * 0.15
        );

        return {
            student_id: student.id,
            name: student.name,
            email: student.email,
            totalCommits: commits.length,
            qualityGrade: quality.grade,
            qualityScore: quality.meaningful_percentage,
            activeDays: consistency.active_days,
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            overallScore,
            repoCount: studentRepos.length
        };
    });

    // Sort by overall score
    leaderboardData.sort((a, b) => b.overallScore - a.overallScore);

    // Add ranks
    leaderboardData.forEach((item, index) => {
        item.rank = index + 1;
        // Calculate trend (mock for now - would compare with previous period)
        item.trend = index < 3 ? 'up' : index > leaderboardData.length - 3 ? 'down' : 'stable';
    });

    return {
        period,
        updatedAt: new Date().toISOString(),
        rankings: leaderboardData,
        topPerformers: leaderboardData.slice(0, 3),
        stats: {
            totalStudents: students.length,
            avgScore: Math.round(leaderboardData.reduce((sum, s) => sum + s.overallScore, 0) / leaderboardData.length) || 0,
            totalCommits: leaderboardData.reduce((sum, s) => sum + s.totalCommits, 0)
        }
    };
};

/**
 * Compare two students side by side
 */
export const compareStudents = (studentId1, studentId2) => {
    const students = localStore.getStudents();
    const repos = localStore.getRepositories();
    const allCommits = localStore.getCommits();

    const getStudentData = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;

        const studentRepos = repos.filter(r => r.student_id === studentId);
        const repoIds = studentRepos.map(r => r.id);
        const commits = allCommits.filter(c => repoIds.includes(c.repo_id));

        const quality = analyzeCommitQuality(commits);
        const consistency = analyzeConsistency(commits);
        const streaks = calculateStreaks(commits);
        
        // Get tech stack from repos, not commits
        let techStackList = [];
        studentRepos.forEach(repo => {
            if (repo.tech_stack && Array.isArray(repo.tech_stack)) {
                techStackList = [...techStackList, ...repo.tech_stack];
            }
        });
        // Deduplicate
        techStackList = [...new Set(techStackList)];

        // Work pattern analysis
        const hourCounts = Array(24).fill(0);
        commits.forEach(c => {
            const hour = new Date(c.commit_date).getHours();
            hourCounts[hour]++;
        });
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const workPattern = peakHour < 12 ? 'Morning Person' : peakHour < 18 ? 'Afternoon Worker' : 'Night Owl';

        return {
            id: studentId,
            name: student.name,
            email: student.email,
            metrics: {
                totalCommits: commits.length,
                repoCount: studentRepos.length,
                activeDays: consistency.active_days || 0,
                avgCommitsPerDay: consistency.avg_commits_per_day || 0,
                qualityGrade: quality.grade || 'N/A',
                qualityScore: quality.overallScore || 0,
                currentStreak: streaks.currentStreak || 0,
                longestStreak: streaks.longestStreak || 0
            },
            patterns: {
                workPattern,
                peakHour,
                isCramming: consistency.isCramming || false,
                avgGapDays: consistency.avg_gap_days || 0
            },
            techStack: techStackList.slice(0, 5),
            strengths: [],
            weeklyActivity: consistency.heatmapData?.slice(-7) || []
        };
    };

    const student1Data = getStudentData(parseInt(studentId1));
    const student2Data = getStudentData(parseInt(studentId2));

    if (!student1Data || !student2Data) {
        return { error: 'One or both students not found' };
    }

    // Determine strengths
    if (student1Data.metrics.totalCommits > student2Data.metrics.totalCommits) {
        student1Data.strengths.push('More commits');
    } else if (student2Data.metrics.totalCommits > student1Data.metrics.totalCommits) {
        student2Data.strengths.push('More commits');
    }

    if (student1Data.metrics.qualityScore > student2Data.metrics.qualityScore) {
        student1Data.strengths.push('Better commit quality');
    } else if (student2Data.metrics.qualityScore > student1Data.metrics.qualityScore) {
        student2Data.strengths.push('Better commit quality');
    }

    if (student1Data.metrics.currentStreak > student2Data.metrics.currentStreak) {
        student1Data.strengths.push('Higher streak');
    } else if (student2Data.metrics.currentStreak > student1Data.metrics.currentStreak) {
        student2Data.strengths.push('Higher streak');
    }

    if (student1Data.metrics.activeDays > student2Data.metrics.activeDays) {
        student1Data.strengths.push('More consistent');
    } else if (student2Data.metrics.activeDays > student1Data.metrics.activeDays) {
        student2Data.strengths.push('More consistent');
    }

    return {
        student1: student1Data,
        student2: student2Data,
        comparedAt: new Date().toISOString()
    };
};

/**
 * Get progress timeline for a student
 */
export const getProgressTimeline = (studentId) => {
    const students = localStore.getStudents();
    const repos = localStore.getRepositories();
    const allCommits = localStore.getCommits();

    const student = students.find(s => s.id === parseInt(studentId));
    if (!student) return { error: 'Student not found' };

    const studentRepos = repos.filter(r => r.student_id === student.id);
    const repoIds = studentRepos.map(r => r.id);
    const commits = allCommits.filter(c => repoIds.includes(c.repo_id));

    if (commits.length === 0) {
        return { student, timeline: [], milestones: [] };
    }

    // Sort commits by date
    commits.sort((a, b) => new Date(a.commit_date) - new Date(b.commit_date));

    // Generate weekly timeline
    const weeklyData = [];
    const startDate = new Date(commits[0].commit_date);
    const endDate = new Date();
    
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week

    while (currentDate <= endDate) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekCommits = commits.filter(c => {
            const d = new Date(c.commit_date);
            return d >= currentDate && d <= weekEnd;
        });

        const quality = analyzeCommitQuality(weekCommits);

        weeklyData.push({
            weekStart: currentDate.toISOString(),
            weekEnd: weekEnd.toISOString(),
            commits: weekCommits.length,
            cumulativeCommits: commits.filter(c => new Date(c.commit_date) <= weekEnd).length,
            qualityGrade: quality.grade || 'N/A',
            topics: weekCommits.slice(0, 3).map(c => c.message?.split(' ')[0] || '').filter(Boolean)
        });

        currentDate.setDate(currentDate.getDate() + 7);
    }

    // Auto-generate milestones based on commit count
    const milestoneMarkers = [];
    const totalCommits = commits.length;
    
    [10, 25, 50, 100].forEach(threshold => {
        if (totalCommits >= threshold) {
            const milestone = commits[threshold - 1];
            milestoneMarkers.push({
                type: 'commits',
                threshold,
                achievedAt: milestone.commit_date,
                label: `${threshold} Commits!`
            });
        }
    });

    // First commit milestone
    milestoneMarkers.unshift({
        type: 'first',
        threshold: 1,
        achievedAt: commits[0].commit_date,
        label: 'First Commit'
    });

    return {
        student: { id: student.id, name: student.name },
        timeline: weeklyData,
        milestones: milestoneMarkers,
        summary: {
            totalWeeks: weeklyData.length,
            totalCommits,
            avgCommitsPerWeek: Math.round(totalCommits / weeklyData.length * 10) / 10
        }
    };
};

/**
 * Generate badges/achievements for a student
 */
export const getStudentBadges = (studentId) => {
    const students = localStore.getStudents();
    const repos = localStore.getRepositories();
    const allCommits = localStore.getCommits();

    const student = students.find(s => s.id === parseInt(studentId));
    if (!student) return { error: 'Student not found' };

    const studentRepos = repos.filter(r => r.student_id === student.id);
    const repoIds = studentRepos.map(r => r.id);
    const commits = allCommits.filter(c => repoIds.includes(c.repo_id));

    const badges = [];
    const streaks = calculateStreaks(commits);
    const quality = analyzeCommitQuality(commits);
    const consistency = analyzeConsistency(commits);

    // Commit count badges
    if (commits.length >= 1) badges.push({ id: 'first-commit', name: 'First Steps', icon: '🎯', description: 'Made your first commit', earned: true });
    if (commits.length >= 10) badges.push({ id: 'ten-commits', name: 'Getting Started', icon: '🚀', description: '10 commits milestone', earned: true });
    if (commits.length >= 50) badges.push({ id: 'fifty-commits', name: 'Committed', icon: '💪', description: '50 commits milestone', earned: true });
    if (commits.length >= 100) badges.push({ id: 'hundred-commits', name: 'Century Club', icon: '💯', description: '100 commits milestone', earned: true });

    // Streak badges
    if (streaks.currentStreak >= 3) badges.push({ id: 'streak-3', name: 'On Fire', icon: '🔥', description: '3-day streak', earned: true });
    if (streaks.currentStreak >= 7) badges.push({ id: 'streak-7', name: 'Week Warrior', icon: '⚔️', description: '7-day streak', earned: true });
    if (streaks.longestStreak >= 14) badges.push({ id: 'streak-14', name: 'Unstoppable', icon: '🏆', description: '14-day streak achieved', earned: true });

    // Quality badges
    if (quality.grade === 'A') badges.push({ id: 'quality-a', name: 'Quality Master', icon: '⭐', description: 'A-grade commit quality', earned: true });
    if (quality.meaningful_percentage >= 90) badges.push({ id: 'clean-commits', name: 'Clean Coder', icon: '✨', description: '90%+ meaningful commits', earned: true });

    // Time-based badges
    const hours = commits.map(c => new Date(c.commit_date).getHours());
    const earlyBird = hours.filter(h => h >= 5 && h < 9).length;
    const nightOwl = hours.filter(h => h >= 22 || h < 5).length;
    
    if (earlyBird >= 5) badges.push({ id: 'early-bird', name: 'Early Bird', icon: '🌅', description: '5+ commits before 9 AM', earned: true });
    if (nightOwl >= 5) badges.push({ id: 'night-owl', name: 'Night Owl', icon: '🦉', description: '5+ commits after 10 PM', earned: true });

    // Consistency badge
    if (consistency.active_days >= 20) badges.push({ id: 'consistent', name: 'Consistent', icon: '📅', description: '20+ active days', earned: true });

    // Add locked badges (not yet earned)
    const allPossibleBadges = [
        { id: 'first-commit', name: 'First Steps', icon: '🎯', description: 'Made your first commit', requirement: '1 commit' },
        { id: 'ten-commits', name: 'Getting Started', icon: '🚀', description: '10 commits milestone', requirement: '10 commits' },
        { id: 'fifty-commits', name: 'Committed', icon: '💪', description: '50 commits milestone', requirement: '50 commits' },
        { id: 'hundred-commits', name: 'Century Club', icon: '💯', description: '100 commits milestone', requirement: '100 commits' },
        { id: 'streak-3', name: 'On Fire', icon: '🔥', description: '3-day streak', requirement: '3-day streak' },
        { id: 'streak-7', name: 'Week Warrior', icon: '⚔️', description: '7-day streak', requirement: '7-day streak' },
        { id: 'streak-14', name: 'Unstoppable', icon: '🏆', description: '14-day streak achieved', requirement: '14-day streak' },
        { id: 'quality-a', name: 'Quality Master', icon: '⭐', description: 'A-grade commit quality', requirement: 'A grade' },
        { id: 'clean-commits', name: 'Clean Coder', icon: '✨', description: '90%+ meaningful commits', requirement: '90%+ quality' },
        { id: 'early-bird', name: 'Early Bird', icon: '🌅', description: '5+ commits before 9 AM', requirement: '5 early commits' },
        { id: 'night-owl', name: 'Night Owl', icon: '🦉', description: '5+ commits after 10 PM', requirement: '5 late commits' },
        { id: 'consistent', name: 'Consistent', icon: '📅', description: '20+ active days', requirement: '20 active days' }
    ];

    const earnedIds = badges.map(b => b.id);
    const lockedBadges = allPossibleBadges
        .filter(b => !earnedIds.includes(b.id))
        .map(b => ({ ...b, earned: false }));

    return {
        student: { id: student.id, name: student.name },
        earned: badges,
        locked: lockedBadges,
        totalEarned: badges.length,
        totalPossible: allPossibleBadges.length
    };
};

/**
 * Export data for reports
 */
export const exportAnalyticsData = (format = 'json') => {
    const students = localStore.getStudents();
    const repos = localStore.getRepositories();
    const allCommits = localStore.getCommits();

    const exportData = students.map(student => {
        const studentRepos = repos.filter(r => r.student_id === student.id);
        const repoIds = studentRepos.map(r => r.id);
        const commits = allCommits.filter(c => repoIds.includes(c.repo_id));

        const quality = analyzeCommitQuality(commits);
        const consistency = analyzeConsistency(commits);
        const streaks = calculateStreaks(commits);

        return {
            name: student.name,
            email: student.email,
            totalCommits: commits.length,
            repositories: studentRepos.length,
            activeDays: consistency.active_days,
            qualityGrade: quality.grade,
            qualityPercentage: quality.meaningful_percentage,
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            lastCommit: commits.length > 0 ? commits.sort((a,b) => new Date(b.commit_date) - new Date(a.commit_date))[0].commit_date : null
        };
    });

    if (format === 'csv') {
        const headers = ['Name', 'Email', 'Total Commits', 'Repositories', 'Active Days', 'Quality Grade', 'Quality %', 'Current Streak', 'Longest Streak', 'Last Commit'];
        const rows = exportData.map(d => [
            d.name, d.email, d.totalCommits, d.repositories, d.activeDays,
            d.qualityGrade, d.qualityPercentage, d.currentStreak, d.longestStreak, d.lastCommit || 'N/A'
        ]);
        
        return {
            format: 'csv',
            headers,
            rows,
            csvString: [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        };
    }

    return {
        format: 'json',
        generatedAt: new Date().toISOString(),
        data: exportData
    };
};

export default {
    calculateGiniCoefficient,
    analyzeCommitQuality,
    analyzeConsistency,
    analyzeTechStack,
    getContributionBalance,
    getRepositoryAnalytics,
    getClassAnalytics,
    getMilestones,
    setMilestones,
    getMilestoneProgress,
    generateAISummary,
    calculateStreaks,
    getLeaderboard,
    compareStudents,
    getProgressTimeline,
    getStudentBadges,
    exportAnalyticsData
};
