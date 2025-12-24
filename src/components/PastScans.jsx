import { useState } from 'react';

function PastScans({ scans, onSelectScan, onDeleteScan, onClearAll }) {
    const [sortBy, setSortBy] = useState('date'); // 'date', 'score', 'name'
    const [filterScore, setFilterScore] = useState('all'); // 'all', 'good', 'warning', 'critical'

    const filteredScans = scans.filter(scan => {
        if (filterScore === 'all') return true;
        if (filterScore === 'good') return scan.score >= 80;
        if (filterScore === 'warning') return scan.score >= 50 && scan.score < 80;
        if (filterScore === 'critical') return scan.score < 50;
        return true;
    });

    const sortedScans = [...filteredScans].sort((a, b) => {
        if (sortBy === 'date') return new Date(b.scanDate) - new Date(a.scanDate);
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    const getScoreClass = (score) => {
        if (score >= 80) return 'good';
        if (score >= 50) return 'warning';
        return 'critical';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="past-scans-page">
            <div className="past-scans-header">
                <div className="past-scans-title">
                    <h1>📊 Past Scans</h1>
                    <p>{scans.length} scans saved • Data persisted locally</p>
                </div>
                {scans.length > 0 && (
                    <button className="btn-clear-all" onClick={onClearAll}>
                        🗑️ Clear All History
                    </button>
                )}
            </div>

            {/* Filters & Sort */}
            <div className="past-scans-controls">
                <div className="control-group">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date">Most Recent</option>
                        <option value="score">Highest Score</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Filter:</label>
                    <select value={filterScore} onChange={(e) => setFilterScore(e.target.value)}>
                        <option value="all">All Scans</option>
                        <option value="good">✅ Good (80+)</option>
                        <option value="warning">⚠️ Warning (50-79)</option>
                        <option value="critical">🚨 Critical (&lt;50)</option>
                    </select>
                </div>
            </div>

            {sortedScans.length === 0 ? (
                <div className="past-scans-empty">
                    <div className="empty-icon">📭</div>
                    <h3>No scans found</h3>
                    <p>{scans.length === 0 ? 'Start scanning websites to build your history' : 'Try adjusting your filters'}</p>
                </div>
            ) : (
                <div className="past-scans-grid">
                    {sortedScans.map(scan => (
                        <div key={scan.id} className="past-scan-card" onClick={() => onSelectScan(scan)}>
                            <div className="scan-card-header">
                                <div className={`scan-score-badge ${getScoreClass(scan.score)}`}>
                                    {scan.score}
                                </div>
                                <button
                                    className="scan-delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteScan(scan.id, e);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="scan-card-body">
                                <h3>{scan.name}</h3>
                                <p className="scan-url">{scan.url}</p>
                                <p className="scan-date">{formatDate(scan.scanDate)}</p>
                            </div>

                            <div className="scan-card-stats">
                                <div className="scan-stat">
                                    <span className="stat-value critical">{scan.results?.criticalIssues || 0}</span>
                                    <span className="stat-label">Critical</span>
                                </div>
                                <div className="scan-stat">
                                    <span className="stat-value warning">{scan.results?.warningIssues || 0}</span>
                                    <span className="stat-label">Warnings</span>
                                </div>
                                <div className="scan-stat">
                                    <span className="stat-value success">{scan.results?.passedChecks || 0}</span>
                                    <span className="stat-label">Passed</span>
                                </div>
                                <div className="scan-stat">
                                    <span className="stat-value info">{scan.results?.pagesScanned || 0}</span>
                                    <span className="stat-label">Pages</span>
                                </div>
                            </div>

                            <div className="scan-card-footer">
                                <span className="view-details">View Full Report →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PastScans;
