import { useState, useMemo } from 'react';
import ExportButton from './ExportButton';

function ResultsDashboard({ results }) {
    const [expandedIssue, setExpandedIssue] = useState(null);
    const [activeTab, setActiveTab] = useState('critical');
    const [copiedCode, setCopiedCode] = useState(null);

    // Get ShopScore data from results
    const shopScoreData = results.shopScoreData || {};
    const totalScore = shopScoreData.totalScore || results.score || 0;
    const { status, statusColor, criticalCount, highCount, mediumCount, lowCount, allIssues } = shopScoreData;

    // GMC specific status
    const gmcStatus = shopScoreData.gmcStatus || 'UNKNOWN';
    const gmcStatusColor = shopScoreData.gmcStatusColor || 'warning';

    // Get categories from results (array of category objects)
    const categories = Array.isArray(results) ? results : results.categories || [];

    // Collect all issues with category info
    const { criticalIssues, warningIssues, passedIssues } = useMemo(() => {
        const critical = [];
        const warning = [];
        const passed = [];

        categories.forEach(cat => {
            (cat.issues || []).forEach(issue => {
                const issueWithCat = { ...issue, category: cat.name };
                if (issue.severity === 'pass') {
                    passed.push(issueWithCat);
                } else if (issue.impact === 'critical' || issue.impact === 'high') {
                    critical.push(issueWithCat);
                } else {
                    warning.push(issueWithCat);
                }
            });
        });

        // Sort by impact
        const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        critical.sort((a, b) => (impactOrder[a.impact] || 99) - (impactOrder[b.impact] || 99));
        warning.sort((a, b) => (impactOrder[a.impact] || 99) - (impactOrder[b.impact] || 99));

        return { criticalIssues: critical, warningIssues: warning, passedIssues: passed };
    }, [categories]);

    // Copy code to clipboard
    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Get status class
    const getStatusClass = (score) => {
        if (score >= 90) return 'good';
        if (score >= 80) return 'nearly';
        if (score >= 60) return 'warning';
        return 'critical';
    };

    // Get score interpretation
    const getScoreInterpretation = (score) => {
        if (score >= 90) return { label: 'Ready for Delivery', desc: 'Minor polish only, can proceed to client', icon: '✅' };
        if (score >= 80) return { label: 'Nearly Ready', desc: 'Fix high-impact items before delivery', icon: '🟡' };
        if (score >= 60) return { label: 'Needs Work', desc: 'Multiple issues to address, re-audit required', icon: '🟠' };
        return { label: 'Not Ready', desc: 'Critical failures, escalate to developer', icon: '🔴' };
    };

    const scoreInfo = getScoreInterpretation(totalScore);

    // Get GMC badge info
    const getGMCBadge = () => {
        if (gmcStatus === 'GMC READY') return { icon: '🟢', text: 'GMC READY', className: 'gmc-ready' };
        if (gmcStatus === 'GMC NEEDS WORK') return { icon: '🟡', text: 'GMC NEEDS WORK', className: 'gmc-warning' };
        return { icon: '🔴', text: 'GMC NOT READY', className: 'gmc-not-ready' };
    };
    const gmcBadge = getGMCBadge();

    // Get impact badge color
    const getImpactColor = (impact) => {
        switch (impact) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#f59e0b';
            case 'low': return '#6366f1';
            default: return '#6b7280';
        }
    };

    return (
        <div className="results-dashboard-v2 shopscore-theme">
            {/* Hero Score Section */}
            <div className="score-hero shopscore">
                <div className="score-hero-left">
                    <div className="big-score-ring">
                        <svg viewBox="0 0 120 120">
                            <circle className="ring-bg" cx="60" cy="60" r="54" />
                            <circle
                                className={`ring-fill ${getStatusClass(totalScore)}`}
                                cx="60" cy="60" r="54"
                                strokeDasharray={`${totalScore * 3.39} 339`}
                            />
                        </svg>
                        <div className="score-center">
                            <span className="score-value">{totalScore}</span>
                            <span className="score-max">/100</span>
                        </div>
                    </div>
                    <div className="score-info">
                        <h1>ShopScore v2.0 Audit Report</h1>
                        <p className={`score-status ${getStatusClass(totalScore)}`}>
                            {scoreInfo.icon} {scoreInfo.label}
                        </p>
                        <p className="score-desc">{scoreInfo.desc}</p>
                        {/* GMC Status Badge */}
                        <div className={`gmc-status-badge ${gmcBadge.className}`}>
                            <span className="gmc-icon">{gmcBadge.icon}</span>
                            <span className="gmc-text">{gmcBadge.text}</span>
                        </div>
                        <div className="scan-meta">
                            {results.platform && (
                                <span className="meta-chip platform" style={{ background: results.platform.color }}>
                                    {results.platform.icon} {results.platform.name}
                                </span>
                            )}
                            <span className="meta-chip">{results.pagesScanned || 0} pages scanned</span>
                            <span className="meta-chip">{new Date(results.scanDate || Date.now()).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="score-hero-right">
                    <ExportButton results={results} />
                </div>
            </div>

            {/* Category Score Cards */}
            <div className="category-scores-grid">
                {categories.map((cat, idx) => {
                    const catScore = cat.score || 0;
                    const catMax = cat.maxPoints || 20;
                    const catPercent = Math.round((catScore / catMax) * 100);
                    return (
                        <div key={idx} className={`category-score-card ${getStatusClass(catPercent)}`}>
                            <div className="cat-score-header">
                                <span className="cat-score-name">{cat.name}</span>
                                <span className="cat-score-value">{catScore}/{catMax}</span>
                            </div>
                            <div className="cat-score-bar">
                                <div
                                    className="cat-score-fill"
                                    style={{ width: `${catPercent}%` }}
                                ></div>
                            </div>
                            <div className="cat-score-issues">
                                {cat.issues?.filter(i => i.severity !== 'pass').length || 0} issues
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Issue Summary Cards */}
            <div className="issue-summary-grid">
                <div className={`summary-card critical ${activeTab === 'critical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('critical')}>
                    <div className="summary-icon">🚨</div>
                    <div className="summary-content">
                        <div className="summary-count">{criticalIssues.length}</div>
                        <div className="summary-label">Critical/High</div>
                        <div className="summary-desc">Must fix before delivery</div>
                    </div>
                </div>
                <div className={`summary-card warning ${activeTab === 'warning' ? 'active' : ''}`}
                    onClick={() => setActiveTab('warning')}>
                    <div className="summary-icon">⚠️</div>
                    <div className="summary-content">
                        <div className="summary-count">{warningIssues.length}</div>
                        <div className="summary-label">Medium/Low</div>
                        <div className="summary-desc">Recommended improvements</div>
                    </div>
                </div>
                <div className={`summary-card passed ${activeTab === 'passed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('passed')}>
                    <div className="summary-icon">✅</div>
                    <div className="summary-content">
                        <div className="summary-count">{passedIssues.length}</div>
                        <div className="summary-label">Passed</div>
                        <div className="summary-desc">Meeting quality standards</div>
                    </div>
                </div>
                <div className={`summary-card categories ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}>
                    <div className="summary-icon">📊</div>
                    <div className="summary-content">
                        <div className="summary-count">{categories.length}</div>
                        <div className="summary-label">Categories</div>
                        <div className="summary-desc">Detailed breakdown</div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-content">
                {/* Critical/High Issues Tab */}
                {activeTab === 'critical' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>🚨 Critical & High Priority Issues ({criticalIssues.length})</h2>
                            <p>These issues must be fixed before client delivery.</p>
                        </div>
                        <div className="issues-list">
                            {criticalIssues.map((issue, idx) => (
                                <div key={idx} className={`issue-card ${issue.impact || 'critical'} ${expandedIssue === `c-${idx}` ? 'expanded' : ''}`}>
                                    <div className="issue-card-header" onClick={() => setExpandedIssue(expandedIssue === `c-${idx}` ? null : `c-${idx}`)}>
                                        <div className="issue-priority">
                                            <span className="priority-badge" style={{ background: getImpactColor(issue.impact) }}>
                                                {(issue.impact || 'critical').toUpperCase()}
                                            </span>
                                            <span className="issue-category">{issue.category}</span>
                                        </div>
                                        <h3 className="issue-title">{issue.title}</h3>
                                        <p className="issue-description">{issue.description}</p>
                                        {issue.location && (
                                            <p className="issue-location">📍 {issue.location}</p>
                                        )}
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
                                                        <h4>📋 Copy-Paste Code</h4>
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
                                        </div>
                                    )}
                                </div>
                            ))}
                            {criticalIssues.length === 0 && (
                                <div className="empty-state success">
                                    <span className="empty-icon">🎉</span>
                                    <h3>No Critical Issues!</h3>
                                    <p>No critical or high priority issues found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Medium/Low Issues Tab */}
                {activeTab === 'warning' && (
                    <div className="issues-section">
                        <div className="section-header">
                            <h2>⚠️ Medium & Low Priority Issues ({warningIssues.length})</h2>
                            <p>Recommended improvements for better quality.</p>
                        </div>
                        <div className="issues-list">
                            {warningIssues.map((issue, idx) => (
                                <div key={idx} className={`issue-card ${issue.impact || 'medium'} ${expandedIssue === `w-${idx}` ? 'expanded' : ''}`}>
                                    <div className="issue-card-header" onClick={() => setExpandedIssue(expandedIssue === `w-${idx}` ? null : `w-${idx}`)}>
                                        <div className="issue-priority">
                                            <span className="priority-badge" style={{ background: getImpactColor(issue.impact) }}>
                                                {(issue.impact || 'medium').toUpperCase()}
                                            </span>
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
                                                        <h4>📋 Copy-Paste Code</h4>
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
                                    <p>All medium and low priority checks passed.</p>
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
                            <p>These items meet quality standards.</p>
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
                            <p>Detailed scores and issues by category</p>
                        </div>
                        <div className="category-grid">
                            {categories.map((cat, idx) => {
                                const catIssues = cat.issues?.filter(i => i.severity !== 'pass') || [];
                                const catPassed = cat.issues?.filter(i => i.severity === 'pass') || [];
                                const catScore = cat.score || 0;
                                const catMax = cat.maxPoints || 20;
                                const catPercent = Math.round((catScore / catMax) * 100);

                                return (
                                    <div key={idx} className={`category-card ${getStatusClass(catPercent)}`}>
                                        <div className="category-header">
                                            <h3>{cat.name}</h3>
                                            <span className={`category-score ${getStatusClass(catPercent)}`}>
                                                {catScore}/{catMax} pts
                                            </span>
                                        </div>
                                        <div className="category-bar">
                                            <div className="bar-fill" style={{ width: `${catPercent}%` }}></div>
                                        </div>
                                        <div className="category-stats">
                                            {catIssues.filter(i => i.impact === 'critical').length > 0 && (
                                                <span className="cat-stat critical">
                                                    {catIssues.filter(i => i.impact === 'critical').length} Critical
                                                </span>
                                            )}
                                            {catIssues.filter(i => i.impact === 'high').length > 0 && (
                                                <span className="cat-stat high">
                                                    {catIssues.filter(i => i.impact === 'high').length} High
                                                </span>
                                            )}
                                            {catIssues.filter(i => i.impact === 'medium').length > 0 && (
                                                <span className="cat-stat medium">
                                                    {catIssues.filter(i => i.impact === 'medium').length} Medium
                                                </span>
                                            )}
                                            {catPassed.length > 0 && (
                                                <span className="cat-stat passed">
                                                    {catPassed.length} Passed
                                                </span>
                                            )}
                                        </div>
                                        <div className="category-issues">
                                            {catIssues.slice(0, 3).map((issue, i) => (
                                                <div key={i} className={`mini-issue ${issue.impact}`}>
                                                    <span className="mini-dot"></span>
                                                    {issue.title}
                                                </div>
                                            ))}
                                            {catIssues.length > 3 && (
                                                <div className="mini-issue more">
                                                    +{catIssues.length - 3} more issues
                                                </div>
                                            )}
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
