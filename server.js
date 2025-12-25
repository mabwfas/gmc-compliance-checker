// Local development server for API endpoints
// Run with: node server.js
// This mimics Vercel serverless functions locally

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper to extract links from HTML
function extractLinks(html, baseUrl) {
    const links = [];
    const linkRegex = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        let href = match[1];

        if (href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
        }

        try {
            if (href.startsWith('/')) {
                href = new URL(href, baseUrl).href;
            } else if (!href.startsWith('http')) {
                href = new URL(href, baseUrl).href;
            }

            const linkDomain = new URL(href).hostname;
            const baseDomain = new URL(baseUrl).hostname;

            if (linkDomain === baseDomain) {
                links.push(href);
            }
        } catch (e) { }
    }

    return [...new Set(links)];
}

// Crawl endpoint
app.post('/api/crawl', async (req, res) => {
    try {
        let { url, maxPages = 50 } = req.body;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        url = url.replace(/\/$/, '');

        console.log(`Starting crawl: ${url}, max pages: ${maxPages}`);

        const pages = [];
        const visited = new Set();
        const toVisit = [url];

        while (toVisit.length > 0 && pages.length < maxPages) {
            const currentUrl = toVisit.shift();
            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            try {
                console.log(`Fetching: ${currentUrl}`);
                const response = await fetch(currentUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                    },
                    timeout: 15000
                });

                if (response.ok) {
                    const html = await response.text();
                    pages.push({ url: currentUrl, html, status: response.status });

                    // Extract and queue new links
                    const links = extractLinks(html, url);
                    for (const link of links) {
                        if (!visited.has(link) && !toVisit.includes(link)) {
                            toVisit.push(link);
                        }
                    }
                } else {
                    console.log(`Failed: ${currentUrl} - ${response.status}`);
                }
            } catch (e) {
                console.error(`Error fetching ${currentUrl}:`, e.message);
            }
        }

        console.log(`Crawl complete: ${pages.length} pages`);

        res.json({
            baseUrl: url,
            pages
        });
    } catch (error) {
        console.error('Crawl error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sitemap endpoint
app.post('/api/sitemap', async (req, res) => {
    try {
        let { sitemapUrl, maxPages = 100 } = req.body;

        console.log(`Parsing sitemap: ${sitemapUrl}`);

        const response = await fetch(sitemapUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch sitemap: ${response.status}`);
        }

        const sitemapXml = await response.text();

        // Extract URLs from sitemap
        const urlRegex = /<loc>([^<]+)<\/loc>/gi;
        const urls = [];
        let match;

        while ((match = urlRegex.exec(sitemapXml)) !== null) {
            urls.push(match[1].trim());
        }

        const isSitemapIndex = sitemapXml.includes('<sitemapindex');
        let allUrls = [];

        if (isSitemapIndex) {
            // Parse child sitemaps
            for (const childUrl of urls.slice(0, 3)) {
                try {
                    const childResponse = await fetch(childUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 15000
                    });
                    if (childResponse.ok) {
                        const childXml = await childResponse.text();
                        const childRegex = /<loc>([^<]+)<\/loc>/gi;
                        let childMatch;
                        while ((childMatch = childRegex.exec(childXml)) !== null) {
                            allUrls.push(childMatch[1].trim());
                        }
                    }
                } catch (e) {
                    console.error('Error fetching child sitemap:', e.message);
                }
            }
        } else {
            allUrls = urls;
        }

        // Fetch pages
        const pages = [];
        const urlsToFetch = allUrls.slice(0, maxPages);

        for (const pageUrl of urlsToFetch) {
            try {
                const pageResponse = await fetch(pageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 15000
                });

                if (pageResponse.ok) {
                    const html = await pageResponse.text();
                    pages.push({ url: pageUrl, html, status: pageResponse.status });
                    console.log(`Fetched: ${pageUrl}`);
                }
            } catch (e) {
                console.error(`Error fetching ${pageUrl}:`, e.message);
            }
        }

        console.log(`Sitemap crawl complete: ${pages.length} pages`);

        res.json({
            baseUrl: sitemapUrl,
            totalUrlsFound: allUrls.length,
            isSitemapIndex,
            pages
        });
    } catch (error) {
        console.error('Sitemap error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 HeroScore API Server running on http://localhost:${PORT}`);
    console.log('Ready to crawl websites!');
});
