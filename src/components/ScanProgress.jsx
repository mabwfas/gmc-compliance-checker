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

    // Detailed check categories with sub-checks
    const checkCategories = [
        {
            name: 'Policies',
            icon: '📜',
            checks: ['Privacy Policy', 'Return Policy', 'Terms of Service', 'Shipping Policy'],
            threshold: 5
        },
        {
            name: 'Products',
            icon: '🛍️',
            checks: ['Product Data', 'Pricing', 'Availability', 'Descriptions'],
            threshold: 15
        },
        {
            name: 'Technical',
            icon: '⚙️',
            checks: ['SSL Certificate', 'Mobile Friendly', 'Page Speed', 'Structured Data'],
            threshold: 25
        },
        {
            name: 'Checkout',
            icon: '💳',
            checks: ['Secure Checkout', 'Payment Methods', 'Cart Function', 'Price Accuracy'],
            threshold: 35
        },
        {
            name: 'Content',
            icon: '📝',
            checks: ['Contact Info', 'About Page', 'FAQs', 'Legal Pages'],
            threshold: 45
        },
        {
            name: 'Images',
            icon: '🖼️',
            checks: ['Product Images', 'Alt Text', 'Image Quality', 'Image Size'],
            threshold: 55
        },
        {
            name: 'Schema',
            icon: '🔗',
            checks: ['Product Schema', 'Organization', 'Breadcrumbs', 'Reviews'],
            threshold: 65
        },
        {
            name: 'Security',
            icon: '🔒',
            checks: ['HTTPS', 'Safe Browsing', 'Mixed Content', 'Headers'],
            threshold: 75
        },
        {
            name: 'Compliance',
            icon: '✅',
            checks: ['GMC Policy', 'Ad Policies', 'Requirements', 'Best Practices'],
            threshold: 85
        }
    ];

    // Update metrics based on progress
    useEffect(() => {
        setMetrics({
            pagesScanned: Math.floor(progress.percent / 10),
            requestsSent: Math.floor(progress.percent * 2),
            dataReceived: `${Math.floor(progress.percent * 15)} KB`,
            checksPassed: Math.floor(progress.percent / 8),
            checksRunning: progress.percent < 100 ? 12 : 0
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
        if (progress.percent >= threshold + 10) return 'complete';
        if (progress.percent >= threshold) return 'active';
        return 'pending';
    };

    // Get sub-check status
    const getSubCheckStatus = (threshold, index) => {
        const subThreshold = threshold + (index * 2.5);
        if (progress.percent >= subThreshold + 2.5) return 'complete';
        if (progress.percent >= subThreshold) return 'active';
        return 'pending';
    };

    return (
        <div className="scan-dashboard-v2">
            {/* Top Status Bar */}
            <div className="scan-status-bar">
                <div className="status-left">
                    <span className="status-indicator active"></span>
                    <span className="status-text">SCANNING</span>
                </div>
                <div className="status-center">
                    <span className="current-task">{progress.currentTask || 'Initializing...'}</span>
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
                        <span className="column-icon">🔍</span>
                        <span>Compliance Checks</span>
                    </div>
                    <div className="checks-grid">
                        {checkCategories.map((cat, idx) => {
                            const status = getCheckStatus(cat.threshold);
                            return (
                                <div key={idx} className={`check-category-card ${status}`}>
                                    <div className="cat-header">
                                        <span className="cat-icon">{cat.icon}</span>
                                        <span className="cat-name">{cat.name}</span>
                                        <span className="cat-status-icon">
                                            {status === 'complete' ? '✓' : status === 'active' ? '◌' : '○'}
                                        </span>
                                    </div>
                                    <div className="cat-sub-checks">
                                        {cat.checks.map((check, i) => {
                                            const subStatus = getSubCheckStatus(cat.threshold, i);
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
                        <h2>{progress.currentTask || 'Starting scan...'}</h2>
                        <p>GMC Compliance Analysis</p>
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
                        <span>Live Console</span>
                        <span className="console-blink">●</span>
                    </div>
                    <div className="console-output" ref={consoleRef}>
                        <div className="console-line system">[INIT] GMC Compliance Scanner v2.0</div>
                        <div className="console-line system">[INIT] Loading analysis modules...</div>
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
