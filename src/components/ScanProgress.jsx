function ScanProgress({ progress }) {
    return (
        <section className="progress-section fade-in">
            <div className="progress-header">
                <div className="progress-title">
                    <span className="progress-spinner"></span>
                    <h3>{progress.currentTask || 'Scanning...'}</h3>
                </div>
                <span>{Math.round(progress.percent)}%</span>
            </div>

            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar"
                    style={{ width: `${progress.percent}%` }}
                ></div>
            </div>

            <div className="progress-log">
                {progress.logs.map((log, index) => (
                    <div key={index} className="progress-log-item">
                        <span className={`log-icon ${log.status}`}>
                            {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '○'}
                        </span>
                        <span>{log.message}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ScanProgress;
