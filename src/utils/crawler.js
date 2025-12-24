// Website Crawler - Uses Vercel API or CORS proxy fallback
// Supports both regular crawling and sitemap-based crawling

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'  // Local dev server
    : '';  // Same origin for Vercel

// CORS proxy for local development fallback
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
];

async function fetchWithFallback(url) {
    // Try direct fetch first (works on Vercel)
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GMC-Compliance-Checker/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        // Direct fetch failed, try proxies
    }

    // Try CORS proxies
    for (const proxy of CORS_PROXIES) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url), {
                headers: { 'Accept': 'text/html,*/*' },
            });
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            continue;
        }
    }

    throw new Error(`Failed to fetch ${url}`);
}

// Use server API for crawling (preferred for production)
export async function crawlViaAPI(url, maxPages = 50, onProgress) {
    try {
        const response = await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, maxPages }),
        });

        if (!response.ok) {
            throw new Error('API crawl failed');
        }

        const data = await response.json();

        if (onProgress) {
            data.pages.forEach((page, i) => {
                onProgress(page.url, i + 1);
            });
        }

        return {
            baseUrl: data.baseUrl,
            pages: data.pages,
        };
    } catch (error) {
        console.error('API crawl failed, falling back to client-side:', error);
        // Fallback to client-side crawling
        return crawlWebsiteClientSide(url, maxPages, onProgress);
    }
}

// Use server API for sitemap parsing (preferred)
export async function crawlViaSitemap(sitemapUrl, maxPages = 100, onProgress) {
    try {
        const response = await fetch('/api/sitemap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sitemapUrl, maxPages }),
        });

        if (!response.ok) {
            throw new Error('Sitemap API failed');
        }

        const data = await response.json();

        if (onProgress) {
            data.pages.forEach((page, i) => {
                onProgress(page.url, i + 1);
            });
        }

        return {
            baseUrl: sitemapUrl,
            totalUrlsInSitemap: data.totalUrlsFound,
            isSitemapIndex: data.isSitemapIndex,
            pages: data.pages,
        };
    } catch (error) {
        console.error('Sitemap API failed, falling back to client-side:', error);
        // Fallback to client-side sitemap parsing
        return crawlViaSitemapClientSide(sitemapUrl, maxPages, onProgress);
    }
}

// Client-side sitemap parsing (fallback)
async function crawlViaSitemapClientSide(sitemapUrl, maxPages, onProgress) {
    const sitemapXml = await fetchWithFallback(sitemapUrl);

    // Parse URLs from sitemap
    const urlRegex = /<loc>([^<]+)<\/loc>/gi;
    const urls = [];
    let match;

    while ((match = urlRegex.exec(sitemapXml)) !== null) {
        urls.push(match[1].trim());
    }

    // Check if this is a sitemap index
    const isSitemapIndex = sitemapXml.includes('<sitemapindex');
    let allUrls = [];

    if (isSitemapIndex) {
        // Parse child sitemaps
        for (const childUrl of urls.slice(0, 3)) {
            try {
                const childXml = await fetchWithFallback(childUrl);
                let childMatch;
                const childRegex = /<loc>([^<]+)<\/loc>/gi;
                while ((childMatch = childRegex.exec(childXml)) !== null) {
                    allUrls.push(childMatch[1].trim());
                }
            } catch (e) {
                console.error('Failed to fetch child sitemap:', e);
            }
        }
    } else {
        allUrls = urls;
    }

    // Crawl pages
    const urlsToCrawl = allUrls.slice(0, maxPages);
    const pages = [];

    for (let i = 0; i < urlsToCrawl.length; i++) {
        const url = urlsToCrawl[i];
        try {
            const html = await fetchWithFallback(url);
            pages.push({ url, html, status: 200 });
            if (onProgress) {
                onProgress(url, pages.length);
            }
        } catch (e) {
            console.error(`Failed to fetch ${url}:`, e);
        }
    }

    return {
        baseUrl: sitemapUrl,
        totalUrlsInSitemap: allUrls.length,
        isSitemapIndex,
        pages,
    };
}

// Client-side website crawling (fallback)
async function crawlWebsiteClientSide(url, maxPages, onProgress) {
    let baseUrl = url;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    const pages = [];
    const visited = new Set();
    const toVisit = [baseUrl];

    while (toVisit.length > 0 && pages.length < maxPages) {
        const currentUrl = toVisit.shift();
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        try {
            const html = await fetchWithFallback(currentUrl);
            pages.push({ url: currentUrl, html, status: 200 });

            if (onProgress) {
                onProgress(currentUrl, pages.length);
            }

            // Extract links
            const linkRegex = /href=["']([^"']+)["']/gi;
            let match;

            while ((match = linkRegex.exec(html)) !== null) {
                let href = match[1];

                if (href.startsWith('#') || href.startsWith('javascript:') ||
                    href.startsWith('mailto:') || href.startsWith('tel:')) {
                    continue;
                }

                if (href.startsWith('/')) {
                    href = new URL(href, baseUrl).href;
                } else if (!href.startsWith('http')) {
                    href = new URL(href, baseUrl).href;
                }

                try {
                    const linkDomain = new URL(href).hostname;
                    const baseDomain = new URL(baseUrl).hostname;

                    if (linkDomain === baseDomain && !visited.has(href) && !toVisit.includes(href)) {
                        toVisit.push(href);
                    }
                } catch (e) { }
            }
        } catch (e) {
            console.error(`Failed to fetch ${currentUrl}:`, e);
        }
    }

    return { baseUrl, pages };
}

// Main export - automatically uses best method available
export async function crawlWebsite(url, maxPages = 50, onProgress, useSitemap = false, sitemapUrl = null) {
    if (useSitemap && sitemapUrl) {
        return crawlViaSitemap(sitemapUrl, maxPages, onProgress);
    }
    return crawlViaAPI(url, maxPages, onProgress);
}

export { fetchWithFallback };
