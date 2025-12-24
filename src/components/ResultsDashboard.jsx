import { useState } from 'react';
import CategoryCard from './CategoryCard';
import ExportButton from './ExportButton';

function ResultsDashboard({ results }) {
    const getScoreStatus = (score) => {
        if (score >= 80) return { text: 'GMC Ready!', class: 'good' };
        if (score >= 50) return { text: 'Needs Improvement', class: 'warning' };
        return { text: 'Critical Issues Found', class: 'critical' };
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--critical)';
    };

    const scoreStatus = getScoreStatus(results.score);

    return (
        <div className="results-dashboard fade-in">
            {/* Score Card */}
            <div className="score-card">
                <div
                    className="score-circle"
                    style={{
                        '--score-percent': `${results.score}%`,
                        '--score-color': getScoreColor(results.score)
                    }}
                >
                    <div>
                        <div className="score-value">{results.score}</div>
                        <div className="score-label">out of 100</div>
                    </div>
                </div>

                <h2>GMC Compliance Score</h2>
                <p className={`score-status ${scoreStatus.class}`}>{scoreStatus.text}</p>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value critical">{results.criticalIssues}</div>
                        <div className="stat-label">Critical Issues</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value warning">{results.warningIssues}</div>
                        <div className="stat-label">Warnings</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value info">{results.infoIssues}</div>
                        <div className="stat-label">Info/Tips</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value success">{results.passedChecks}</div>
                        <div className="stat-label">Passed Checks</div>
                    </div>
                </div>
            </div>

            {/* Category Cards */}
            <div className="categories-grid">
                {results.categories.map((category, index) => (
                    <CategoryCard key={index} category={category} />
                ))}
            </div>

            {/* Export Section */}
            <ExportButton results={results} />
        </div>
    );
}

export default ResultsDashboard;
