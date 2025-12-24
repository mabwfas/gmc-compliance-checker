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

    return (
        <div className="hacker-dashboard">
            {/* Top Status Bar */}
            <div className="hacker-status-bar">
                <div className="status-item">
                    <span className="status-dot active"></span>
                    <span>SYSTEM ACTIVE</span>
                </div>
                <div className="status-item">
                    <span>TARGET:</span>
                    <span className="target-url">{progress.currentTask || 'INITIALIZING...'}</span>
                </div>
                <div className="status-item">
                    <span className="status-percent">{Math.round(progress.percent)}%</span>
                </div>
            </div>

            {/* Main Grid - 3 Column Layout */}
            <div className="hacker-grid">
                {/* Left Column - Live Metrics */}
                <div className="hacker-column">
                    <div className="hacker-panel metrics-panel">
                        <div className="panel-header">
                            <span className="panel-icon">📊</span>
                            <span>LIVE METRICS</span>
                            <span className="blink">●</span>
                        </div>
                        <div className="metrics-grid">
                            <div className="metric-box">
                                <div className="metric-value counting">{metrics.pagesScanned}</div>
                                <div className="metric-label">PAGES</div>
                            </div>
                            <div className="metric-box">
                                <div className="metric-value counting">{metrics.requestsSent}</div>
                                <div className="metric-label">REQUESTS</div>
                            </div>
                            <div className="metric-box">
                                <div className="metric-value">{metrics.dataReceived}</div>
                                <div className="metric-label">DATA</div>
                            </div>
                            <div className="metric-box">
                                <div className="metric-value counting">{metrics.checksPassed}</div>
                                <div className="metric-label">CHECKS</div>
                            </div>
                        </div>
                    </div>

                    <div className="hacker-panel checks-panel">
                        <div className="panel-header">
                            <span className="panel-icon">🔍</span>
                            <span>ACTIVE CHECKS</span>
                        </div>
                        <div className="checks-list">
                            {['Policies', 'Products', 'Technical', 'Checkout', 'Content', 'Images', 'Schema', 'Security', 'Design', 'Copy', 'UX', 'Micro'].map((check, i) => (
                                <div key={i} className={`check-item ${progress.percent > i * 8 ? 'complete' : progress.percent > i * 7 ? 'active' : ''}`}>
                                    <span className="check-status">
                                        {progress.percent > i * 8 ? '✓' : progress.percent > i * 7 ? '◌' : '○'}
                                    </span>
                                    <span className="check-name">{check}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column - Main Progress */}
                <div className="hacker-column center-column">
                    <div className="hacker-panel main-panel">
                        <div className="panel-header">
                            <span className="panel-icon">🌐</span>
                            <span>SCAN PROGRESS</span>
                        </div>

                        {/* Circular Progress */}
                        <div className="circular-progress-container">
                            <div className="circular-progress" style={{ '--progress': progress.percent }}>
                                <div className="progress-inner">
                                    <div className="progress-value">{Math.round(progress.percent)}</div>
                                    <div className="progress-unit">%</div>
                                </div>
                            </div>
                            <div className="progress-rings">
                                <div className="ring ring-1"></div>
                                <div className="ring ring-2"></div>
                                <div className="ring ring-3"></div>
                            </div>
                        </div>

                        {/* Status Text */}
                        <div className="scan-status-text">
                            <div className="status-main typing-effect">{progress.currentTask || 'Initializing scan...'}</div>
                            <div className="status-sub">GMC Compliance Analysis in Progress</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="hacker-progress-bar">
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${progress.percent}%` }}>
                                    <div className="progress-glow"></div>
                                </div>
                            </div>
                            <div className="progress-markers">
                                {[0, 25, 50, 75, 100].map(m => (
                                    <span key={m} className={progress.percent >= m ? 'passed' : ''}>{m}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="quick-stats-row">
                        <div className="quick-stat-box critical">
                            <span className="qs-icon">🔴</span>
                            <span className="qs-value">-</span>
                            <span className="qs-label">Critical</span>
                        </div>
                        <div className="quick-stat-box warning">
                            <span className="qs-icon">🟡</span>
                            <span className="qs-value">-</span>
                            <span className="qs-label">Warnings</span>
                        </div>
                        <div className="quick-stat-box success">
                            <span className="qs-icon">🟢</span>
                            <span className="qs-value">-</span>
                            <span className="qs-label">Passed</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Live Console */}
                <div className="hacker-column">
                    <div className="hacker-panel console-panel">
                        <div className="panel-header">
                            <span className="panel-icon">💻</span>
                            <span>LIVE CONSOLE</span>
                            <span className="blink green">●</span>
                        </div>
                        <div className="console-output" ref={consoleRef}>
                            <div className="console-line system">[SYSTEM] GMC Compliance Scanner v2.0</div>
                            <div className="console-line system">[SYSTEM] Initializing analysis modules...</div>
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

                    <div className="hacker-panel network-panel">
                        <div className="panel-header">
                            <span className="panel-icon">📡</span>
                            <span>NETWORK ACTIVITY</span>
                        </div>
                        <div className="network-viz">
                            <div className="network-bar">
                                <div className="network-fill" style={{ width: `${Math.min(progress.percent * 1.2, 100)}%` }}></div>
                            </div>
                            <div className="network-stats">
                                <span>IN: {Math.floor(progress.percent * 12)} KB/s</span>
                                <span>OUT: {Math.floor(progress.percent * 3)} KB/s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Matrix Effect */}
            <div className="matrix-rain">
                {Array(20).fill(0).map((_, i) => (
                    <div key={i} className="matrix-column" style={{ animationDelay: `${i * 0.1}s` }}>
                        {Array(10).fill(0).map((_, j) => (
                            <span key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScanProgress;
