import React from 'react';

export default function StatsCard({ title, value, icon, colorClass, change, changeType = 'neutral' }) {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <span className="stat-title">{title}</span>
                <div className={`stat-icon ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div className="stat-value">{value}</div>
            {change && (
                <span className={`stat-change ${changeType}`}>
                    {changeType === 'positive' && '↑ '}{changeType === 'negative' && '↓ '}{change}
                </span>
            )}
        </div>
    );
}
