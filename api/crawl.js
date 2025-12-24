// Vercel Serverless Function: Crawl a website
// POST /api/crawl

export const config = {
    maxDuration: 60, // 60 second timeout for Vercel
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, maxPages = 50 } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Normalize URL
        let baseUrl = url;
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl;
        }

        // Remove trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');

        const pages = [];
        const visited = new Set();
        const toVisit = [baseUrl];

        // Crawl pages
        while (toVisit.length > 0 && pages.length < maxPages) {
            const currentUrl = toVisit.shift();

            // Skip if already visited
            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            try {
                const response = await fetch(currentUrl, {
                    headers: {
                        'User-Agent': 'GMC-Compliance-Checker/1.0 (Web Crawler)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    },
                    redirect: 'follow',
                    timeout: 10000,
                });

                if (!response.ok) continue;

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('text/html')) continue;

                const html = await response.text();

                pages.push({
                    url: currentUrl,
                    html: html,
                    status: response.status,
                });

                // Extract links for further crawling
                const linkRegex = /href=["']([^"']+)["']/gi;
                let match;

                while ((match = linkRegex.exec(html)) !== null) {
                    let href = match[1];

                    // Skip non-http links
                    if (href.startsWith('#') || href.startsWith('javascript:') ||
                        href.startsWith('mailto:') || href.startsWith('tel:')) {
                        continue;
                    }

                    // Convert relative to absolute
                    if (href.startsWith('/')) {
                        href = new URL(href, baseUrl).href;
                    } else if (!href.startsWith('http')) {
                        href = new URL(href, baseUrl).href;
                    }

                    // Only crawl same-domain pages
                    try {
                        const linkDomain = new URL(href).hostname;
                        const baseDomain = new URL(baseUrl).hostname;

                        if (linkDomain === baseDomain && !visited.has(href) && !toVisit.includes(href)) {
                            toVisit.push(href);
                        }
                    } catch (e) {
                        // Invalid URL, skip
                    }
                }

            } catch (fetchError) {
                console.error(`Failed to fetch ${currentUrl}:`, fetchError.message);
            }
        }

        return res.status(200).json({
            success: true,
            baseUrl,
            pagesCount: pages.length,
            pages: pages.map(p => ({
                url: p.url,
                html: p.html,
                status: p.status,
            })),
        });

    } catch (error) {
        console.error('Crawl error:', error);
        return res.status(500).json({
            error: 'Failed to crawl website',
            message: error.message
        });
    }
}
