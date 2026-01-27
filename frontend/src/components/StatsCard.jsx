import React from 'react';

export default function StatsCard({ title, value, icon, colorClass, subtext }) {
    return (
        <div className="card stat-card">
            <div className="stat-content">
                <h3>{title}</h3>
                <p className="value">{value}</p>
                {subtext && <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#64748b' }}>{subtext}</p>}
            </div>
            <div className={`stat-icon ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
}
