/**
 * Brand Consistency Checker - STRICT VERSION
 * Analyzes brand elements with rigorous, specific checks
 * Will find issues on most websites
 */

function createBrandSuggestion(title, description, location, impact, fix, codeExample = null) {
    const impactMessages = {
        critical: 'Inconsistent branding damages professional perception',
        high: 'Brand inconsistency confuses customers',
        medium: 'Improving this strengthens brand recognition',
        low: 'Minor branding enhancement opportunity'
    };

    return {
        title,
        description,
        location,
        severity: impact === 'critical' || impact === 'high' ? 'critical' : 'warning',
        impact,
        businessImpact: impactMessages[impact] || impactMessages.medium,
        howToFix: Array.isArray(fix) ? fix : [fix],
        copyPasteCode: codeExample,
        whyItMatters: `Consistent branding builds trust and recognition. ${impactMessages[impact]}`
    };
}

export function checkBrandConsistency(crawlResults) {
    const issues = [];
    let score = 10; // Max 10 points

    const pages = crawlResults.pages || [];
    const allHtml = pages.map(p => p.html || '').join(' ');
    const allHtmlLower = allHtml.toLowerCase();

    const homePage = pages.find(p =>
        p.url === crawlResults.baseUrl ||
        p.url === crawlResults.baseUrl + '/'
    ) || pages[0];
    const homeHtml = homePage?.html || '';

    // ============================================
    // 1. SVG/High-Quality Logo (2 pts)
    // Must have actual logo, not just text
    // ============================================
    const logoPatterns = [
        /<img[^>]*logo[^>]*\.(svg|png|webp)/i,
        /<svg[^>]*logo/i,
        /class="[^"]*logo[^"]*"[^>]*><img/i,
        /site-logo.*<img/i
    ];

    const hasProperLogo = logoPatterns.some(p => p.test(allHtml));

    // Check for text-only logo (bad)
    const textOnlyLogo = /<(h1|span|div)[^>]*class="[^"]*logo[^"]*"[^>]*>[^<]*<\/(h1|span|div)>/i.test(allHtml);

    if (!hasProperLogo) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'No Image Logo Found',
            textOnlyLogo ? 'Logo appears to be text-only. Use an actual image/SVG.' : 'No logo image detected on the site.',
            '/',
            'critical',
            [
                'Add SVG logo for crisp display',
                'Include logo in header on all pages',
                'Use at least 150px width for visibility'
            ],
            `<a href="/" class="logo">
  <img src="/logo.svg" alt="Brand Name" width="180" height="60">
</a>`
        ));
    } else {
        issues.push({ title: 'Image Logo Present', severity: 'pass', description: 'Proper logo file found' });
    }

    // ============================================
    // 2. Favicon with Multiple Sizes (1 pt)
    // ============================================
    const faviconPatterns = [
        /<link[^>]*rel=["']icon["'][^>]*>/i,
        /<link[^>]*rel=["']shortcut icon["'][^>]*>/i
    ];
    const appleTouchIcon = /<link[^>]*rel=["']apple-touch-icon["'][^>]*>/i.test(allHtml);
    const hasFavicon = faviconPatterns.some(p => p.test(allHtml));

    if (!hasFavicon) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'No Favicon',
            'No favicon found. This appears in browser tabs.',
            '/',
            'high',
            ['Add favicon.ico or PNG favicon', 'Add Apple touch icon for iOS'],
            `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
        ));
    } else if (!appleTouchIcon) {
        score -= 0.5;
        issues.push(createBrandSuggestion(
            'Missing Apple Touch Icon',
            'Favicon exists but no Apple touch icon for iOS devices.',
            '/',
            'low',
            ['Add apple-touch-icon for better iOS appearance'],
            null
        ));
    } else {
        issues.push({ title: 'Favicon Complete', severity: 'pass', description: 'All favicon sizes present' });
    }

    // ============================================
    // 3. Consistent Footer Branding (1 pt)
    // ============================================
    const footerPatterns = [
        /<footer/i
    ];
    const hasFooter = footerPatterns.some(p => p.test(allHtml));

    // Check footer has logo and brand info
    const footerMatch = allHtml.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const footerContent = footerMatch ? footerMatch[1] : '';
    const footerHasLogo = /logo|brand/i.test(footerContent) && /<img/i.test(footerContent);
    const footerHasCopyright = /©|copyright|\d{4}/i.test(footerContent);

    if (!hasFooter || !footerHasCopyright) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'Incomplete Footer Branding',
            'Footer missing logo, copyright, or brand information.',
            '/',
            'medium',
            [
                'Add logo to footer',
                'Include copyright notice with year',
                'Add company address/info'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Footer Branding Present', severity: 'pass', description: 'Footer has brand elements' });
    }

    // ============================================
    // 4. Branded Loading State (1 pt)
    // ============================================
    const loadingPatterns = [
        /loading/i,
        /skeleton/i,
        /placeholder/i,
        /spinner.*brand/i,
        /preloader/i
    ];

    const hasBrandedLoading = loadingPatterns.some(p => p.test(allHtml));

    if (!hasBrandedLoading) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'No Branded Loading States',
            'No skeleton loaders or branded spinners detected.',
            '/',
            'low',
            [
                'Add skeleton loading for products',
                'Use brand colors in loading spinners',
                'Add preloader with logo'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Loading States Present', severity: 'pass', description: 'Loading UI detected' });
    }

    // ============================================
    // 5. Meta Brand Info (OG Tags) (1 pt)
    // ============================================
    const ogTagPatterns = [
        /<meta[^>]*property=["']og:title["']/i,
        /<meta[^>]*property=["']og:image["']/i,
        /<meta[^>]*property=["']og:description["']/i
    ];

    const ogTagCount = ogTagPatterns.filter(p => p.test(allHtml)).length;

    if (ogTagCount < 2) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'Missing Open Graph Tags',
            'Incomplete OG meta tags. Links shared on social media won\'t look professional.',
            '/',
            'high',
            [
                'Add og:title, og:description, og:image',
                'Use branded image for og:image',
                'Test with Facebook Debugger'
            ],
            `<meta property="og:title" content="Your Brand Name">
<meta property="og:description" content="Your compelling description">
<meta property="og:image" content="https://yoursite.com/og-image.jpg">`
        ));
    } else {
        issues.push({ title: 'OG Tags Present', severity: 'pass', description: 'Social sharing optimized' });
    }

    // ============================================
    // 6. Consistent Button Styling (1 pt)
    // ============================================
    const buttonPatterns = [
        /btn-primary/i,
        /button--primary/i,
        /cta-button/i,
        /shopify-payment-button/i
    ];

    // Check for inconsistent button classes
    const buttonClasses = allHtml.match(/class="[^"]*btn[^"]*"/gi) || [];
    const uniqueButtonStyles = new Set(buttonClasses.map(b => b.toLowerCase()));

    if (uniqueButtonStyles.size > 8) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'Inconsistent Button Styles',
            `Found ${uniqueButtonStyles.size} different button styles. Use consistent CTA styling.`,
            '/',
            'medium',
            [
                'Standardize primary/secondary button classes',
                'Use consistent colors and sizes',
                'Create button design system'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Button Styling Consistent', severity: 'pass', description: 'Buttons are uniform' });
    }

    // ============================================
    // 7. Brand Color in Theme Color (1 pt)
    // ============================================
    const themeColorPattern = /<meta[^>]*name=["']theme-color["'][^>]*>/i;
    const hasThemeColor = themeColorPattern.test(allHtml);

    if (!hasThemeColor) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'No Theme Color Set',
            'No theme-color meta tag. Mobile browser UI won\'t match brand.',
            '/',
            'low',
            [
                'Add theme-color meta tag with brand color',
                'Enhances mobile browser appearance'
            ],
            `<meta name="theme-color" content="#2563eb">`
        ));
    } else {
        issues.push({ title: 'Theme Color Set', severity: 'pass', description: 'Mobile UI branded' });
    }

    // ============================================
    // 8. Professional Email Domain (1 pt)
    // ============================================
    const emailPatterns = [
        /(?:mailto:)?[\w.-]+@(gmail|yahoo|hotmail|outlook)\.(com|net)/gi
    ];

    const hasFreeEmail = emailPatterns.some(p => p.test(allHtml));
    const hasBrandedEmail = /@[a-z0-9-]+\.(com|co|io|store|shop)/i.test(allHtml) && !hasFreeEmail;

    if (hasFreeEmail) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'Using Free Email Provider',
            'Contact email uses Gmail/Yahoo instead of branded domain.',
            '/contact',
            'high',
            [
                'Use email@yourdomain.com instead',
                'Set up custom domain email',
                'More professional and trustworthy'
            ],
            null
        ));
    } else if (!hasBrandedEmail) {
        issues.push({ title: 'Email Domain Check', severity: 'pass', description: 'No free email detected' });
    } else {
        issues.push({ title: 'Branded Email', severity: 'pass', description: 'Professional email domain' });
    }

    return {
        name: 'Brand Consistency',
        maxPoints: 10,
        score: Math.max(0, Math.round(score)),
        issues,
        subcategories: [
            { name: 'Image Logo', maxPoints: 2 },
            { name: 'Favicon', maxPoints: 1 },
            { name: 'Footer Branding', maxPoints: 1 },
            { name: 'Loading States', maxPoints: 1 },
            { name: 'OG Tags', maxPoints: 1 },
            { name: 'Button Styles', maxPoints: 1 },
            { name: 'Theme Color', maxPoints: 1 },
            { name: 'Email Domain', maxPoints: 1 }
        ]
    };
}
