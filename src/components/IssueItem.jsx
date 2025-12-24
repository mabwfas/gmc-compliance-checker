import { useState } from 'react';

function IssueItem({ issue }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const severityIcons = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵',
        pass: '🟢'
    };

    return (
        <div className={`issue-item ${issue.severity}`}>
            <div className="issue-header">
                <div className="issue-title-wrapper">
                    <div className="issue-title">
                        <span>{severityIcons[issue.severity]}</span>
                        <h4>{issue.title}</h4>
                    </div>
                    {issue.location && (
                        <p className="issue-location">📍 {issue.location}</p>
                    )}
                </div>
                <span className={`issue-severity ${issue.severity}`}>
                    {issue.severity.toUpperCase()}
                </span>
            </div>

            <p className="issue-description">{issue.description}</p>

            <div className="issue-details">
                {/* Why It Matters */}
                {issue.whyItMatters && (
                    <div className="issue-detail-box">
                        <div className="issue-detail-label why">
                            ⚠️ Why This Matters for GMC
                        </div>
                        <div className="issue-detail-content">
                            {issue.whyItMatters}
                        </div>
                    </div>
                )}

                {/* How to Fix */}
                {issue.howToFix && (
                    <div className="issue-detail-box">
                        <div className="issue-detail-label fix">
                            ✅ How to Fix
                        </div>
                        <div className="issue-detail-content">
                            {typeof issue.howToFix === 'string' ? (
                                <p>{issue.howToFix}</p>
                            ) : (
                                <ul>
                                    {issue.howToFix.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* Copy-Paste Code */}
                {issue.copyPasteCode && (
                    <div className="issue-detail-box">
                        <div className="issue-detail-label code">
                            📋 Copy & Paste This Code
                        </div>
                        <div className="code-block">
                            <code>{issue.copyPasteCode}</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(issue.copyPasteCode)}
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Improvement Suggestions */}
                {issue.suggestions && issue.suggestions.length > 0 && (
                    <div className="issue-detail-box">
                        <div className="issue-detail-label code">
                            💡 Improvement Suggestions
                        </div>
                        <div className="issue-detail-content">
                            <ul>
                                {issue.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IssueItem;
