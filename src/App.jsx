import { useState, useCallback, useEffect } from 'react';
import ScanProgress from './components/ScanProgress';
import ResultsDashboard from './components/ResultsDashboard';
import PastScans from './components/PastScans';
import { runAllCheckers } from './checkers';
import { crawlWebsite } from './utils/crawler';

// Local storage key
const STORAGE_KEY = 'shopscore_audits';

function App() {
    const [url, setUrl] = useState('bullringx.com');
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
                addLog(`Starting ShopScore audit for ${targetUrl}`, 'pending');
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
            updateProgress(40, 'Running ShopScore quality checks...');

            const checkResults = await runAllCheckers(crawlResults, (checkerName, percent) => {
                addLog(`Running ${checkerName}...`, 'pending');
                updateProgress(40 + percent * 0.55, `Checking: ${checkerName}`);
            });

            addLog('All checks completed!', 'success');
            updateProgress(100, 'Scan complete!');

            // Detect platform from crawled pages - order matters (specific before generic)
            const detectPlatform = (pages) => {
                const allHtml = pages.map(p => p.html || '').join(' ').toLowerCase();

                // WooCommerce (check before WordPress since WC runs on WP)
                if (allHtml.includes('woocommerce') ||
                    allHtml.includes('wc-add-to-cart') ||
                    allHtml.includes('wp-content/plugins/woocommerce') ||
                    allHtml.includes('wc-block')) {
                    return { name: 'WooCommerce', icon: '🔮', color: '#7f54b3' };
                }

                // Shopify - specific patterns (avoid false positives)
                if (allHtml.includes('cdn.shopify.com') ||
                    allHtml.includes('myshopify.com') ||
                    allHtml.includes('shopify-section') ||
                    allHtml.includes('shopify_analytics') ||
                    allHtml.includes('"shopify"') ||
                    /shopify\.com\/s\/files/.test(allHtml)) {
                    return { name: 'Shopify', icon: '🛍️', color: '#96bf48' };
                }

                // BigCommerce
                if (allHtml.includes('bigcommerce') ||
                    allHtml.includes('cdn11.bigcommerce') ||
                    allHtml.includes('data-bc-')) {
                    return { name: 'BigCommerce', icon: '🛒', color: '#34313f' };
                }

                // Magento
                if (allHtml.includes('mage-init') ||
                    allHtml.includes('magento') ||
                    allHtml.includes('requirejs-config') && allHtml.includes('mage')) {
                    return { name: 'Magento', icon: '🔶', color: '#f46f25' };
                }

                // Squarespace
                if (allHtml.includes('squarespace') ||
                    allHtml.includes('static1.squarespace') ||
                    allHtml.includes('sqs-block')) {
                    return { name: 'Squarespace', icon: '⬛', color: '#000000' };
                }

                // Wix
                if (allHtml.includes('wix.com') ||
                    allHtml.includes('static.wixstatic') ||
                    allHtml.includes('_wix_browser')) {
                    return { name: 'Wix', icon: '🟡', color: '#faad4d' };
                }

                // PrestaShop
                if (allHtml.includes('prestashop') ||
                    allHtml.includes('presta') && allHtml.includes('addons')) {
                    return { name: 'PrestaShop', icon: '🟣', color: '#df0067' };
                }

                // WordPress (generic - check after WooCommerce)
                if (allHtml.includes('wp-content') ||
                    allHtml.includes('wp-includes') ||
                    allHtml.includes('wordpress') ||
                    allHtml.includes('elementor') ||
                    allHtml.includes('wp-json')) {
                    return { name: 'WordPress', icon: '📝', color: '#21759b' };
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

            // Use ShopScore data from checkers
            const shopScoreData = checkResults.shopScoreData || {};
            const score = shopScoreData.totalScore || checkResults.reduce((sum, cat) => sum + (cat.score || 0), 0);

            const newResults = {
                url: targetUrl,
                scanDate: new Date().toISOString(),
                pagesScanned: crawlResults.pages.length,
                totalUrlsInSitemap: crawlResults.totalUrlsInSitemap,
                platform,
                score,
                shopScoreData, // Store ShopScore specific data
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
                    <div className="brand-icon">🦸</div>
                    <div className="brand-text">
                        <h1>HeroScore</h1>
                        <p>Brand Quality Audit Tool</p>
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
                                        <div className="empty-state-icon">🦸</div>
                                        <h3>Ready to Analyze</h3>
                                        <p>Enter a website URL in the sidebar and click Start Scan</p>

                                        <div className="features-section">
                                            <h4>Core Quality (50pts)</h4>
                                            <div className="features-grid">
                                                <div className="feature-item">
                                                    <span className="feature-icon">📜</span>
                                                    <span className="feature-text">Essential Pages (15pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">🧭</span>
                                                    <span className="feature-text">Navigation (10pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">📝</span>
                                                    <span className="feature-text">Content (10pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">⚙️</span>
                                                    <span className="feature-text">Technical (5pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">🛒</span>
                                                    <span className="feature-text">GMC Ready (10pts)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="features-section">
                                            <h4>Brand Focused (50pts)</h4>
                                            <div className="features-grid">
                                                <div className="feature-item">
                                                    <span className="feature-icon">🏆</span>
                                                    <span className="feature-text">Trust Signals (15pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">🎨</span>
                                                    <span className="feature-text">Brand Consistency (10pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">✨</span>
                                                    <span className="feature-text">Visual Design (10pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">🎯</span>
                                                    <span className="feature-text">Conversion (10pts)</span>
                                                </div>
                                                <div className="feature-item">
                                                    <span className="feature-icon">📱</span>
                                                    <span className="feature-text">Mobile (10pts)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}

                <footer className="app-footer">
                    <p>HeroScore • Made with ❤️ by Digital Heroes Team - Shreyansh</p>
                </footer>
            </main>
        </div>
    );
}

export default App;
