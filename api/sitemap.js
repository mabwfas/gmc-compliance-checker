// Vercel Serverless Function: Parse sitemap.xml and crawl all URLs
// POST /api/sitemap

export const config = {
    maxDuration: 60,
};

export default async function handler(req, res) {
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
        const { sitemapUrl, maxPages = 100 } = req.body;

        if (!sitemapUrl) {
            return res.status(400).json({ error: 'Sitemap URL is required' });
        }

        // Fetch sitemap
        const sitemapResponse = await fetch(sitemapUrl, {
            headers: {
                'User-Agent': 'GMC-Compliance-Checker/1.0',
                'Accept': 'application/xml,text/xml,*/*',
            },
        });

        if (!sitemapResponse.ok) {
            return res.status(400).json({
                error: 'Failed to fetch sitemap',
                status: sitemapResponse.status
            });
        }

        const sitemapXml = await sitemapResponse.text();

        // Parse URLs from sitemap
        const urlRegex = /<loc>([^<]+)<\/loc>/gi;
        const urls = [];
        let match;

        while ((match = urlRegex.exec(sitemapXml)) !== null) {
            urls.push(match[1].trim());
        }

        // Check if this is a sitemap index (contains other sitemaps)
        const isSitemapIndex = sitemapXml.includes('<sitemapindex');

        let allUrls = [];

        if (isSitemapIndex) {
            // Fetch child sitemaps
            for (const childSitemapUrl of urls.slice(0, 5)) { // Limit to 5 child sitemaps
                try {
                    const childResponse = await fetch(childSitemapUrl, {
                        headers: {
                            'User-Agent': 'GMC-Compliance-Checker/1.0',
                            'Accept': 'application/xml,text/xml,*/*',
                        },
                    });

                    if (childResponse.ok) {
                        const childXml = await childResponse.text();
                        let childMatch;
                        while ((childMatch = urlRegex.exec(childXml)) !== null) {
                            allUrls.push(childMatch[1].trim());
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch child sitemap ${childSitemapUrl}:`, e.message);
                }
            }
        } else {
            allUrls = urls;
        }

        // Limit URLs and crawl them
        const urlsToCrawl = allUrls.slice(0, maxPages);
        const pages = [];

        for (const url of urlsToCrawl) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'GMC-Compliance-Checker/1.0',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    },
                    redirect: 'follow',
                });

                if (!response.ok) continue;

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('text/html')) continue;

                const html = await response.text();

                pages.push({
                    url: url,
                    html: html,
                    status: response.status,
                });

            } catch (fetchError) {
                console.error(`Failed to fetch ${url}:`, fetchError.message);
            }
        }

        return res.status(200).json({
            success: true,
            sitemapUrl,
            totalUrlsFound: allUrls.length,
            pagesCount: pages.length,
            isSitemapIndex,
            pages: pages.map(p => ({
                url: p.url,
                html: p.html,
                status: p.status,
            })),
        });

    } catch (error) {
        console.error('Sitemap error:', error);
        return res.status(500).json({
            error: 'Failed to process sitemap',
            message: error.message
        });
    }
}
