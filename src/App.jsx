import { useState, useCallback, useEffect } from 'react';
import ScanProgress from './components/ScanProgress';
import ResultsDashboard from './components/ResultsDashboard';
import PastScans from './components/PastScans';
import { runAllCheckers } from './checkers';
import { crawlWebsite } from './utils/crawler';

// Local storage key
const STORAGE_KEY = 'gmc_checker_stores';

function App() {
    const [url, setUrl] = useState('');
    const [sitemapUrl, setSitemapUrl] = useState('');
    const [useSitemap, setUseSitemap] = useState(false);
    const [maxPages, setMaxPages] = useState(50);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, logs: [], currentTask: '' });
    const [results, setResults] = useState(null);

    // View state: 'scanner' | 'history'
    const [currentView, setCurrentView] = useState('scanner');

    // Store management state
    const [savedStores, setSavedStores] = useState([]);
    const [activeStoreId, setActiveStoreId] = useState(null);

    // Load saved stores from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSavedStores(parsed);
                if (parsed.length > 0) {
                    setActiveStoreId(parsed[0].id);
                    setResults(parsed[0].results);
                    setUrl(parsed[0].url);
                }
            }
        } catch (e) {
            console.error('Error loading saved stores:', e);
        }
    }, []);

    // Save stores to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStores));
        } catch (e) {
            console.error('Error saving stores:', e);
        }
    }, [savedStores]);

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
        setCurrentView('scanner');
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

            // Detect platform from crawled pages
            const detectPlatform = (pages) => {
                const allHtml = pages.map(p => p.html || '').join(' ').toLowerCase();
                if (allHtml.includes('shopify') || allHtml.includes('cdn.shopify.com')) {
                    return { name: 'Shopify', icon: '🛍️', color: '#96bf48' };
                }
                if (allHtml.includes('woocommerce') || allHtml.includes('wc-') || allHtml.includes('wp-content/plugins/woocommerce')) {
                    return { name: 'WooCommerce', icon: '🔮', color: '#7f54b3' };
                }
                if (allHtml.includes('wordpress') || allHtml.includes('wp-content') || allHtml.includes('wp-includes')) {
                    return { name: 'WordPress', icon: '📝', color: '#21759b' };
                }
                if (allHtml.includes('magento') || allHtml.includes('mage')) {
                    return { name: 'Magento', icon: '🔶', color: '#f46f25' };
                }
                if (allHtml.includes('bigcommerce')) {
                    return { name: 'BigCommerce', icon: '🛒', color: '#34313f' };
                }
                return { name: 'Custom/Unknown', icon: '🌐', color: '#6366f1' };
            };

            const platform = detectPlatform(crawlResults.pages);

            const totalIssues = checkResults.reduce((sum, cat) => sum + cat.issues.length, 0);
            const criticalIssues = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'critical').length, 0);
            const warningIssues = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'warning').length, 0);
            const passedChecks = checkResults.reduce((sum, cat) =>
                sum + cat.issues.filter(i => i.severity === 'pass').length, 0);

            // Calculate score with minimum of 10 (never show 0)
            let score = 100;
            score -= criticalIssues * 15;
            score -= warningIssues * 5;
            score = Math.max(10, Math.min(100, score)); // Minimum 10, never 0

            // Extract category-specific scores
            const categoryScores = {
                design: checkResults.find(c => c.name === 'Design Quality')?.score || 0,
                copywriting: checkResults.find(c => c.name === 'Copywriting Quality')?.score || 0,
                ux: checkResults.find(c => c.name === 'User Experience')?.score || 0,
                compliance: score
            };

            const newResults = {
                url: targetUrl,
                scanDate: new Date().toISOString(),
                pagesScanned: crawlResults.pages.length,
                totalUrlsInSitemap: crawlResults.totalUrlsInSitemap,
                platform, // Store detected platform
                score,
                categoryScores, // Store individual category scores
                totalIssues,
                criticalIssues,
                warningIssues,
                infoIssues: totalIssues - criticalIssues - warningIssues - passedChecks,
                passedChecks,
                categories: checkResults,
                scannedPages: crawlResults.pages.map(p => p.url)
            };

            setResults(newResults);

            // Save store automatically
            const storeName = new URL(targetUrl).hostname;
            const storeId = `${storeName}_${Date.now()}`;

            const newStore = {
                id: storeId,
                name: storeName,
                url: targetUrl,
                scanDate: newResults.scanDate,
                score: newResults.score,
                results: newResults
            };

            setSavedStores(prev => [newStore, ...prev]);
            setActiveStoreId(storeId);

        } catch (error) {
            addLog(`Error: ${error.message}`, 'error');
            console.error('Scan error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleSelectStore = (store) => {
        setActiveStoreId(store.id);
        setResults(store.results);
        setUrl(store.url);
        setCurrentView('scanner');
    };

    const handleDeleteStore = (storeId, e) => {
        if (e) e.stopPropagation();
        setSavedStores(prev => prev.filter(s => s.id !== storeId));
        if (activeStoreId === storeId) {
            setActiveStoreId(null);
            setResults(null);
        }
    };

    const handleClearAll = () => {
        setSavedStores([]);
        setActiveStoreId(null);
        setResults(null);
        setUrl('');
    };

    return (
        <div className="app-layout">
            {/* Left Sidebar */}
            <aside className="sidebar">
                {/* App Branding */}
                <div className="sidebar-brand">
                    <div className="brand-icon">🛒</div>
                    <div className="brand-text">
                        <h1>GMC Checker</h1>
                        <p>Google Merchant Center Compliance Scanner</p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="sidebar-nav">
                    <button
                        className={`nav-btn ${currentView === 'scanner' ? 'active' : ''}`}
                        onClick={() => setCurrentView('scanner')}
                    >
                        🔍 Scanner
                    </button>
                    <button
                        className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
                        onClick={() => setCurrentView('history')}
                    >
                        📊 Past Scans
                        {savedStores.length > 0 && (
                            <span className="nav-badge">{savedStores.length}</span>
                        )}
                    </button>
                </div>

                {/* URL Input Section - Only show on scanner view */}
                {currentView === 'scanner' && (
                    <>
                        <div className="sidebar-input-section">
                            <h3>🔍 NEW SCAN</h3>

                            <div className="sidebar-mode-toggle">
                                <button
                                    className={`sidebar-mode-btn ${!useSitemap ? 'active' : ''}`}
                                    onClick={() => setUseSitemap(false)}
                                >
                                    URL
                                </button>
                                <button
                                    className={`sidebar-mode-btn ${useSitemap ? 'active' : ''}`}
                                    onClick={() => setUseSitemap(true)}
                                >
                                    Sitemap
                                </button>
                            </div>

                            <input
                                type="text"
                                className="sidebar-url-input"
                                placeholder={useSitemap ? "https://site.com/sitemap.xml" : "example.com"}
                                value={useSitemap ? sitemapUrl : url}
                                onChange={(e) => useSitemap ? setSitemapUrl(e.target.value) : setUrl(e.target.value)}
                            />

                            <div className="sidebar-option">
                                <span>Max pages:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={maxPages}
                                    onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                                />
                            </div>

                            <button
                                className="sidebar-scan-btn"
                                onClick={handleScan}
                                disabled={isScanning || (!url && !sitemapUrl)}
                            >
                                {isScanning ? (
                                    <>
                                        <span className="scan-spinner"></span>
                                        Scanning...
                                    </>
                                ) : (
                                    <>🚀 Start Scan</>
                                )}
                            </button>
                        </div>

                        <div className="sidebar-divider"></div>

                        {/* Recent Scans - Quick access */}
                        <div className="sidebar-header">
                            <h3>⏱️ Recent</h3>
                        </div>

                        <div className="stores-list">
                            {savedStores.length === 0 ? (
                                <div className="empty-sidebar">
                                    <p>No scans yet</p>
                                </div>
                            ) : (
                                savedStores.slice(0, 5).map(store => (
                                    <div
                                        key={store.id}
                                        className={`store-item ${activeStoreId === store.id ? 'active' : ''}`}
                                        onClick={() => handleSelectStore(store)}
                                    >
                                        <div className="store-info">
                                            <span className="store-name">{store.name}</span>
                                            <span className="store-date">
                                                {new Date(store.scanDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="store-meta">
                                            <span className={`store-score ${store.score >= 80 ? 'good' : store.score >= 50 ? 'warning' : 'critical'}`}>
                                                {store.score}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {savedStores.length > 5 && (
                                <button className="view-all-btn" onClick={() => setCurrentView('history')}>
                                    View all {savedStores.length} scans →
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Scanned URLs - Only when viewing results */}
                {results && results.scannedPages && currentView === 'scanner' && (
                    <div className="scanned-urls-section">
                        <h4>🔗 Pages ({results.scannedPages.length})</h4>
                        <div className="scanned-urls-list">
                            {results.scannedPages.map((pageUrl, idx) => (
                                <a
                                    key={idx}
                                    href={pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="scanned-url-item"
                                >
                                    {pageUrl.replace(results.url, '').replace(/^\//, '') || '/'}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="main-panel">
                {currentView === 'history' ? (
                    <PastScans
                        scans={savedStores}
                        onSelectScan={handleSelectStore}
                        onDeleteScan={handleDeleteStore}
                        onClearAll={handleClearAll}
                    />
                ) : (
                    <>
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
                                        <p>Enter a website URL in the sidebar and click Start Scan</p>

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
                    </>
                )}

                <footer className="app-footer">
                    <p>GMC Compliance Checker • Powered by AI Analysis</p>
                </footer>
            </main>
        </div>
    );
}

export default App;
