import { useState, useMemo } from 'react';
import ExportButton from './ExportButton';

function ResultsDashboard({ results }) {
    const [expandedIssue, setExpandedIssue] = useState(null);

    const getScoreStatus = (score) => {
        if (score >= 80) return { text: 'Ready', class: 'good' };
        if (score >= 50) return { text: 'Warning', class: 'warning' };
        return { text: 'Critical', class: 'critical' };
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--critical)';
    };

    // Get all issues flattened with category info
    const allIssues = useMemo(() => {
        const issues = [];
        results.categories.forEach(cat => {
            cat.issues.forEach(issue => {
                issues.push({ ...issue, category: cat.name });
            });
        });
        return issues;
    }, [results.categories]);

    // Separate by severity
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const warningIssues = allIssues.filter(i => i.severity === 'warning');
    const passedIssues = allIssues.filter(i => i.severity === 'pass');

    const scoreStatus = getScoreStatus(results.score);

    const toggleIssue = (issueId) => {
        setExpandedIssue(expandedIssue === issueId ? null : issueId);
    };

    // Format URL for display
    const formatUrl = (url) => {
        if (!url) return '-';
        try {
            const parsed = new URL(url);
            return parsed.pathname.substring(0, 30) + (parsed.pathname.length > 30 ? '...' : '');
        } catch {
            return url.substring(0, 30);
        }
    };

    // Copy code to clipboard
    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="tabular-dashboard">
            {/* Compact Header Row */}
            <div className="dash-header-row">
                <div className="dash-header-left">
                    <div className="dash-title-block">
                        <h1>Compliance Report</h1>
                        <div className="dash-meta">
                            {results.platform && (
                                <span className="platform-chip" style={{ background: results.platform.color }}>
                                    {results.platform.icon} {results.platform.name}
                                </span>
                            )}
                            <span className="meta-item">{results.url}</span>
                            <span className="meta-item">{results.pagesScanned} pages</span>
                            <span className="meta-item">{new Date(results.scanDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <ExportButton results={results} />
            </div>

            {/* Scores Table */}
            <div className="scores-table-container">
                <table className="scores-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="score-row compliance">
                            <td><span className="metric-icon">✅</span> GMC Compliance</td>
                            <td className={`score-cell ${scoreStatus.class}`}>{results.score}/100</td>
                            <td><span className={`status-badge ${scoreStatus.class}`}>{scoreStatus.text}</span></td>
                            <td>
                                <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${results.score}%`, background: getScoreColor(results.score) }}></div></div>
                            </td>
                        </tr>
                        <tr className="score-row design">
                            <td><span className="metric-icon">🎨</span> Design Quality</td>
                            <td className={`score-cell ${(results.categoryScores?.design || 0) >= 70 ? 'good' : (results.categoryScores?.design || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {results.categoryScores?.design || 0}/100
                            </td>
                            <td><span className={`status-badge ${(results.categoryScores?.design || 0) >= 70 ? 'good' : (results.categoryScores?.design || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {(results.categoryScores?.design || 0) >= 70 ? 'Good' : (results.categoryScores?.design || 0) >= 40 ? 'Fair' : 'Poor'}
                            </span></td>
                            <td>
                                <div className="mini-bar"><div className="mini-bar-fill design" style={{ width: `${results.categoryScores?.design || 0}%` }}></div></div>
                            </td>
                        </tr>
                        <tr className="score-row copywriting">
                            <td><span className="metric-icon">✍️</span> Copywriting</td>
                            <td className={`score-cell ${(results.categoryScores?.copywriting || 0) >= 70 ? 'good' : (results.categoryScores?.copywriting || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {results.categoryScores?.copywriting || 0}/100
                            </td>
                            <td><span className={`status-badge ${(results.categoryScores?.copywriting || 0) >= 70 ? 'good' : (results.categoryScores?.copywriting || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {(results.categoryScores?.copywriting || 0) >= 70 ? 'Good' : (results.categoryScores?.copywriting || 0) >= 40 ? 'Fair' : 'Poor'}
                            </span></td>
                            <td>
                                <div className="mini-bar"><div className="mini-bar-fill copywriting" style={{ width: `${results.categoryScores?.copywriting || 0}%` }}></div></div>
                            </td>
                        </tr>
                        <tr className="score-row ux">
                            <td><span className="metric-icon">👤</span> User Experience</td>
                            <td className={`score-cell ${(results.categoryScores?.ux || 0) >= 70 ? 'good' : (results.categoryScores?.ux || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {results.categoryScores?.ux || 0}/100
                            </td>
                            <td><span className={`status-badge ${(results.categoryScores?.ux || 0) >= 70 ? 'good' : (results.categoryScores?.ux || 0) >= 40 ? 'warning' : 'critical'}`}>
                                {(results.categoryScores?.ux || 0) >= 70 ? 'Good' : (results.categoryScores?.ux || 0) >= 40 ? 'Fair' : 'Poor'}
                            </span></td>
                            <td>
                                <div className="mini-bar"><div className="mini-bar-fill ux" style={{ width: `${results.categoryScores?.ux || 0}%` }}></div></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Quick Stats Row */}
            <div className="stats-mini-row">
                <div className="stat-chip critical">
                    <span className="chip-num">{results.criticalIssues}</span>
                    <span className="chip-label">Critical</span>
                </div>
                <div className="stat-chip warning">
                    <span className="chip-num">{results.warningIssues}</span>
                    <span className="chip-label">Warnings</span>
                </div>
                <div className="stat-chip info">
                    <span className="chip-num">{results.infoIssues || 0}</span>
                    <span className="chip-label">Info</span>
                </div>
                <div className="stat-chip success">
                    <span className="chip-num">{results.passedChecks}</span>
                    <span className="chip-label">Passed</span>
                </div>
            </div>

            {/* Two Column Layout: Issues Table + Categories */}
            <div className="dual-panel-layout">
                {/* Left: Issues Table */}
                <div className="issues-panel">
                    <h3 className="panel-title">🚨 Issues Found ({criticalIssues.length + warningIssues.length})</h3>
                    <div className="issues-table-container">
                        <table className="issues-table">
                            <thead>
                                <tr>
                                    <th>Severity</th>
                                    <th>Issue</th>
                                    <th>Category</th>
                                    <th>Location</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {criticalIssues.map((issue, idx) => (
                                    <tr key={`c-${idx}`} className="issue-row critical" onClick={() => toggleIssue(`c-${idx}`)}>
                                        <td><span className="severity-dot critical"></span></td>
                                        <td className="issue-title-cell">{issue.title}</td>
                                        <td className="issue-cat-cell">{issue.category}</td>
                                        <td className="issue-loc-cell">{formatUrl(issue.location)}</td>
                                        <td><button className="fix-btn">Fix →</button></td>
                                    </tr>
                                ))}
                                {warningIssues.map((issue, idx) => (
                                    <tr key={`w-${idx}`} className="issue-row warning" onClick={() => toggleIssue(`w-${idx}`)}>
                                        <td><span className="severity-dot warning"></span></td>
                                        <td className="issue-title-cell">{issue.title}</td>
                                        <td className="issue-cat-cell">{issue.category}</td>
                                        <td className="issue-loc-cell">{formatUrl(issue.location)}</td>
                                        <td><button className="fix-btn">Fix →</button></td>
                                    </tr>
                                ))}
                                {criticalIssues.length === 0 && warningIssues.length === 0 && (
                                    <tr><td colSpan="5" className="no-issues">✅ No issues found!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Categories Grid */}
                <div className="categories-panel">
                    <h3 className="panel-title">📂 Check Categories</h3>
                    <div className="categories-grid">
                        {results.categories.map((cat, idx) => {
                            const catCritical = cat.issues.filter(i => i.severity === 'critical').length;
                            const catWarning = cat.issues.filter(i => i.severity === 'warning').length;
                            const catPassed = cat.issues.filter(i => i.severity === 'pass').length;
                            return (
                                <div key={idx} className="cat-card">
                                    <div className="cat-name">{cat.name}</div>
                                    <div className="cat-counts">
                                        {catCritical > 0 && <span className="count critical">{catCritical}C</span>}
                                        {catWarning > 0 && <span className="count warning">{catWarning}W</span>}
                                        {catPassed > 0 && <span className="count success">{catPassed}P</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Passed Checks Table */}
            {passedIssues.length > 0 && (
                <div className="passed-panel">
                    <h3 className="panel-title">✅ Passed Checks ({passedIssues.length})</h3>
                    <div className="passed-chips">
                        {passedIssues.slice(0, 20).map((issue, idx) => (
                            <span key={idx} className="passed-chip">
                                ✓ {issue.title}
                            </span>
                        ))}
                        {passedIssues.length > 20 && (
                            <span className="passed-chip more">+{passedIssues.length - 20} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Expanded Issue Details Modal */}
            {expandedIssue && (
                <div className="issue-modal-overlay" onClick={() => setExpandedIssue(null)}>
                    <div className="issue-modal" onClick={e => e.stopPropagation()}>
                        {(() => {
                            const [type, idxStr] = expandedIssue.split('-');
                            const idx = parseInt(idxStr);
                            const issue = type === 'c' ? criticalIssues[idx] : warningIssues[idx];
                            if (!issue) return null;
                            return (
                                <>
                                    <div className="modal-header">
                                        <span className={`severity-badge ${issue.severity}`}>{issue.severity.toUpperCase()}</span>
                                        <h3>{issue.title}</h3>
                                        <button className="close-btn" onClick={() => setExpandedIssue(null)}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="modal-row">
                                            <strong>Category:</strong> {issue.category}
                                        </div>
                                        <div className="modal-row">
                                            <strong>Location:</strong>
                                            <a href={issue.location} target="_blank" rel="noopener noreferrer">{issue.location}</a>
                                        </div>
                                        <div className="modal-row">
                                            <strong>Description:</strong> {issue.description}
                                        </div>
                                        {issue.whyItMatters && (
                                            <div className="modal-section why">
                                                <strong>⚠️ Why It Matters:</strong>
                                                <p>{issue.whyItMatters}</p>
                                            </div>
                                        )}
                                        {issue.howToFix && (
                                            <div className="modal-section fix">
                                                <strong>🔧 How To Fix:</strong>
                                                {Array.isArray(issue.howToFix) ? (
                                                    <ol>{issue.howToFix.map((step, i) => <li key={i}>{step}</li>)}</ol>
                                                ) : <p>{issue.howToFix}</p>}
                                            </div>
                                        )}
                                        {issue.copyPasteCode && (
                                            <div className="modal-section code">
                                                <div className="code-header">
                                                    <strong>📋 Code:</strong>
                                                    <button onClick={() => copyCode(issue.copyPasteCode)}>Copy</button>
                                                </div>
                                                <pre><code>{issue.copyPasteCode}</code></pre>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResultsDashboard;
