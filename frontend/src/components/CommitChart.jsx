import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function CommitChart({ timeline, contributors }) {
    if (!timeline || timeline.length === 0) {
        return <div className="no-data">No commit data available</div>;
    }

    // Generate colors for each contributor
    const colors = [
        'rgb(59, 130, 246)',   // blue
        'rgb(16, 185, 129)',   // green
        'rgb(249, 115, 22)',   // orange
        'rgb(168, 85, 247)',   // purple
        'rgb(236, 72, 153)',   // pink
        'rgb(234, 179, 8)',    // yellow
        'rgb(239, 68, 68)',    // red
        'rgb(20, 184, 166)',   // teal
    ];

    // Get all unique authors
    const authors = contributors.map(c => c.author);

    // Create datasets for each author
    const datasets = authors.map((author, index) => {
        const data = timeline.map(t => (t.commits_by_author && t.commits_by_author[author]) || 0);
        const color = colors[index % colors.length];

        return {
            label: author,
            data: data,
            borderColor: color,
            backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
        };
    });

    const chartData = {
        labels: timeline.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Commits Timeline',
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: 20
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                },
                title: {
                    display: true,
                    text: 'Number of Commits'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div style={{ height: '300px', marginTop: '20px' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
