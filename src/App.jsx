import { useState, useCallback } from 'react';
import Header from './components/Header';
import URLInput from './components/URLInput';
import ScanProgress from './components/ScanProgress';
import ResultsDashboard from './components/ResultsDashboard';
import { runAllCheckers } from './checkers';
import { crawlWebsite } from './utils/crawler';

function App() {
    const [url, setUrl] = useState('');
    const [sitemapUrl, setSitemapUrl] = useState('');
    const [useSitemap, setUseSitemap] = useState(false);
    const [maxPages, setMaxPages] = useState(50);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, logs: [], currentTask: '' });
    const [results, setResults] = useState(null);

    const addLog = useCallback((message, status = 'pending') => {
        setProgress(prev => ({
            ...prev,
            logs: [...prev.logs, { message, status, timestamp: new Date().toISOString() }]
        }));
    }, []);

    const updateProgress = useCallback((percent, currentTask) => {
        setProgress(prev => ({
            ...prev,
            percent,
            currentTask
        }));
    }, []);

    const handleScan = async () => {
        if (!url && !sitemapUrl) return;

        setIsScanning(true);
        setResults(null);
        setProgress({ percent: 0, logs: [], currentTask: 'Starting scan...' });

        try {
            let targetUrl = url;
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
            }

            const scanMode = useSitemap && sitemapUrl ? 'sitemap' : 'crawl';

            if (scanMode === 'sitemap') {
                addLog(`Parsing sitemap: ${sitemapUrl}`, 'pending');
            } else {
                addLog(`Starting GMC scan for ${targetUrl}`, 'pending');
            }
            updateProgress(5, scanMode === 'sitemap' ? 'Parsing sitemap...' : 'Validating URL...');

            addLog('Fetching website pages...', 'pending');
            updateProgress(10, 'Crawling website...');

            const crawlResults = await crawlWebsite(
                targetUrl,
                maxPages,
                (pageUrl, pageNum) => {
                    addLog(`Fetched page ${pageNum}: ${pageUrl}`, 'success');
                    updateProgress(10 + (pageNum / maxPages) * 30, `Crawling page ${pageNum}...`);
                },
                useSitemap,
                sitemapUrl
            );

            if (crawlResults.pages.length === 0) {
                throw new Error('Could not fetch any pages. Check URL and try again.');
            }

            if (crawlResults.totalUrlsInSitemap) {
                addLog(`Found ${crawlResults.totalUrlsInSitemap} URLs in sitemap`, 'success');
            }
            addLog(`Successfully crawled ${crawlResults.pages.length} pages`, 'success');
            updateProgress(40, 'Running GMC compliance checks...');

            const checkResults = await runAllCheckers(crawlResults, (checkerName, percent) => {
                addLog(`Running ${checkerName}...`, 'pending');
                updateProgress(40 + percent * 0.55, `Checking: ${checkerName}`);
            });

            addLog('All checks completed!', 'success');
            updateProgress(100, 'Scan complete!');

            const totalIssues = checkResults.reduce((sum, cat) => sum + cat.issues.length, 0);
            const criticalIssues = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'critical').length, 0);
            const warningIssues = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'warning').length, 0);
            const passedChecks = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'pass').length, 0);

            let score = 100;
            score -= criticalIssues * 15;
            score -= warningIssues * 5;
            score = Math.max(0, Math.min(100, score));

            setResults({
                url: targetUrl,
                scanDate: new Date().toISOString(),
                pagesScanned: crawlResults.pages.length,
                totalUrlsInSitemap: crawlResults.totalUrlsInSitemap,
                score,
                totalIssues,
                criticalIssues,
                warningIssues,
                infoIssues: totalIssues - criticalIssues - warningIssues - passedChecks,
                passedChecks,
                categories: checkResults
            });

        } catch (error) {
            addLog(`Error: ${error.message}`, 'error');
            console.error('Scan error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="app">
            <section className="hero-section">
                <Header />
                <URLInput
                    url={url}
                    setUrl={setUrl}
                    sitemapUrl={sitemapUrl}
                    setSitemapUrl={setSitemapUrl}
                    useSitemap={useSitemap}
                    setUseSitemap={setUseSitemap}
                    maxPages={maxPages}
                    setMaxPages={setMaxPages}
                    onScan={handleScan}
                    isScanning={isScanning}
                />
            </section>

            <main className="main-content">
                {isScanning && (
                    <section className="content-section">
                        <ScanProgress progress={progress} />
                    </section>
                )}

                {results && (
                    <section className="content-section results-section">
                        <ResultsDashboard results={results} />
                    </section>
                )}

                {!isScanning && !results && (
                    <section className="content-section">
                        <div className="empty-state">
                            <div className="empty-state-content">
                                <div className="empty-state-icon">🔍</div>
                                <h3>Ready to Analyze</h3>
                                <p>Enter your website URL or sitemap.xml to scan for GMC compliance issues</p>

                                <div className="features-grid">
                                    <div className="feature-item">
                                        <span className="feature-icon">📋</span>
                                        <span className="feature-text">Policy Checks</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">🛒</span>
                                        <span className="feature-text">Checkout Flow</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">🔒</span>
                                        <span className="feature-text">Security</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📊</span>
                                        <span className="feature-text">Schema Data</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer className="app-footer">
                <p>GMC Compliance Checker • Powered by AI Analysis</p>
            </footer>
        </div>
    );
}

export default App;
