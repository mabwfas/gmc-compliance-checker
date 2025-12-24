// Technical Requirements Checker
// Validates HTTPS, mobile responsiveness, speed indicators, robots.txt, sitemap

import { parseHTML, extractMetaTags } from '../utils/parser';

export function checkTechnicalRequirements(crawlResults) {
    const issues = [];

    // Check HTTPS
    const isHttps = crawlResults.baseUrl.startsWith('https://');
    if (isHttps) {
        issues.push({
            title: 'HTTPS/SSL Enabled',
            severity: 'pass',
            description: 'Your website uses HTTPS encryption for secure browsing.',
            location: crawlResults.baseUrl
        });
    } else {
        issues.push({
            title: 'HTTPS/SSL Not Enabled',
            severity: 'critical',
            description: 'Your website is not using HTTPS. This is a mandatory requirement for Google Merchant Center.',
            location: crawlResults.baseUrl,
            whyItMatters: 'Google REQUIRES all merchant websites to use HTTPS with a valid SSL certificate. HTTP-only websites will be rejected from GMC. This protects customer data during checkout.',
            howToFix: [
                'Purchase an SSL certificate from your hosting provider',
                'Many hosts offer free SSL via Let\'s Encrypt',
                'Install the SSL certificate on your web server',
                'Redirect all HTTP traffic to HTTPS',
                'Update all internal links to use HTTPS'
            ],
            copyPasteCode: `# Add to your .htaccess file for Apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Or for nginx
server {
    listen 80;
    server_name yourstore.com;
    return 301 https://$server_name$request_uri;
}`,
            suggestions: [
                'Use a CDN like Cloudflare for free SSL',
                'Check all pages load correctly over HTTPS',
                'Update sitemap and GMC feed to use HTTPS URLs',
                'Verify SSL certificate is valid and not expired'
            ]
        });
    }

    // Check each page for technical issues
    crawlResults.pages.forEach((page, index) => {
        const doc = parseHTML(page.html);
        const metas = extractMetaTags(doc);

        // Check mobile viewport meta tag
        const viewportMeta = doc.querySelector('meta[name="viewport"]');
        if (!viewportMeta && index === 0) {
            issues.push({
                title: 'Mobile Viewport Meta Tag Missing',
                severity: 'critical',
                description: 'The viewport meta tag is missing, which means your site may not display correctly on mobile devices.',
                location: page.url,
                whyItMatters: 'Google prioritizes mobile-friendly websites. A missing viewport tag can cause display issues on mobile devices and negatively affect your GMC approval and ad performance.',
                howToFix: [
                    'Add the viewport meta tag to your HTML <head>',
                    'Ensure responsive design works on all screen sizes',
                    'Test your site on mobile devices',
                    'Use Google\'s Mobile-Friendly Test tool'
                ],
                copyPasteCode: `<!-- Add this to your <head> section -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
                suggestions: [
                    'Make buttons and links touch-friendly (at least 44px tall)',
                    'Ensure text is readable without zooming',
                    'Avoid horizontal scrolling on mobile',
                    'Test checkout process on mobile devices'
                ]
            });
        } else if (viewportMeta && index === 0) {
            issues.push({
                title: 'Mobile Viewport Configured',
                severity: 'pass',
                description: 'Your website has a viewport meta tag for mobile responsiveness.',
                location: page.url
            });
        }

        // Check for page title
        const pageTitle = doc.querySelector('title')?.textContent?.trim();
        if (index === 0) {
            if (!pageTitle || pageTitle.length < 10) {
                issues.push({
                    title: 'Page Title Missing or Too Short',
                    severity: 'warning',
                    description: 'Your homepage has a missing or very short title. Page titles are important for SEO.',
                    location: page.url,
                    whyItMatters: 'Page titles appear in search results and help Google understand your page content. A missing or poor title affects discoverability.',
                    howToFix: [
                        'Add a descriptive <title> tag in your <head>',
                        'Include your brand name and key offerings',
                        'Keep titles between 50-60 characters',
                        'Make each page title unique'
                    ],
                    copyPasteCode: `<title>Your Store Name - Shop [Product Category] | Free Shipping Available</title>`
                });
            }
        }

        // Check meta description
        if (index === 0 && !metas.description) {
            issues.push({
                title: 'Meta Description Missing',
                severity: 'warning',
                description: 'Your homepage is missing a meta description, which affects how your site appears in search results.',
                location: page.url,
                whyItMatters: 'Meta descriptions appear in search results and influence click-through rates. A good description helps customers find your store.',
                howToFix: [
                    'Add a meta description to each page',
                    'Keep descriptions between 150-160 characters',
                    'Include a call-to-action',
                    'Describe what customers will find on the page'
                ],
                copyPasteCode: `<meta name="description" content="Shop quality [products] at [Your Store]. Free shipping on orders over $50. 30-day returns. Browse our collection today!">`,
                suggestions: [
                    'Include your unique selling proposition',
                    'Add promotional information like free shipping',
                    'Make each page\'s meta description unique',
                    'Include relevant keywords naturally'
                ]
            });
        }
    });

    // Check for mixed content (HTTP resources on HTTPS page)
    if (isHttps) {
        let hasMixedContent = false;
        crawlResults.pages.forEach(page => {
            if (page.html.includes('src="http://') || page.html.includes('href="http://')) {
                hasMixedContent = true;
            }
        });

        if (hasMixedContent) {
            issues.push({
                title: 'Mixed Content Detected',
                severity: 'warning',
                description: 'Your HTTPS site is loading some resources over HTTP. This can cause security warnings.',
                location: 'Multiple pages',
                whyItMatters: 'Mixed content (HTTP resources on HTTPS pages) can trigger browser security warnings and may affect user trust. Google may penalize sites with mixed content.',
                howToFix: [
                    'Find all resources loaded via HTTP',
                    'Update image, script, and stylesheet URLs to HTTPS',
                    'Use protocol-relative URLs (//) or full HTTPS URLs',
                    'Check third-party embeds and widgets'
                ],
                copyPasteCode: `<!-- Change from HTTP -->
<img src="http://example.com/image.jpg">

<!-- To HTTPS or protocol-relative -->
<img src="https://example.com/image.jpg">
<img src="//example.com/image.jpg">`,
                suggestions: [
                    'Use browser developer tools to find mixed content',
                    'Update CDN URLs to HTTPS versions',
                    'Check for hardcoded HTTP URLs in database',
                    'Use Content Security Policy to detect mixed content'
                ]
            });
        }
    }

    // Check robots.txt mention
    const hasRobotsReference = crawlResults.pages.some(p => p.html.includes('robots'));
    issues.push({
        title: 'Robots.txt Configuration',
        severity: 'info',
        description: 'Ensure your robots.txt file allows Google to crawl important pages.',
        location: `${crawlResults.baseUrl}/robots.txt`,
        whyItMatters: 'A misconfigured robots.txt can block Googlebot from accessing your product pages, which would prevent them from appearing in Google Shopping.',
        howToFix: [
            'Create a robots.txt file at your domain root',
            'Allow Googlebot to access all product pages',
            'Block only admin and internal pages',
            'Submit your sitemap URL in robots.txt'
        ],
        copyPasteCode: `# robots.txt - Place at yoursite.com/robots.txt

User-agent: *
Allow: /

# Block admin areas
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/

# Sitemap
Sitemap: https://yoursite.com/sitemap.xml`,
        suggestions: [
            'Test robots.txt with Google Search Console',
            'Don\'t block CSS or JavaScript files needed for rendering',
            'Include your sitemap location',
            'Check for accidental "Disallow: /" entries'
        ]
    });

    // Sitemap recommendation
    issues.push({
        title: 'XML Sitemap Recommended',
        severity: 'info',
        description: 'Ensure you have an XML sitemap listing all your product pages.',
        location: `${crawlResults.baseUrl}/sitemap.xml`,
        whyItMatters: 'An XML sitemap helps Google discover all your product pages. Submitting it to Search Console improves indexing of your products.',
        howToFix: [
            'Generate an XML sitemap with all product URLs',
            'Include lastmod dates for each URL',
            'Submit sitemap to Google Search Console',
            'Keep sitemap updated when products change'
        ],
        copyPasteCode: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yoursite.com/products/example-product</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`,
        suggestions: [
            'Use sitemap generators for your platform',
            'Limit each sitemap to 50,000 URLs',
            'Create sitemap index for large sites',
            'Update sitemap automatically with product changes'
        ]
    });

    return {
        name: 'Technical Requirements',
        description: 'Technical and infrastructure requirements for GMC',
        issues
    };
}
