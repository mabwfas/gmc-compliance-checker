import { useState, useEffect, useRef } from 'react';

function ScanProgress({ progress }) {
    const consoleRef = useRef(null);
    const [metrics, setMetrics] = useState({
        pagesScanned: 0,
        requestsSent: 0,
        dataReceived: '0 KB',
        checksPassed: 0,
        checksRunning: 0
    });

    // HeroScore v3.0 - 10 categories with specific checkpoints
    const checkCategories = [
        // Core Quality Checks (50pts)
        {
            name: 'Essential Pages',
            icon: '📜',
            checks: ['Privacy', 'Refund', 'Shipping', 'Terms', 'Contact'],
            threshold: 0,
            points: 15,
            group: 'core'
        },
        {
            name: 'Navigation',
            icon: '🧭',
            checks: ['Header', 'Footer', 'Menu', 'Search'],
            threshold: 8,
            points: 10,
            group: 'core'
        },
        {
            name: 'Content',
            icon: '📝',
            checks: ['Homepage', 'Products', 'Meta'],
            threshold: 16,
            points: 10,
            group: 'core'
        },
        {
            name: 'Technical',
            icon: '⚙️',
            checks: ['Cart', 'Checkout', 'Speed'],
            threshold: 24,
            points: 5,
            group: 'core'
        },
        {
            name: 'GMC Ready',
            icon: '🛒',
            checks: ['Business', 'Policies', 'Schema'],
            threshold: 32,
            points: 10,
            group: 'core'
        },
        // Brand Focused Checks (50pts)
        {
            name: 'Trust Signals',
            icon: '🏆',
            checks: ['Reviews', 'Badges', 'Social Proof', 'Contact'],
            threshold: 40,
            points: 15,
            group: 'brand'
        },
        {
            name: 'Brand',
            icon: '🎨',
            checks: ['Logo', 'Colors', 'Fonts', 'Tagline'],
            threshold: 50,
            points: 10,
            group: 'brand'
        },
        {
            name: 'Visual',
            icon: '✨',
            checks: ['Images', 'Layout', 'Buttons'],
            threshold: 60,
            points: 10,
            group: 'brand'
        },
        {
            name: 'Conversion',
            icon: '🎯',
            checks: ['CTAs', 'Hero', 'Email', 'Urgency'],
            threshold: 70,
            points: 10,
            group: 'brand'
        },
        {
            name: 'Mobile',
            icon: '📱',
            checks: ['Viewport', 'Responsive', 'Touch'],
            threshold: 82,
            points: 10,
            group: 'brand'
        }
    ];

    // Update metrics based on progress
    useEffect(() => {
        setMetrics({
            pagesScanned: Math.floor(progress.percent / 10),
            requestsSent: Math.floor(progress.percent * 2),
            dataReceived: `${Math.floor(progress.percent * 15)} KB`,
            checksPassed: Math.floor(progress.percent / 8),
            checksRunning: progress.percent < 100 ? 5 : 0
        });
    }, [progress.percent]);

    // Auto-scroll console
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [progress.logs]);

    // Get check status
    const getCheckStatus = (threshold) => {
        if (progress.percent >= threshold + 15) return 'complete';
        if (progress.percent >= threshold) return 'active';
        return 'pending';
    };

    // Get sub-check status
    const getSubCheckStatus = (threshold, index, totalChecks) => {
        const checkRange = 15;
        const subThreshold = threshold + (index * (checkRange / totalChecks));
        if (progress.percent >= subThreshold + (checkRange / totalChecks)) return 'complete';
        if (progress.percent >= subThreshold) return 'active';
        return 'pending';
    };

    return (
        <div className="scan-dashboard-v2">
            {/* Top Status Bar */}
            <div className="scan-status-bar">
                <div className="status-left">
                    <span className="status-indicator active"></span>
                    <span className="status-text">AUDITING</span>
                </div>
                <div className="status-center">
                    <span className="current-task">{progress.currentTask || 'Initializing HeroScore...'}</span>
                </div>
                <div className="status-right">
                    <span className="percent-display">{Math.round(progress.percent)}%</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="scan-main-grid">
                {/* Left: Check Categories */}
                <div className="checks-column">
                    <div className="column-header">
                        <span className="column-icon">🦸</span>
                        <span>HeroScore Audit</span>
                    </div>
                    <div className="checks-grid">
                        {checkCategories.map((cat, idx) => {
                            const status = getCheckStatus(cat.threshold);
                            return (
                                <div key={idx} className={`check-category-card ${status}`}>
                                    <div className="cat-header">
                                        <span className="cat-icon">{cat.icon}</span>
                                        <span className="cat-name">{cat.name}</span>
                                        <span className="cat-points">{cat.points}pts</span>
                                        <span className="cat-status-icon">
                                            {status === 'complete' ? '✓' : status === 'active' ? '◌' : '○'}
                                        </span>
                                    </div>
                                    <div className="cat-sub-checks">
                                        {cat.checks.map((check, i) => {
                                            const subStatus = getSubCheckStatus(cat.threshold, i, cat.checks.length);
                                            return (
                                                <div key={i} className={`sub-check ${subStatus}`}>
                                                    <span className="sub-dot"></span>
                                                    <span className="sub-name">{check}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center: Progress Ring */}
                <div className="progress-column">
                    <div className="progress-ring-container">
                        <div className="progress-ring-outer">
                            <svg viewBox="0 0 140 140">
                                <circle className="ring-track" cx="70" cy="70" r="62" />
                                <circle
                                    className="ring-progress"
                                    cx="70" cy="70" r="62"
                                    strokeDasharray={`${progress.percent * 3.89} 389`}
                                />
                            </svg>
                            <div className="ring-center">
                                <div className="ring-percent">{Math.round(progress.percent)}</div>
                                <div className="ring-label">%</div>
                            </div>
                        </div>
                        <div className="progress-glow-effect"></div>
                    </div>

                    <div className="progress-info">
                        <h2>HeroScore Audit</h2>
                        <p>{progress.currentTask || 'Quality Analysis in Progress'}</p>
                    </div>

                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }}>
                            <div className="progress-bar-glow"></div>
                        </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="quick-metrics">
                        <div className="metric">
                            <span className="metric-val">{metrics.pagesScanned}</span>
                            <span className="metric-lbl">Pages</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">{metrics.requestsSent}</span>
                            <span className="metric-lbl">Requests</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">{metrics.dataReceived}</span>
                            <span className="metric-lbl">Data</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">{metrics.checksPassed}</span>
                            <span className="metric-lbl">Checks</span>
                        </div>
                    </div>
                </div>

                {/* Right: Console */}
                <div className="console-column">
                    <div className="column-header">
                        <span className="column-icon">💻</span>
                        <span>Audit Log</span>
                        <span className="console-blink">●</span>
                    </div>
                    <div className="console-output" ref={consoleRef}>
                        <div className="console-line system">[INIT] HeroScore Auditor v3.0</div>
                        <div className="console-line system">[INIT] Loading brand quality checkers...</div>
                        {progress.logs.map((log, index) => (
                            <div key={index} className={`console-line ${log.status}`}>
                                <span className="console-time">
                                    [{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}]
                                </span>
                                <span className="console-msg">{log.message}</span>
                            </div>
                        ))}
                        <div className="console-cursor">█</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScanProgress;
