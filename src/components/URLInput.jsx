import { useState } from 'react';

function URLInput({
    url,
    setUrl,
    sitemapUrl,
    setSitemapUrl,
    useSitemap,
    setUseSitemap,
    maxPages,
    setMaxPages,
    onScan,
    isScanning
}) {
    const [inputMode, setInputMode] = useState('url'); // 'url' or 'sitemap'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputMode === 'sitemap') {
            setUseSitemap(true);
        } else {
            setUseSitemap(false);
        }
        onScan();
    };

    const handleModeSwitch = (mode) => {
        setInputMode(mode);
        if (mode === 'sitemap') {
            setUseSitemap(true);
        } else {
            setUseSitemap(false);
        }
    };

    return (
        <div className="url-input-section">
            {/* Mode Toggle */}
            <div className="input-mode-toggle">
                <button
                    className={`mode-btn ${inputMode === 'url' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('url')}
                    type="button"
                >
                    🌐 Website URL
                </button>
                <button
                    className={`mode-btn ${inputMode === 'sitemap' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('sitemap')}
                    type="button"
                >
                    📄 Sitemap XML
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="url-input-wrapper">
                    {inputMode === 'url' ? (
                        <input
                            type="text"
                            className="url-input"
                            placeholder="Enter website URL (e.g., example.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isScanning}
                        />
                    ) : (
                        <input
                            type="text"
                            className="url-input"
                            placeholder="Enter sitemap.xml URL (e.g., example.com/sitemap.xml)"
                            value={sitemapUrl}
                            onChange={(e) => setSitemapUrl(e.target.value)}
                            disabled={isScanning}
                        />
                    )}

                    <button
                        type="submit"
                        className="scan-btn"
                        disabled={isScanning || (inputMode === 'url' ? !url : !sitemapUrl)}
                    >
                        {isScanning ? (
                            <>
                                <span className="scan-spinner"></span>
                                Scanning...
                            </>
                        ) : (
                            <>
                                🚀 Start Scan
                            </>
                        )}
                    </button>
                </div>

                <div className="scan-options">
                    <div className="scan-option">
                        <label>Max pages:</label>
                        <input
                            type="number"
                            min="1"
                            max="200"
                            value={maxPages}
                            onChange={(e) => setMaxPages(Math.min(200, Math.max(1, parseInt(e.target.value) || 50)))}
                            disabled={isScanning}
                        />
                    </div>

                    {inputMode === 'url' && (
                        <div className="scan-option hint">
                            💡 For complete coverage, use Sitemap XML mode
                        </div>
                    )}

                    {inputMode === 'sitemap' && (
                        <div className="scan-option hint">
                            📊 Will crawl all pages listed in your sitemap
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

export default URLInput;
