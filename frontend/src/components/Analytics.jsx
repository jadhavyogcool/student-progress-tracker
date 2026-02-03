import { useState, useEffect } from 'react';

const getApiUrl = () => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) return "http://localhost:3000";
    if (url.startsWith("http")) return url;
    return `https://${url}`;
};

const API_URL = `${getApiUrl()}/api`;

/* Heatmap Component */
function CommitHeatmap({ data }) {
    const weeks = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Generate 12 weeks of data
    for (let w = 0; w < 12; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const dayData = data?.find(item => item.week === w && item.day === d);
            week.push(dayData?.count || 0);
        }
        weeks.push(week);
    }

    const getColor = (count) => {
        if (count === 0) return '#ebedf0';
        if (count <= 2) return '#9be9a8';
        if (count <= 5) return '#40c463';
        if (count <= 10) return '#30a14e';
        return '#216e39';
    };

    return (
        <div className="heatmap-container">
            <div className="heatmap-days">
                {days.map((day, i) => (
                    <div key={i} className="heatmap-day-label">{day}</div>
                ))}
            </div>
            <div className="heatmap-grid">
                {weeks.map((week, wi) => (
                    <div key={wi} className="heatmap-week">
                        {week.map((count, di) => (
                            <div 
                                key={di} 
                                className="heatmap-cell"
                                style={{ backgroundColor: getColor(count) }}
                                title={`${count} commits`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                <div className="heatmap-cell" style={{ backgroundColor: '#ebedf0' }} />
                <div className="heatmap-cell" style={{ backgroundColor: '#9be9a8' }} />
                <div className="heatmap-cell" style={{ backgroundColor: '#40c463' }} />
                <div className="heatmap-cell" style={{ backgroundColor: '#30a14e' }} />
                <div className="heatmap-cell" style={{ backgroundColor: '#216e39' }} />
                <span>More</span>
            </div>
        </div>
    );
}

/* Tech Stack Word Cloud */
function TechStackCloud({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="tech-cloud">
                <span className="no-data">No tech stack data available</span>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(t => t.count || 1));
    
    const getSize = (count) => {
        const ratio = (count || 1) / maxCount;
        return Math.max(14, Math.min(42, 14 + ratio * 28));
    };

    // Platform-matching colors (dark theme for cloud)
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

    return (
        <div className="tech-cloud">
            {data.map((tech, i) => (
                <span 
                    key={i}
                    className="tech-tag"
                    style={{ 
                        fontSize: `${getSize(tech.count)}px`,
                        color: colors[i % colors.length],
                        opacity: 0.8 + ((tech.count || 1) / maxCount) * 0.2
                    }}
                    title={`${tech.name}: ${tech.count} project${tech.count !== 1 ? 's' : ''}`}
                >
                    {tech.name}
                </span>
            ))}
        </div>
    );
}

/* Contribution Pie Chart */
function ContributionPie({ contributors }) {
    const total = contributors?.reduce((sum, c) => sum + c.commit_count, 0) || 0;
    const colors = ['#1a1a2e', '#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b'];
    
    let currentAngle = 0;
    const slices = contributors?.map((c, i) => {
        const angle = (c.commit_count / total) * 360;
        const slice = {
            ...c,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
            color: colors[i % colors.length]
        };
        currentAngle += angle;
        return slice;
    }) || [];

    const getCoordinates = (angle, radius) => {
        const radians = (angle - 90) * (Math.PI / 180);
        return {
            x: 100 + radius * Math.cos(radians),
            y: 100 + radius * Math.sin(radians)
        };
    };

    return (
        <div className="contribution-pie">
            <svg viewBox="0 0 200 200" className="pie-chart">
                {slices.map((slice, i) => {
                    const start = getCoordinates(slice.startAngle, 80);
                    const end = getCoordinates(slice.endAngle, 80);
                    const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                    
                    return (
                        <path
                            key={i}
                            d={`M 100 100 L ${start.x} ${start.y} A 80 80 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                            fill={slice.color}
                            stroke="#fff"
                            strokeWidth="2"
                        />
                    );
                })}
            </svg>
            <div className="pie-legend">
                {slices.map((slice, i) => (
                    <div key={i} className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: slice.color }} />
                        <span>{slice.author}: {slice.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* Milestone Race Track */
function MilestoneRaceTrack({ progress, milestones }) {
    return (
        <div className="race-track">
            <div className="track-line">
                {milestones?.map((m, i) => {
                    const position = (m.target_commits / Math.max(...milestones.map(x => x.target_commits))) * 100;
                    return (
                        <div 
                            key={i} 
                            className="milestone-marker"
                            style={{ left: `${position}%` }}
                        >
                            <div className="marker-flag">{m.name}</div>
                            <div className="marker-target">{m.target_commits}</div>
                        </div>
                    );
                })}
                <div 
                    className="progress-car"
                    style={{ left: `${Math.min(progress?.progress || 0, 100)}%` }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                </div>
            </div>
            <div className="track-stats">
                <span>{progress?.current_commits || 0} commits</span>
                <span>Next: {progress?.next_milestone?.name || 'Complete!'}</span>
            </div>
        </div>
    );
}

/* Grade Badge */
function GradeBadge({ grade, label }) {
    const gradeColors = {
        'A': '#22c55e',
        'B': '#84cc16',
        'C': '#eab308',
        'D': '#f97316',
        'F': '#ef4444'
    };

    return (
        <div className="grade-badge" style={{ borderColor: gradeColors[grade] || '#888' }}>
            <div className="grade-letter" style={{ color: gradeColors[grade] || '#888' }}>{grade}</div>
            <div className="grade-label">{label}</div>
        </div>
    );
}

/* Cramming Alert */
function CrammingAlert({ data }) {
    if (!data?.is_cramming) return null;

    return (
        <div className="cramming-alert">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <div className="alert-content">
                <strong>Cramming Detected</strong>
                <p>{data.cramming_percentage}% of commits in last 48 hours</p>
            </div>
        </div>
    );
}

/* Repository Details Modal - Replaces AI Summary */
function RepoDetailsModal({ repoId, repoData, onClose }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/analytics/ai-summary/${repoId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                console.log('AI Summary data:', data);
                setDetails(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('AI Summary error:', err);
                // Create fallback data from repoData if provided
                if (repoData) {
                    setDetails({
                        summary: `This repository has ${repoData.analytics?.quality?.totalCommits || repoData.insights?.total_commits || 0} commits. The commit quality grade is ${repoData.analytics?.quality?.grade || 'N/A'}.`,
                        patterns: [
                            `Total commits: ${repoData.analytics?.quality?.totalCommits || repoData.insights?.total_commits || 0}`,
                            `Quality grade: ${repoData.analytics?.quality?.grade || 'N/A'}`
                        ],
                        recommendations: ['Continue making consistent commits', 'Write descriptive commit messages'],
                        topics: repoData.tech_stack || [],
                        stats: {
                            totalCommits: repoData.analytics?.quality?.totalCommits || repoData.insights?.total_commits || 0,
                            activeDays: repoData.analytics?.consistency?.active_days || 0,
                            qualityGrade: repoData.analytics?.quality?.grade || 'N/A',
                            meaningfulCommits: repoData.analytics?.quality?.messageQualityScore || repoData.analytics?.quality?.overallScore || 0
                        }
                    });
                }
                setLoading(false);
            });
    }, [repoId, repoData]);

    return (
        <div className="details-modal-overlay" onClick={onClose}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>
                <div className="details-header">
                    <h3>Repository Insights</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                {loading ? (
                    <div className="details-loading">
                        <div className="spinner"></div>
                        <p>Loading insights...</p>
                    </div>
                ) : details ? (
                    <div className="details-body">
                        <div className="insights-stats">
                            <div className="insight-stat">
                                <span className="insight-value">{details.stats?.totalCommits || 0}</span>
                                <span className="insight-label">Total Commits</span>
                            </div>
                            <div className="insight-stat">
                                <span className="insight-value">{details.stats?.activeDays || 0}</span>
                                <span className="insight-label">Active Days</span>
                            </div>
                            <div className="insight-stat">
                                <span className={`insight-grade grade-${details.stats?.qualityGrade}`}>{details.stats?.qualityGrade || 'N/A'}</span>
                                <span className="insight-label">Quality Grade</span>
                            </div>
                            <div className="insight-stat">
                                <span className="insight-value">{Math.round(details.stats?.meaningfulCommits || 0)}%</span>
                                <span className="insight-label">Good Messages</span>
                            </div>
                        </div>
                        
                        <div className="insight-section">
                            <h4>Summary</h4>
                            <p>{details.summary || 'No summary available'}</p>
                        </div>
                        
                        {details.patterns?.length > 0 && (
                            <div className="insight-section">
                                <h4>Work Patterns</h4>
                                <ul className="pattern-list">
                                    {details.patterns.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {details.recommendations?.length > 0 && (
                            <div className="insight-section">
                                <h4>Recommendations</h4>
                                <ul className="recommendation-list">
                                    {details.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {details.topics?.length > 0 && (
                            <div className="insight-section">
                                <h4>Tech Stack</h4>
                                <div className="focus-tags">
                                    {details.topics.map((t, i) => (
                                        <span key={i} className="focus-tag">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="details-body">
                        <p className="no-data">Unable to load insights. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* Leaderboard Component */
function Leaderboard({ period, onPeriodChange }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`${API_URL}/analytics/leaderboard/${period}`)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch');
                return r.json();
            })
            .then(res => {
                console.log('Leaderboard data:', res);
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error('Leaderboard error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [period]);

    const getTrendIcon = (trend) => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return '#1';
        if (rank === 2) return '#2';
        if (rank === 3) return '#3';
        return `#${rank}`;
    };

    if (loading) return <div className="loading-spinner">Loading leaderboard...</div>;
    
    if (error) return (
        <div className="error-state">
            <p>Failed to load leaderboard. Make sure backend is running.</p>
            <code>{error}</code>
        </div>
    );
    
    if (!data || !data.rankings || data.rankings.length === 0) return (
        <div className="empty-state">
            <h3>No Data Yet</h3>
            <p>No students have been added or no commits recorded.</p>
        </div>
    );

    return (
        <div className="leaderboard-section">
            <div className="leaderboard-header">
                <h3>Leaderboard</h3>
                <div className="period-selector">
                    <button className={period === 'weekly' ? 'active' : ''} onClick={() => onPeriodChange('weekly')}>Weekly</button>
                    <button className={period === 'monthly' ? 'active' : ''} onClick={() => onPeriodChange('monthly')}>Monthly</button>
                    <button className={period === 'all' ? 'active' : ''} onClick={() => onPeriodChange('all')}>All Time</button>
                </div>
            </div>

            {/* Top 3 Podium */}
            <div className="podium">
                {data?.topPerformers?.map((student, i) => (
                    <div key={student.student_id} className={`podium-place place-${i + 1}`}>
                        <div className="podium-avatar">{student.name.charAt(0)}</div>
                        <div className="podium-rank">{getRankBadge(i + 1)}</div>
                        <div className="podium-name">{student.name}</div>
                        <div className="podium-score">{student.overallScore} pts</div>
                        <div className="podium-stats">
                            <span>{student.totalCommits} commits</span>
                            <span>{student.currentStreak} day streak</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full Rankings Table */}
            <div className="rankings-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Student</th>
                            <th>Score</th>
                            <th>Commits</th>
                            <th>Quality</th>
                            <th>Streak</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.rankings?.map(student => (
                            <tr key={student.student_id} className={student.rank <= 3 ? 'top-rank' : ''}>
                                <td className="rank-cell">{getRankBadge(student.rank)}</td>
                                <td className="name-cell">
                                    <span className="avatar-small">{student.name.charAt(0)}</span>
                                    {student.name}
                                </td>
                                <td className="score-cell">{student.overallScore}</td>
                                <td>{student.totalCommits}</td>
                                <td><span className={`grade-badge grade-${student.qualityGrade}`}>{student.qualityGrade}</span></td>
                                <td>{student.currentStreak} days</td>
                                <td className={`trend-${student.trend}`}>{getTrendIcon(student.trend)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* Student Comparison Component */
function StudentComparison({ students }) {
    const [student1, setStudent1] = useState('');
    const [student2, setStudent2] = useState('');
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCompare = () => {
        if (!student1 || !student2 || student1 === student2) return;
        setLoading(true);
        setError(null);
        setComparison(null);
        console.log('Comparing students:', student1, student2);
        fetch(`${API_URL}/analytics/compare/${student1}/${student2}`)
            .then(r => {
                if (!r.ok) throw new Error('Failed to compare students');
                return r.json();
            })
            .then(data => {
                console.log('Comparison data:', data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setComparison(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Compare error:', err);
                setError(err.message);
                setLoading(false);
            });
    };

    const CompareBar = ({ label, value1, value2, max }) => {
        const pct1 = max > 0 ? (value1 / max) * 100 : 0;
        const pct2 = max > 0 ? (value2 / max) * 100 : 0;
        return (
            <div className="compare-bar-row">
                <span className="compare-value left">{value1}</span>
                <div className="compare-bar">
                    <div className="bar-fill left" style={{ width: `${pct1}%` }}></div>
                    <span className="bar-label">{label}</span>
                    <div className="bar-fill right" style={{ width: `${pct2}%` }}></div>
                </div>
                <span className="compare-value right">{value2}</span>
            </div>
        );
    };

    return (
        <div className="comparison-section">
            <h3>Student Comparison</h3>
            <div className="comparison-selector">
                <select value={student1} onChange={e => setStudent1(e.target.value)}>
                    <option value="">Select Student 1</option>
                    {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <span className="vs-badge">VS</span>
                <select value={student2} onChange={e => setStudent2(e.target.value)}>
                    <option value="">Select Student 2</option>
                    {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <button onClick={handleCompare} disabled={!student1 || !student2 || student1 === student2}>
                    Compare
                </button>
            </div>

            {loading && <div className="loading-spinner">Comparing...</div>}
            
            {error && (
                <div className="error-state">
                    <p>Failed to compare students.</p>
                    <code>{error}</code>
                </div>
            )}

            {comparison && !comparison.error && (
                <div className="comparison-results">
                    <div className="comparison-header">
                        <div className="student-card student-1">
                            <div className="student-avatar">{comparison.student1.name.charAt(0)}</div>
                            <h4>{comparison.student1.name}</h4>
                            <span className="student-grade">Grade: {comparison.student1.metrics.qualityGrade || 'N/A'}</span>
                            <div className="strengths">
                                {comparison.student1.strengths.map((s, i) => (
                                    <span key={i} className="strength-tag">{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="vs-divider">
                            <span>VS</span>
                        </div>
                        <div className="student-card student-2">
                            <div className="student-avatar">{comparison.student2.name.charAt(0)}</div>
                            <h4>{comparison.student2.name}</h4>
                            <span className="student-grade">Grade: {comparison.student2.metrics.qualityGrade || 'N/A'}</span>
                            <div className="strengths">
                                {comparison.student2.strengths.map((s, i) => (
                                    <span key={i} className="strength-tag">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="metrics-comparison">
                        <h4>Performance Metrics</h4>
                        <div className="comparison-bars">
                            <CompareBar 
                                label="Total Commits" 
                                value1={comparison.student1.metrics.totalCommits}
                                value2={comparison.student2.metrics.totalCommits}
                                max={Math.max(comparison.student1.metrics.totalCommits, comparison.student2.metrics.totalCommits)}
                            />
                            <CompareBar 
                                label="Active Days" 
                                value1={comparison.student1.metrics.activeDays || 0}
                                value2={comparison.student2.metrics.activeDays || 0}
                                max={Math.max(comparison.student1.metrics.activeDays || 0, comparison.student2.metrics.activeDays || 0) || 1}
                            />
                            <CompareBar 
                                label="Quality Score" 
                                value1={comparison.student1.metrics.qualityScore || 0}
                                value2={comparison.student2.metrics.qualityScore || 0}
                                max={100}
                            />
                            <CompareBar 
                                label="Current Streak" 
                                value1={comparison.student1.metrics.currentStreak || 0}
                                value2={comparison.student2.metrics.currentStreak || 0}
                                max={Math.max(comparison.student1.metrics.currentStreak || 0, comparison.student2.metrics.currentStreak || 0) || 1}
                            />
                            <CompareBar 
                                label="Longest Streak" 
                                value1={comparison.student1.metrics.longestStreak || 0}
                                value2={comparison.student2.metrics.longestStreak || 0}
                                max={Math.max(comparison.student1.metrics.longestStreak || 0, comparison.student2.metrics.longestStreak || 0) || 1}
                            />
                            <CompareBar 
                                label="Repositories" 
                                value1={comparison.student1.metrics.repoCount || 0}
                                value2={comparison.student2.metrics.repoCount || 0}
                                max={Math.max(comparison.student1.metrics.repoCount || 0, comparison.student2.metrics.repoCount || 0) || 1}
                            />
                        </div>
                    </div>

                    <div className="work-patterns-comparison">
                        <h4>Work Patterns & Insights</h4>
                        <div className="patterns-grid">
                            <div className="pattern-card student-1-pattern">
                                <div className="pattern-header">
                                    <span className="pattern-name">{comparison.student1.name}</span>
                                </div>
                                <div className="pattern-content">
                                    <div className="pattern-item">
                                        <span className="pattern-label">Work Style</span>
                                        <span className="pattern-value">{comparison.student1.patterns.workPattern}</span>
                                    </div>
                                    <div className="pattern-item">
                                        <span className="pattern-label">Peak Hour</span>
                                        <span className="pattern-value">{comparison.student1.patterns.peakHour}:00</span>
                                    </div>
                                    <div className="pattern-item">
                                        <span className="pattern-label">Avg Gap</span>
                                        <span className="pattern-value">{comparison.student1.patterns.avgGapDays || 0} days</span>
                                    </div>
                                    {comparison.student1.patterns.isCramming && (
                                        <div className="cramming-alert">Cramming Detected</div>
                                    )}
                                </div>
                                {comparison.student1.techStack?.length > 0 && (
                                    <div className="tech-used">
                                        <span className="tech-label">Technologies:</span>
                                        <div className="tech-tags">
                                            {comparison.student1.techStack.map((t, i) => (
                                                <span key={i} className="mini-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="pattern-card student-2-pattern">
                                <div className="pattern-header">
                                    <span className="pattern-name">{comparison.student2.name}</span>
                                </div>
                                <div className="pattern-content">
                                    <div className="pattern-item">
                                        <span className="pattern-label">Work Style</span>
                                        <span className="pattern-value">{comparison.student2.patterns.workPattern}</span>
                                    </div>
                                    <div className="pattern-item">
                                        <span className="pattern-label">Peak Hour</span>
                                        <span className="pattern-value">{comparison.student2.patterns.peakHour}:00</span>
                                    </div>
                                    <div className="pattern-item">
                                        <span className="pattern-label">Avg Gap</span>
                                        <span className="pattern-value">{comparison.student2.patterns.avgGapDays || 0} days</span>
                                    </div>
                                    {comparison.student2.patterns.isCramming && (
                                        <div className="cramming-alert">Cramming Detected</div>
                                    )}
                                </div>
                                {comparison.student2.techStack?.length > 0 && (
                                    <div className="tech-used">
                                        <span className="tech-label">Technologies:</span>
                                        <div className="tech-tags">
                                            {comparison.student2.techStack.map((t, i) => (
                                                <span key={i} className="mini-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* Badges Component */
function BadgesDisplay({ studentId }) {
    const [badges, setBadges] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        fetch(`${API_URL}/analytics/badges/${studentId}`)
            .then(r => r.json())
            .then(data => {
                setBadges(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [studentId]);

    if (loading) return <div className="loading-spinner">Loading badges...</div>;
    if (!badges) return null;

    return (
        <div className="badges-section">
            <div className="badges-header">
                <h4>Achievements</h4>
                <span className="badges-count">{badges.totalEarned}/{badges.totalPossible}</span>
            </div>
            <div className="badges-grid">
                {badges.earned.map(badge => (
                    <div key={badge.id} className="badge-card earned">
                        <span className="badge-icon">{badge.icon}</span>
                        <span className="badge-name">{badge.name}</span>
                        <span className="badge-desc">{badge.description}</span>
                    </div>
                ))}
                {badges.locked.map(badge => (
                    <div key={badge.id} className="badge-card locked">
                        <span className="badge-icon">🔒</span>
                        <span className="badge-name">{badge.name}</span>
                        <span className="badge-desc">{badge.requirement}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* Progress Timeline Component */
function ProgressTimeline({ studentId }) {
    const [timeline, setTimeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        setError(null);
        console.log('Fetching timeline for student:', studentId);
        fetch(`${API_URL}/analytics/timeline/${studentId}`)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch timeline');
                return r.json();
            })
            .then(data => {
                console.log('Timeline data:', data);
                setTimeline(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Timeline error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [studentId]);

    if (loading) return <div className="loading-spinner">Loading timeline...</div>;
    
    if (error) return (
        <div className="error-state">
            <p>Failed to load timeline.</p>
            <code>{error}</code>
        </div>
    );
    
    if (!timeline || timeline.error) return (
        <div className="empty-state">
            <h3>No Timeline Data</h3>
            <p>{timeline?.error || 'No commit history found for this student.'}</p>
        </div>
    );

    const maxCommits = Math.max(...(timeline.timeline?.map(w => w.commits) || [1]));

    return (
        <div className="timeline-section">
            <h4>Progress Timeline</h4>
            <div className="timeline-summary">
                <span>{timeline.summary?.totalWeeks} weeks</span>
                <span>{timeline.summary?.totalCommits} commits</span>
                <span>~{timeline.summary?.avgCommitsPerWeek} commits/week</span>
            </div>
            
            <div className="timeline-chart">
                {timeline.timeline?.slice(-12).map((week, i) => (
                    <div key={i} className="timeline-bar-container">
                        <div 
                            className="timeline-bar" 
                            style={{ height: `${(week.commits / maxCommits) * 100}%` }}
                            title={`${week.commits} commits`}
                        >
                            <span className="bar-value">{week.commits}</span>
                        </div>
                        <span className="week-label">W{i + 1}</span>
                    </div>
                ))}
            </div>

            {/* Milestones */}
            <div className="timeline-milestones">
                <h5>Milestones Achieved</h5>
                <div className="milestone-list">
                    {timeline.milestones?.map((m, i) => (
                        <div key={i} className="milestone-item achieved">
                            <span className="milestone-icon">✓</span>
                            <span className="milestone-label">{m.label}</span>
                            <span className="milestone-date">{new Date(m.achievedAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* Export Panel Component */
function ExportPanel() {
    const [exporting, setExporting] = useState(false);

    const handleExport = (format) => {
        setExporting(true);
        if (format === 'csv') {
            window.open(`${API_URL}/analytics/export/csv`, '_blank');
            setExporting(false);
        } else {
            fetch(`${API_URL}/analytics/export/json`)
                .then(r => r.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'student-analytics.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    setExporting(false);
                })
                .catch(() => setExporting(false));
        }
    };

    return (
        <div className="export-panel">
            <h4>Export Reports</h4>
            <p>Download comprehensive analytics data for all students</p>
            <div className="export-buttons">
                <button onClick={() => handleExport('csv')} disabled={exporting}>
                    Export CSV
                </button>
                <button onClick={() => handleExport('json')} disabled={exporting}>
                    Export JSON
                </button>
            </div>
        </div>
    );
}

/* Main Analytics Dashboard */
export default function Analytics() {
    const [classData, setClassData] = useState(null);
    const [techStack, setTechStack] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [studentsData, setStudentsData] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [repoAnalytics, setRepoAnalytics] = useState(null);
    const [showAISummary, setShowAISummary] = useState(null);
    const [selectedRepoData, setSelectedRepoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
    const [selectedStudentForTimeline, setSelectedStudentForTimeline] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [classRes, techRes, milestonesRes, studentsRes, atRiskRes] = await Promise.all([
                    fetch(`${API_URL}/analytics/class`).then(r => r.ok ? r.json() : {}),
                    fetch(`${API_URL}/analytics/tech-stack`).then(r => r.ok ? r.json() : []),
                    fetch(`${API_URL}/milestones`).then(r => r.ok ? r.json() : []),
                    fetch(`${API_URL}/analytics/students`).then(r => r.ok ? r.json() : []),
                    fetch(`${API_URL}/analytics/at-risk`).then(r => r.ok ? r.json() : []).catch(() => [])
                ]);
                
                console.log('Loaded data:', { classRes, techRes, studentsRes });
            // Use class data directly from backend if available
            if (classRes.total_students !== undefined) {
                setClassData(classRes);
            } else {
                // Fallback transformation
                const totalCommits = studentsRes.reduce((sum, s) => 
                    sum + (s.repositories?.reduce((rSum, r) => rSum + (r.insights?.total_commits || 0), 0) || 0), 0
                );
                
                const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                const crammingAlerts = [];
                
                studentsRes.forEach(student => {
                    student.repositories?.forEach(repo => {
                        const grade = repo.analytics?.quality?.grade || 'C';
                        if (gradeDistribution.hasOwnProperty(grade)) {
                            gradeDistribution[grade]++;
                        }
                        if (repo.analytics?.consistency?.is_cramming) {
                            crammingAlerts.push({
                                student: student.name,
                                repo: repo.repo_name,
                                percentage: repo.analytics.consistency.cramming_percentage || 50
                            });
                        }
                    });
                });

                const totalRepos = studentsRes.reduce((sum, s) => sum + (s.repositories?.length || 0), 0);

                setClassData({
                    total_students: studentsRes.length,
                    total_repos: totalRepos,
                    total_commits: totalCommits,
                    avg_commits_per_repo: totalRepos > 0 ? totalCommits / totalRepos : 0,
                    grade_distribution: gradeDistribution,
                    cramming_alerts: crammingAlerts,
                    heatmap: classRes.heatmap || [],
                    summary: classRes.summary || {}
                });
            }
            
                // Transform tech stack data
                setTechStack(techRes.technologies || techRes || []);
                setMilestones(milestonesRes || []);
                setStudentsData(studentsRes || []);
                setAtRiskStudents(atRiskRes || []);
                setLoading(false);
            } catch (err) {
                console.error('Error loading analytics:', err);
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const loadRepoAnalytics = (repoId) => {
        setSelectedRepo(repoId);
        Promise.all([
            fetch(`${API_URL}/analytics/repository/${repoId}`).then(r => r.json()),
            fetch(`${API_URL}/analytics/consistency/${repoId}`).then(r => r.json()),
            fetch(`${API_URL}/analytics/code-quality/${repoId}`).then(r => r.json()),
            fetch(`${API_URL}/analytics/contribution-balance/${repoId}`).then(r => r.json()),
            fetch(`${API_URL}/analytics/milestone-progress/${repoId}`).then(r => r.json())
        ]).then(([repo, consistency, quality, balance, progress]) => {
            setRepoAnalytics({ repo, consistency, quality, balance, progress });
        });
    };

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard">
            {/* Tab Navigation */}
            <div className="analytics-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Class Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    Leaderboard
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compare')}
                >
                    Compare
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Student Analytics
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    Timeline
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'atrisk' ? 'active' : ''}`}
                    onClick={() => setActiveTab('atrisk')}
                >
                    At Risk {atRiskStudents.length > 0 && <span className="badge-count">{atRiskStudents.length}</span>}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'tech' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tech')}
                >
                    Tech Radar
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('milestones')}
                >
                    Milestones
                </button>
            </div>

            {/* Class Overview - Premium Design */}
            {activeTab === 'overview' && (
                <div className="analytics-section class-overview-premium">
                    {/* Hero Section */}
                    <div className="overview-hero">
                        <div className="hero-content">
                            <h2>Class Overview</h2>
                            <p>Real-time insights into your class performance</p>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="hero-number">{classData?.total_students || 0}</span>
                                <span className="hero-label">Students</span>
                            </div>
                            <div className="hero-divider"></div>
                            <div className="hero-stat">
                                <span className="hero-number">{classData?.total_repos || 0}</span>
                                <span className="hero-label">Repos</span>
                            </div>
                            <div className="hero-divider"></div>
                            <div className="hero-stat">
                                <span className="hero-number">{classData?.total_commits || 0}</span>
                                <span className="hero-label">Commits</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="metrics-row">
                        <div className="metric-card blue">
                            <div className="metric-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                            </div>
                            <div className="metric-info">
                                <span className="metric-value">{classData?.total_students || 0}</span>
                                <span className="metric-label">Total Students</span>
                            </div>
                            <div className="metric-trend up">
                                <span>Active</span>
                            </div>
                        </div>
                        <div className="metric-card purple">
                            <div className="metric-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                                </svg>
                            </div>
                            <div className="metric-info">
                                <span className="metric-value">{classData?.total_repos || 0}</span>
                                <span className="metric-label">Repositories</span>
                            </div>
                            <div className="metric-trend">
                                <span>Tracked</span>
                            </div>
                        </div>
                        <div className="metric-card green">
                            <div className="metric-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                            <div className="metric-info">
                                <span className="metric-value">{classData?.total_commits || 0}</span>
                                <span className="metric-label">Total Commits</span>
                            </div>
                            <div className="metric-trend up">
                                <span>+{classData?.summary?.recent_commits || 0} this week</span>
                            </div>
                        </div>
                        <div className="metric-card orange">
                            <div className="metric-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div className="metric-info">
                                <span className="metric-value">{(classData?.avg_commits_per_repo || 0).toFixed(1)}</span>
                                <span className="metric-label">Avg per Repo</span>
                            </div>
                            <div className="metric-trend">
                                <span>Average</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="dashboard-grid">
                        {/* Activity Heatmap */}
                        <div className="dashboard-card activity-card">
                            <div className="dash-card-header">
                                <div className="header-left">
                                    <h3>Class Activity</h3>
                                    <span className="header-subtitle">Commit frequency over 12 weeks</span>
                                </div>
                                <div className="header-badge">Live</div>
                            </div>
                            <div className="dash-card-body">
                                <CommitHeatmap data={classData?.heatmap} />
                            </div>
                        </div>

                        {/* Quality Distribution */}
                        <div className="dashboard-card quality-card">
                            <div className="dash-card-header">
                                <div className="header-left">
                                    <h3>Quality Distribution</h3>
                                    <span className="header-subtitle">Commit message quality grades</span>
                                </div>
                            </div>
                            <div className="dash-card-body">
                                <div className="quality-grid">
                                    {['A', 'B', 'C', 'D', 'F'].map(grade => {
                                        const count = classData?.grade_distribution?.[grade] || 0;
                                        const total = classData?.total_repos || 1;
                                        const pct = Math.round((count / total) * 100);
                                        return (
                                            <div key={grade} className={`quality-item grade-${grade.toLowerCase()}-bg`}>
                                                <div className="quality-grade">{grade}</div>
                                                <div className="quality-count">{count}</div>
                                                <div className="quality-bar">
                                                    <div className="quality-fill" style={{ height: `${Math.max(pct, 5)}%` }}></div>
                                                </div>
                                                <div className="quality-pct">{pct}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="dashboard-card performers-card">
                            <div className="dash-card-header">
                                <div className="header-left">
                                    <h3>Top Performers</h3>
                                    <span className="header-subtitle">Most active this week</span>
                                </div>
                                <button className="header-action" onClick={() => setActiveTab('leaderboard')}>View All</button>
                            </div>
                            <div className="dash-card-body">
                                <div className="performers-list">
                                    {studentsData?.slice(0, 5).map((student, i) => {
                                        const totalCommits = student.repositories?.reduce((sum, r) => 
                                            sum + (r.analytics?.quality?.totalCommits || r.insights?.total_commits || 0), 0) || 0;
                                        return (
                                            <div key={student.id} className="performer-row">
                                                <span className={`performer-rank rank-${i + 1}`}>{i + 1}</span>
                                                <div className="performer-avatar">{student.name?.charAt(0)}</div>
                                                <div className="performer-info">
                                                    <span className="performer-name">{student.name}</span>
                                                    <span className="performer-commits">{totalCommits} commits</span>
                                                </div>
                                                <div className="performer-badge">{student.repositories?.length || 0} repos</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="dashboard-card alerts-dashboard-card">
                            <div className="dash-card-header">
                                <div className="header-left">
                                    <h3>Alerts & Warnings</h3>
                                    <span className="header-subtitle">Issues requiring attention</span>
                                </div>
                                {classData?.cramming_alerts?.length > 0 && (
                                    <span className="alert-count">{classData.cramming_alerts.length}</span>
                                )}
                            </div>
                            <div className="dash-card-body">
                                {classData?.cramming_alerts?.length > 0 ? (
                                    <div className="alerts-dashboard-list">
                                        {classData.cramming_alerts.slice(0, 4).map((alert, i) => (
                                            <div key={i} className="alert-dashboard-item">
                                                <div className="alert-icon-wrapper">
                                                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                                    </svg>
                                                </div>
                                                <div className="alert-dashboard-content">
                                                    <span className="alert-student-name">{alert.student}</span>
                                                    <span className="alert-description">{alert.repo} • {alert.percentage}% recent commits</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-alerts">
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        <span>All students on track!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <button className="action-btn primary" onClick={() => setActiveTab('leaderboard')}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/>
                            </svg>
                            View Leaderboard
                        </button>
                        <button className="action-btn warning" onClick={() => setActiveTab('atrisk')}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                            </svg>
                            Check At-Risk Students
                        </button>
                        <button className="action-btn secondary" onClick={() => setActiveTab('compare')}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm4 18h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-5v2h5v14h-5v2z"/>
                            </svg>
                            Compare Students
                        </button>
                    </div>
                </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div className="analytics-section">
                    <Leaderboard period={leaderboardPeriod} onPeriodChange={setLeaderboardPeriod} />
                </div>
            )}

            {/* Comparison Tab */}
            {activeTab === 'compare' && (
                <div className="analytics-section">
                    <StudentComparison students={studentsData.map(s => ({ id: s.id, name: s.name }))} />
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="analytics-section">
                    <h2>Progress Timeline</h2>
                    <p className="section-subtitle">Track individual student progress over time</p>
                    <div className="timeline-selector-container">
                        <label>Select Student:</label>
                        <select 
                            value={selectedStudentForTimeline || ''} 
                            onChange={e => setSelectedStudentForTimeline(e.target.value)}
                            className="student-select"
                        >
                            <option value="">Choose a student...</option>
                            {studentsData.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedStudentForTimeline ? (
                        <div className="timeline-content">
                            <ProgressTimeline studentId={selectedStudentForTimeline} />
                            <BadgesDisplay studentId={selectedStudentForTimeline} />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="#94a3b8">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            <h3>Select a Student</h3>
                            <p>Choose a student from the dropdown to view their progress timeline and achievements.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Technology Radar - Premium Black & White */}
            {activeTab === 'tech' && (
                <div className="analytics-section tech-radar-premium">
                    {/* Tech Radar Hero */}
                    <div className="tech-radar-hero">
                        <div className="tech-hero-content">
                            <h2>Technology Radar</h2>
                            <p>Technologies powering your student projects</p>
                        </div>
                        <div className="tech-hero-stats">
                            <div className="tech-hero-stat">
                                <span className="tech-hero-number">{techStack?.length || 0}</span>
                                <span className="tech-hero-label">Technologies</span>
                            </div>
                            <div className="tech-hero-divider"></div>
                            <div className="tech-hero-stat">
                                <span className="tech-hero-number">{techStack?.filter(t => t.category === 'Frontend').length || 0}</span>
                                <span className="tech-hero-label">Frontend</span>
                            </div>
                            <div className="tech-hero-divider"></div>
                            <div className="tech-hero-stat">
                                <span className="tech-hero-number">{techStack?.filter(t => t.category === 'Backend').length || 0}</span>
                                <span className="tech-hero-label">Backend</span>
                            </div>
                        </div>
                    </div>

                    {/* Most Popular Tech Banner */}
                    <div className="popular-tech-banner">
                        <div className="popular-label">Most Used Technology</div>
                        <div className="popular-name">{techStack?.[0]?.name || 'N/A'}</div>
                        <div className="popular-meta">
                            Used in {techStack?.[0]?.count || 0} projects • {techStack?.[0]?.category || 'General'}
                        </div>
                    </div>

                    {/* Tech Cloud Section */}
                    <div className="tech-cloud-section">
                        <div className="section-header">
                            <h3>Technology Cloud</h3>
                            <span className="section-subtitle">Size represents usage frequency</span>
                        </div>
                        <div className="tech-cloud-container">
                            <TechStackCloud data={techStack} />
                        </div>
                    </div>

                    {/* Tech Grid Layout */}
                    <div className="tech-premium-grid">
                        {/* Top Technologies Table */}
                        <div className="tech-table-card">
                            <div className="tech-card-header">
                                <h3>Top Technologies</h3>
                                <span className="header-badge-dark">{techStack?.slice(0, 10).length || 0} shown</span>
                            </div>
                            <div className="tech-card-body">
                                <table className="tech-table-premium">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Technology</th>
                                            <th>Category</th>
                                            <th>Projects</th>
                                            <th>Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {techStack?.slice(0, 10).map((tech, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <span className={`rank-circle rank-${i + 1}`}>{i + 1}</span>
                                                </td>
                                                <td>
                                                    <span className="tech-name-cell">{tech.name}</span>
                                                </td>
                                                <td>
                                                    <span className="category-pill">{tech.category || 'Other'}</span>
                                                </td>
                                                <td>
                                                    <span className="project-count">{tech.count}</span>
                                                </td>
                                                <td>
                                                    <div className="usage-bar-premium">
                                                        <div 
                                                            className="usage-fill-premium"
                                                            style={{ width: `${(tech.count / (techStack[0]?.count || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Categories Breakdown */}
                        <div className="tech-categories-card">
                            <div className="tech-card-header">
                                <h3>By Category</h3>
                            </div>
                            <div className="tech-card-body">
                                <div className="categories-grid">
                                    {['Frontend', 'Backend', 'Database', 'Language', 'Testing', 'Other'].map(cat => {
                                        const catTech = techStack?.filter(t => t.category === cat) || [];
                                        if (catTech.length === 0) return null;
                                        return (
                                            <div key={cat} className="category-card-mini">
                                                <div className="category-header-mini">
                                                    <span className="category-name">{cat}</span>
                                                    <span className="category-count">{catTech.length}</span>
                                                </div>
                                                <div className="category-techs-mini">
                                                    {catTech.slice(0, 4).map((t, i) => (
                                                        <span key={i} className="tech-chip">{t.name}</span>
                                                    ))}
                                                    {catTech.length > 4 && (
                                                        <span className="tech-chip more">+{catTech.length - 4}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Analytics */}
            {activeTab === 'students' && (
                <div className="analytics-section">
                    <h2>Student Analytics</h2>
                    <p className="section-subtitle">Detailed analysis for each student's repositories</p>
                    
                    {(!studentsData || studentsData.length === 0) ? (
                        <div className="empty-state">
                            <h3>No Students Found</h3>
                            <p>Add students to see their analytics here.</p>
                        </div>
                    ) : (
                    <div className="students-grid">
                        {studentsData.map(student => (
                            <div key={student.id} className="student-analytics-card">
                                <div className="student-header">
                                    <div className="student-avatar-small">{student.name?.charAt(0) || '?'}</div>
                                    <div>
                                        <h3>{student.name}</h3>
                                        <span className="student-email">{student.email}</span>
                                    </div>
                                </div>
                                <div className="student-repos">
                                    {student.repositories?.length > 0 ? student.repositories.map(repo => (
                                        <div key={repo.id} className="repo-analytics-item">
                                            <div className="repo-info">
                                                <span className="repo-name">{repo.repo_name}</span>
                                                {repo.is_group && <span className="group-badge">Group</span>}
                                            </div>
                                            <div className="repo-quick-stats">
                                                <GradeBadge 
                                                    grade={repo.analytics?.quality?.grade || 'N/A'} 
                                                    label="Quality"
                                                />
                                                <div className="mini-stat">
                                                    <span className="value">{repo.analytics?.quality?.totalCommits || repo.analytics?.quality?.total_commits || repo.insights?.total_commits || 0}</span>
                                                    <span className="label">Commits</span>
                                                </div>
                                                <div className="mini-stat">
                                                    <span className="value">{repo.analytics?.consistency?.active_days || 0}</span>
                                                    <span className="label">Active Days</span>
                                                </div>
                                                {repo.analytics?.consistency?.isCramming && (
                                                    <span className="cramming-badge">Cramming</span>
                                                )}
                                            </div>
                                            <div className="repo-actions">
                                                <button 
                                                    className="btn-detail"
                                                    onClick={() => {
                                                        setShowAISummary(repo.id);
                                                        setSelectedRepoData(repo);
                                                    }}
                                                >
                                                    View Insights
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="no-repos">No repositories added yet</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            )}

            {/* At Risk Students */}
            {activeTab === 'atrisk' && (
                <div className="analytics-section">
                    <h2>At-Risk Students</h2>
                    <p className="section-subtitle">Students who may need additional support or attention</p>
                    
                    {atRiskStudents.length === 0 ? (
                        <div className="no-risk-card">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="#22c55e">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <h3>All Students On Track</h3>
                            <p>No students currently flagged as at-risk. Great job!</p>
                        </div>
                    ) : (
                        <div className="at-risk-list">
                            {atRiskStudents.map((item, i) => (
                                <div key={i} className="at-risk-card">
                                    <div className="at-risk-header">
                                        <div className="student-info">
                                            <div className="avatar">{item.student.name?.charAt(0)}</div>
                                            <div>
                                                <h3>{item.student.name}</h3>
                                                <p>{item.student.email}</p>
                                            </div>
                                        </div>
                                        <div className={`risk-score risk-${item.riskScore > 3 ? 'high' : item.riskScore > 1 ? 'medium' : 'low'}`}>
                                            Risk Score: {item.riskScore}
                                        </div>
                                    </div>
                                    <div className="at-risk-stats">
                                        <div className="stat">
                                            <span className="value">{item.totalCommits}</span>
                                            <span className="label">Total Commits</span>
                                        </div>
                                        <div className="stat">
                                            <span className="value">{item.recentCommits}</span>
                                            <span className="label">Last 7 Days</span>
                                        </div>
                                    </div>
                                    <div className="issues-list">
                                        {item.issues.map((issue, j) => (
                                            <div key={j} className={`issue-item severity-${issue.severity}`}>
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                    {issue.severity === 'high' ? (
                                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                                    ) : (
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                                    )}
                                                </svg>
                                                <span>{issue.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Milestones */}
            {activeTab === 'milestones' && (
                <div className="analytics-section">
                    <h2>Class Milestones</h2>
                    <div className="milestones-config">
                        <h3>Current Milestones</h3>
                        <div className="milestones-list">
                            {milestones?.map((m, i) => (
                                <div key={i} className="milestone-item">
                                    <span className="milestone-name">{m.name}</span>
                                    <span className="milestone-target">{m.required_commits || m.target_commits} commits</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="student-progress-list">
                        <h3>Student Progress</h3>
                        {studentsData?.map(student => (
                            <div key={student.id} className="student-progress-item">
                                <h4>{student.name}</h4>
                                {student.repositories?.map(repo => (
                                    <div key={repo.id} className="repo-progress">
                                        <span className="repo-name">{repo.repo_name}</span>
                                        <MilestoneRaceTrack 
                                            progress={repo.analytics?.milestones}
                                            milestones={milestones}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Repository Detail Modal */}
            {selectedRepo && repoAnalytics && (
                <div className="repo-detail-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Repository Analytics</h2>
                            <button className="close-btn" onClick={() => setSelectedRepo(null)}>
                                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-grid">
                                {/* Quality Section */}
                                <div className="modal-card">
                                    <h3>Code Quality Health</h3>
                                    <GradeBadge 
                                        grade={repoAnalytics.quality?.grade} 
                                        label="Professionalism"
                                    />
                                    <div className="quality-breakdown">
                                        <div className="quality-item">
                                            <span>Meaningful Messages</span>
                                            <span>{repoAnalytics.quality?.meaningful_percentage}%</span>
                                        </div>
                                        <div className="quality-item">
                                            <span>Avg Message Length</span>
                                            <span>{repoAnalytics.quality?.avg_message_length?.toFixed(0)} chars</span>
                                        </div>
                                        <div className="quality-item">
                                            <span>Total Commits</span>
                                            <span>{repoAnalytics.quality?.total_commits}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Consistency Section */}
                                <div className="modal-card">
                                    <h3>Consistency Analysis</h3>
                                    <CommitHeatmap data={repoAnalytics.consistency?.heatmap} />
                                    <CrammingAlert data={repoAnalytics.consistency} />
                                    <div className="consistency-stats">
                                        <div className="stat">
                                            <span className="label">Active Days</span>
                                            <span className="value">{repoAnalytics.consistency?.active_days}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Avg/Day</span>
                                            <span className="value">{repoAnalytics.consistency?.avg_commits_per_day?.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contribution Balance (for group projects) */}
                                {repoAnalytics.balance?.is_group && (
                                    <div className="modal-card">
                                        <h3>Contribution Balance</h3>
                                        <div className="gini-display">
                                            <span className="gini-value">{repoAnalytics.balance?.gini_coefficient?.toFixed(2)}</span>
                                            <span className="gini-label">Gini Coefficient</span>
                                            <span className={`balance-status ${repoAnalytics.balance?.balance_status}`}>
                                                {repoAnalytics.balance?.balance_status}
                                            </span>
                                        </div>
                                        <ContributionPie contributors={repoAnalytics.balance?.contributors} />
                                    </div>
                                )}

                                {/* Milestone Progress */}
                                <div className="modal-card full-width">
                                    <h3>Milestone Progress</h3>
                                    <MilestoneRaceTrack 
                                        progress={repoAnalytics.progress}
                                        milestones={milestones}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Repository Details Modal */}
            {showAISummary && (
                <RepoDetailsModal 
                    repoId={showAISummary} 
                    repoData={selectedRepoData}
                    onClose={() => {
                        setShowAISummary(null);
                        setSelectedRepoData(null);
                    }} 
                />
            )}
        </div>
    );
}
