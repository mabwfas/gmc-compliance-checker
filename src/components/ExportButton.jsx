function ExportButton({ results }) {
    const generateReport = () => {
        let report = `# GMC Compliance Report\n\n`;
        report += `**Website:** ${results.url}\n`;
        report += `**Scan Date:** ${new Date(results.scanDate).toLocaleString()}\n`;
        report += `**Pages Scanned:** ${results.pagesScanned}\n`;
        report += `**Overall Score:** ${results.score}/100\n\n`;
        report += `---\n\n`;
        report += `## Summary\n\n`;
        report += `- 🔴 **Critical Issues:** ${results.criticalIssues}\n`;
        report += `- 🟡 **Warnings:** ${results.warningIssues}\n`;
        report += `- 🔵 **Info/Tips:** ${results.infoIssues}\n`;
        report += `- 🟢 **Passed Checks:** ${results.passedChecks}\n\n`;
        report += `---\n\n`;

        results.categories.forEach(category => {
            report += `## ${category.name}\n\n`;
            report += `*${category.description}*\n\n`;

            category.issues.forEach(issue => {
                const severityEmoji = {
                    critical: '🔴',
                    warning: '🟡',
                    info: '🔵',
                    pass: '🟢'
                }[issue.severity];

                report += `### ${severityEmoji} ${issue.title}\n\n`;
                report += `**Severity:** ${issue.severity.toUpperCase()}\n\n`;

                if (issue.location) {
                    report += `**Location:** ${issue.location}\n\n`;
                }

                report += `${issue.description}\n\n`;

                if (issue.whyItMatters) {
                    report += `**Why This Matters for GMC:**\n${issue.whyItMatters}\n\n`;
                }

                if (issue.howToFix) {
                    report += `**How to Fix:**\n`;
                    if (typeof issue.howToFix === 'string') {
                        report += `${issue.howToFix}\n\n`;
                    } else {
                        issue.howToFix.forEach((step, i) => {
                            report += `${i + 1}. ${step}\n`;
                        });
                        report += `\n`;
                    }
                }

                if (issue.copyPasteCode) {
                    report += `**Code to Add:**\n\`\`\`html\n${issue.copyPasteCode}\n\`\`\`\n\n`;
                }

                if (issue.suggestions && issue.suggestions.length > 0) {
                    report += `**Suggestions:**\n`;
                    issue.suggestions.forEach(s => {
                        report += `- ${s}\n`;
                    });
                    report += `\n`;
                }

                report += `---\n\n`;
            });
        });

        return report;
    };

    const exportAsJSON = () => {
        const dataStr = JSON.stringify(results, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gmc-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportAsMarkdown = () => {
        const report = generateReport();
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gmc-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyReportToClipboard = () => {
        const report = generateReport();
        navigator.clipboard.writeText(report);
        alert('Report copied to clipboard!');
    };

    return (
        <div className="export-section">
            <button className="export-btn" onClick={exportAsMarkdown}>
                📄 Export as Markdown
            </button>
            <button className="export-btn" onClick={exportAsJSON}>
                📊 Export as JSON
            </button>
            <button className="export-btn" onClick={copyReportToClipboard}>
                📋 Copy Report
            </button>
        </div>
    );
}

export default ExportButton;
