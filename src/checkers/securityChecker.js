// Security Checker
// Validates security requirements for GMC

import { parseHTML, extractLinks } from '../utils/parser';

export function checkSecurity(crawlResults) {
    const issues = [];
    const isHttps = crawlResults.baseUrl.startsWith('https://');

    // HTTPS Check
    if (isHttps) {
        issues.push({
            title: 'SSL/HTTPS Enabled',
            severity: 'pass',
            description: 'Your website uses secure HTTPS protocol.',
            location: crawlResults.baseUrl,
            whyItMatters: 'HTTPS is mandatory for Google Merchant Center approval.'
        });
    } else {
        issues.push({
            title: 'SSL/HTTPS Not Enabled - CRITICAL',
            severity: 'critical',
            description: 'Your website is using HTTP (not secure). This will block GMC approval.',
            location: crawlResults.baseUrl,
            whyItMatters: 'Google Merchant Center REQUIRES HTTPS. Without SSL, your application will be rejected. This protects customer payment information and personal data.',
            howToFix: [
                'Purchase an SSL certificate or use free Let\'s Encrypt',
                'Install SSL certificate on your web server',
                'Configure server to redirect HTTP to HTTPS',
                'Update all internal links to HTTPS',
                'Update your GMC feed URLs to HTTPS'
            ],
            copyPasteCode: `# For Apache (.htaccess)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# For Nginx
server {
    listen 80;
    server_name yourstore.com www.yourstore.com;
    return 301 https://$host$request_uri;
}`,
            suggestions: [
                'Use Cloudflare for free SSL and CDN',
                'Most hosting providers offer one-click SSL',
                'Check SSL certificate expiry regularly',
                'Use SSL Labs to test your configuration'
            ]
        });
    }

    // Check for mixed content
    let mixedContentCount = 0;
    let mixedContentExamples = [];

    crawlResults.pages.forEach(page => {
        const httpRegex = /(?:src|href)\s*=\s*["']http:\/\/[^"']+["']/gi;
        const matches = page.html.match(httpRegex);
        if (matches) {
            mixedContentCount += matches.length;
            if (mixedContentExamples.length < 3) {
                mixedContentExamples.push(...matches.slice(0, 3 - mixedContentExamples.length));
            }
        }
    });

    if (mixedContentCount > 0 && isHttps) {
        issues.push({
            title: `Mixed Content Found (${mixedContentCount} instances)`,
            severity: 'warning',
            description: `Your secure HTTPS site is loading ${mixedContentCount} resources over insecure HTTP. Examples: ${mixedContentExamples.slice(0, 2).join(', ')}`,
            location: 'Multiple pages',
            whyItMatters: 'Mixed content can trigger browser security warnings, showing "Not Secure" to customers. This damages trust and can affect conversions.',
            howToFix: [
                'Find all HTTP resource URLs in your code',
                'Change http:// to https:// for all resources',
                'Use protocol-relative URLs (//) if needed',
                'Check third-party scripts and widgets',
                'Update CDN and image hosting URLs'
            ],
            copyPasteCode: `<!-- Change HTTP resources -->
<!-- From: -->
<img src="http://example.com/image.jpg">
<script src="http://cdn.example.com/script.js"></script>

<!-- To HTTPS: -->
<img src="https://example.com/image.jpg">
<script src="https://cdn.example.com/script.js"></script>

<!-- Or use protocol-relative: -->
<img src="//example.com/image.jpg">`,
            suggestions: [
                'Use browser DevTools to find mixed content',
                'Check database for hardcoded HTTP URLs',
                'Update any embedded widgets or iframes',
                'Use Content-Security-Policy to block mixed content'
            ]
        });
    } else if (isHttps) {
        issues.push({
            title: 'No Mixed Content Detected',
            severity: 'pass',
            description: 'Your HTTPS site loads all resources securely.',
            location: 'All pages'
        });
    }

    // Check for security headers (from HTML analysis)
    const homePage = crawlResults.pages[0];
    if (homePage) {
        const doc = parseHTML(homePage.html);

        // Check for Content-Security-Policy meta tag
        const cspMeta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (cspMeta) {
            issues.push({
                title: 'Content Security Policy Found',
                severity: 'pass',
                description: 'Your site has a Content Security Policy meta tag.',
                location: 'Homepage'
            });
        }
    }

    // Security recommendations
    issues.push({
        title: 'Security Headers Recommendations',
        severity: 'info',
        description: 'Consider implementing these security headers for better protection.',
        location: 'Server configuration',
        whyItMatters: 'Security headers protect your site and customers from various attacks. While not required for GMC, they improve overall security posture.',
        howToFix: [
            'Add X-Frame-Options to prevent clickjacking',
            'Add X-Content-Type-Options to prevent MIME sniffing',
            'Add Strict-Transport-Security for HTTPS enforcement',
            'Consider Content-Security-Policy for XSS protection'
        ],
        copyPasteCode: `# Apache (.htaccess)
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
        suggestions: [
            'Use securityheaders.com to test your configuration',
            'Start with basic headers, then add CSP',
            'Test thoroughly after adding security headers',
            'Consider using Cloudflare for easy header management'
        ]
    });

    // Checkout security check
    const hasSecureCheckout = crawlResults.pages.some(page => {
        const lower = page.html.toLowerCase();
        return (page.url.includes('checkout') || page.url.includes('cart')) &&
            crawlResults.baseUrl.startsWith('https://');
    });

    if (hasSecureCheckout) {
        issues.push({
            title: 'Checkout Pages Use HTTPS',
            severity: 'pass',
            description: 'Your checkout and cart pages are served over HTTPS.',
            location: 'Checkout pages'
        });
    } else if (!isHttps) {
        issues.push({
            title: 'Checkout Must Use HTTPS',
            severity: 'critical',
            description: 'Your checkout process is not secure. This is a critical GMC requirement.',
            location: 'Checkout pages',
            whyItMatters: 'Customers enter payment information during checkout. Without HTTPS, this data could be intercepted by attackers. Google will not approve merchants with insecure checkouts.',
            howToFix: [
                'Enable HTTPS for your entire website',
                'Ensure all checkout forms submit over HTTPS',
                'Verify payment processor integration uses HTTPS',
                'Test complete checkout flow for security warnings'
            ]
        });
    }

    // Payment data protection
    issues.push({
        title: 'Payment Data Protection',
        severity: 'info',
        description: 'Ensure your payment processing follows PCI-DSS requirements.',
        location: 'Checkout/Payment',
        whyItMatters: 'Proper handling of payment card data is required by payment networks and builds customer trust.',
        howToFix: [
            'Use a PCI-compliant payment processor (Stripe, PayPal, etc.)',
            'Never store raw credit card numbers on your server',
            'Use tokenization for payment data',
            'Display security badges from your payment provider'
        ],
        suggestions: [
            'Use Stripe Elements or PayPal Smart Buttons for secure forms',
            'Consider Apple Pay and Google Pay options',
            'Display accepted payment methods clearly',
            'Show security trust badges near payment fields'
        ]
    });

    return {
        name: 'Security',
        description: 'Website security requirements for customer protection',
        issues
    };
}
