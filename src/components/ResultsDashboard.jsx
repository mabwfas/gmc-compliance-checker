import { useState, useMemo } from 'react';
import ExportButton from './ExportButton';

function ResultsDashboard({ results }) {
    const [expandedIssue, setExpandedIssue] = useState(null);
    const [activeTab, setActiveTab] = useState('critical');
    const [copiedCode, setCopiedCode] = useState(null);

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

    // Copy code to clipboard
    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Get priority score for sorting
    const getPriorityScore = (issue) => {
        let score = 0;
        if (issue.severity === 'critical') score += 100;
        if (issue.severity === 'warning') score += 50;
        if (issue.category?.includes('Policy')) score += 30;
        if (issue.category?.includes('Product')) score += 20;
        return score;
    };

    // Get status class
    const getStatusClass = (score) => {
        if (score >= 80) return 'good';
        if (score >= 50) return 'warning';
        return 'critical';
    };

    // Priority sorted issues
    const sortedCritical = [...criticalIssues].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    const sortedWarning = [...warningIssues].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

    return (
        <div className="results-dashboard-v2">
            {/* Hero Score Section */}
            <div className="score-hero">
                <div className="score-hero-left">
                    <div className="big-score-ring">
                        <svg viewBox="0 0 120 120">
                            <circle className="ring-bg" cx="60" cy="60" r="54" />
                            <circle
                                className={`ring-fill ${getStatusClass(results.score)}`}
                                cx="60" cy="60" r="54"
                                strokeDasharray={`${results.score * 3.39} 339`}
                            />
                        </svg>
                        <div className="score-center">
                            <span className="score-value">{results.score}</span>
                            <span className="score-max">/100</span>
                        </div>
                    </div>
                    <div className="score-info">
                        <h1>GMC Compliance Score</h1>
                        <p className={`score-status ${getStatusClass(results.score)}`}>
                            {results.score >= 80 ? '✅ Ready for Merchant Center' :
                                results.score >= 50 ? '⚠️ Needs Improvement' : '🚨 Not GMC Ready'}
                        </p>
                        <div className="scan-meta">
                            {results.platform && (
                                <span className="meta-chip platform" style={{ background: results.platform.color }}>
                                    {results.platform.icon} {results.platform.name}
                                </span>
                            )}
                            <span className="meta-chip">{results.pagesScanned} pages scanned</span>
                            <span className="meta-chip">{new Date(results.scanDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="score-hero-right">
                    <ExportButton results={results} />
                </div>
            </div>

            {/* Issue Summary Cards */}
            <div className="issue-summary-grid">
                <div className={`summary-card critical ${activeTab === 'critical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('critical')}>
                    <div className="summary-icon">🚨</div>
                    <div className="summary-content">
                        <div className="summary-count">{criticalIssues.length}</div>
                        <div className="summary-label">Critical Issues</div>
                        <div className="summary-desc">Must fix before GMC approval</div>
                    </div>
                </div>
                <div className={`summary-card warning ${activeTab === 'warning' ? 'active' : ''}`}
                    onClick={() => setActiveTab('warning')}>
                    <div className="summary-icon">⚠️</div>
                    <div className="summary-content">
                        <div className="summary-count">{warningIssues.length}</div>
                        <div className="summary-label">Warnings</div>
                        <div className="summary-desc">Recommended improvements</div>
                    </div>
                </div>
                <div className={`summary-card passed ${activeTab === 'passed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('passed')}>
                    <div className="summary-icon">✅</div>
                    <div className="summary-content">
                        <div className="summary-count">{passedIssues.length}</div>
                        <div className="summary-label">Passed Checks</div>
                        <div className="summary-desc">Meeting GMC requirements</div>
                    </div>
                </div>
                <div className="summary-card categories" onClick={() => setActiveTab('categories')}>
                    <div className="summary-icon">📊</div>
                    <div className="summary-content">
                        <div className="summary-count">{results.categories.length}</div>
                        <div className="summary-label">Categories</div>
                        <div className="summary-desc">Detailed breakdown</div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-content">
                {/* Critical Issues Tab */}
                {activeTab === 'critical' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>🚨 Critical Issues ({criticalIssues.length})</h2>
                            <p>These issues will cause your GMC account to be disapproved. Fix them immediately.</p>
                        </div>
                        <div className="issues-list">
                            {sortedCritical.map((issue, idx) => (
                                <div key={idx} className={`issue-card critical ${expandedIssue === `c-${idx}` ? 'expanded' : ''}`}>
                                    <div className="issue-card-header" onClick={() => setExpandedIssue(expandedIssue === `c-${idx}` ? null : `c-${idx}`)}>
                                        <div className="issue-priority">
                                            <span className="priority-badge critical">CRITICAL</span>
                                            <span className="issue-category">{issue.category}</span>
                                        </div>
                                        <h3 className="issue-title">{issue.title}</h3>
                                        <p className="issue-description">{issue.description}</p>
                                        <div className="issue-actions">
                                            <button className="expand-btn">
                                                {expandedIssue === `c-${idx}` ? '▲ Hide Fix' : '▼ Show Fix'}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedIssue === `c-${idx}` && (
                                        <div className="issue-details">
                                            {issue.whyItMatters && (
                                                <div className="detail-block why">
                                                    <h4>⚠️ Why This Matters</h4>
                                                    <p>{issue.whyItMatters}</p>
                                                </div>
                                            )}
                                            {issue.howToFix && (
                                                <div className="detail-block how">
                                                    <h4>🔧 How To Fix</h4>
                                                    {Array.isArray(issue.howToFix) ? (
                                                        <ol>
                                                            {issue.howToFix.map((step, i) => (
                                                                <li key={i}>{step}</li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <p>{issue.howToFix}</p>
                                                    )}
                                                </div>
                                            )}
                                            {issue.copyPasteCode && (
                                                <div className="detail-block code">
                                                    <div className="code-header">
                                                        <h4>📋 Copy-Paste Fix</h4>
                                                        <button
                                                            className={`copy-btn ${copiedCode === `c-${idx}` ? 'copied' : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); copyCode(issue.copyPasteCode, `c-${idx}`); }}
                                                        >
                                                            {copiedCode === `c-${idx}` ? '✓ Copied!' : 'Copy Code'}
                                                        </button>
                                                    </div>
                                                    <pre><code>{issue.copyPasteCode}</code></pre>
                                                </div>
                                            )}
                                            {issue.location && (
                                                <div className="detail-block location">
                                                    <h4>📍 Location</h4>
                                                    <a href={issue.location} target="_blank" rel="noopener noreferrer">
                                                        {issue.location}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {criticalIssues.length === 0 && (
                                <div className="empty-state success">
                                    <span className="empty-icon">🎉</span>
                                    <h3>No Critical Issues!</h3>
                                    <p>Your store has no critical compliance issues.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Warning Issues Tab */}
                {activeTab === 'warning' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>⚠️ Warnings ({warningIssues.length})</h2>
                            <p>These issues may affect your GMC performance. Fixing them is recommended.</p>
                        </div>
                        <div className="issues-list">
                            {sortedWarning.map((issue, idx) => (
                                <div key={idx} className={`issue-card warning ${expandedIssue === `w-${idx}` ? 'expanded' : ''}`}>
                                    <div className="issue-card-header" onClick={() => setExpandedIssue(expandedIssue === `w-${idx}` ? null : `w-${idx}`)}>
                                        <div className="issue-priority">
                                            <span className="priority-badge warning">WARNING</span>
                                            <span className="issue-category">{issue.category}</span>
                                        </div>
                                        <h3 className="issue-title">{issue.title}</h3>
                                        <p className="issue-description">{issue.description}</p>
                                        <div className="issue-actions">
                                            <button className="expand-btn">
                                                {expandedIssue === `w-${idx}` ? '▲ Hide Fix' : '▼ Show Fix'}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedIssue === `w-${idx}` && (
                                        <div className="issue-details">
                                            {issue.whyItMatters && (
                                                <div className="detail-block why">
                                                    <h4>⚠️ Why This Matters</h4>
                                                    <p>{issue.whyItMatters}</p>
                                                </div>
                                            )}
                                            {issue.howToFix && (
                                                <div className="detail-block how">
                                                    <h4>🔧 How To Fix</h4>
                                                    {Array.isArray(issue.howToFix) ? (
                                                        <ol>
                                                            {issue.howToFix.map((step, i) => (
                                                                <li key={i}>{step}</li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <p>{issue.howToFix}</p>
                                                    )}
                                                </div>
                                            )}
                                            {issue.copyPasteCode && (
                                                <div className="detail-block code">
                                                    <div className="code-header">
                                                        <h4>📋 Copy-Paste Fix</h4>
                                                        <button
                                                            className={`copy-btn ${copiedCode === `w-${idx}` ? 'copied' : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); copyCode(issue.copyPasteCode, `w-${idx}`); }}
                                                        >
                                                            {copiedCode === `w-${idx}` ? '✓ Copied!' : 'Copy Code'}
                                                        </button>
                                                    </div>
                                                    <pre><code>{issue.copyPasteCode}</code></pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {warningIssues.length === 0 && (
                                <div className="empty-state success">
                                    <span className="empty-icon">✨</span>
                                    <h3>No Warnings!</h3>
                                    <p>Your store meets all recommended practices.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Passed Checks Tab */}
                {activeTab === 'passed' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>✅ Passed Checks ({passedIssues.length})</h2>
                            <p>These compliance checks are already met. Great job!</p>
                        </div>
                        <div className="passed-grid">
                            {passedIssues.map((issue, idx) => (
                                <div key={idx} className="passed-card">
                                    <span className="passed-icon">✓</span>
                                    <div className="passed-info">
                                        <div className="passed-title">{issue.title}</div>
                                        <div className="passed-category">{issue.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>📊 Category Breakdown</h2>
                            <p>Detailed compliance status by category</p>
                        </div>
                        <div className="category-grid">
                            {results.categories.map((cat, idx) => {
                                const catCritical = cat.issues.filter(i => i.severity === 'critical').length;
                                const catWarning = cat.issues.filter(i => i.severity === 'warning').length;
                                const catPassed = cat.issues.filter(i => i.severity === 'pass').length;
                                const total = catCritical + catWarning + catPassed;
                                const catScore = total > 0 ? Math.round((catPassed / total) * 100) : 100;

                                return (
                                    <div key={idx} className={`category-card ${getStatusClass(catScore)}`}>
                                        <div className="category-header">
                                            <h3>{cat.name}</h3>
                                            <span className={`category-score ${getStatusClass(catScore)}`}>
                                                {catScore}%
                                            </span>
                                        </div>
                                        <div className="category-bar">
                                            <div className="bar-fill" style={{ width: `${catScore}%` }}></div>
                                        </div>
                                        <div className="category-stats">
                                            {catCritical > 0 && (
                                                <span className="cat-stat critical">{catCritical} Critical</span>
                                            )}
                                            {catWarning > 0 && (
                                                <span className="cat-stat warning">{catWarning} Warning</span>
                                            )}
                                            {catPassed > 0 && (
                                                <span className="cat-stat passed">{catPassed} Passed</span>
                                            )}
                                        </div>
                                        <div className="category-issues">
                                            {cat.issues.filter(i => i.severity !== 'pass').slice(0, 3).map((issue, i) => (
                                                <div key={i} className={`mini-issue ${issue.severity}`}>
                                                    <span className="mini-dot"></span>
                                                    {issue.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-summary">
                    <span className="action-count">{criticalIssues.length + warningIssues.length}</span>
                    <span className="action-text">issues to fix</span>
                </div>
                <div className="action-buttons">
                    <button className="action-btn secondary" onClick={() => window.print()}>
                        🖨️ Print Report
                    </button>
                    <button className="action-btn primary" onClick={() => setActiveTab('critical')}>
                        🔧 Start Fixing Issues
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResultsDashboard;
