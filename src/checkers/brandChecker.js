/**
 * Brand Consistency Checker
 * Analyzes brand elements across all pages for consistency
 * Critical for professional brand appearance
 */

// Helper to create a brand suggestion
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
    let score = 15; // Max 15 points for brand consistency

    const pages = crawlResults.pages || [];
    const allHtml = pages.map(p => p.html || '').join(' ');
    const allHtmlLower = allHtml.toLowerCase();

    // ============================================
    // 1. Logo Presence on Every Page (4 pts)
    // ============================================
    const logoPatterns = [
        /<img[^>]*logo[^>]*>/gi,
        /class="[^"]*logo[^"]*"/gi,
        /id="[^"]*logo[^"]*"/gi,
        /<a[^>]*class="[^"]*brand[^"]*"[^>]*>/gi,
        /site-logo|header-logo|brand-logo/gi
    ];

    let pagesWithLogo = 0;
    let pagesWithoutLogo = [];

    pages.forEach(page => {
        const pageHtml = page.html || '';
        const hasLogo = logoPatterns.some(p => p.test(pageHtml));
        if (hasLogo) {
            pagesWithLogo++;
        } else {
            pagesWithoutLogo.push(page.url);
        }
        // Reset regex lastIndex
        logoPatterns.forEach(p => p.lastIndex = 0);
    });

    const logoPercentage = pages.length > 0 ? (pagesWithLogo / pages.length) * 100 : 0;

    if (logoPercentage < 50) {
        score -= 4;
        issues.push(createBrandSuggestion(
            'Logo Missing on Most Pages',
            `Logo only found on ${Math.round(logoPercentage)}% of pages. Brand should be visible everywhere.`,
            '/',
            'critical',
            [
                'Add logo to header on all page templates',
                'Ensure logo links back to homepage',
                'Use consistent logo placement'
            ],
            `<header>
  <a href="/" class="logo">
    <img src="/logo.svg" alt="Brand Name" width="150" height="50">
  </a>
</header>`
        ));
    } else if (logoPercentage < 90) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'Logo Missing on Some Pages',
            `Logo found on ${Math.round(logoPercentage)}% of pages. ${pagesWithoutLogo.length} pages missing logo.`,
            pagesWithoutLogo[0] || '/',
            'medium',
            ['Add logo to all page templates', 'Check special landing pages'],
            null
        ));
    } else {
        issues.push({ title: 'Logo Present Everywhere', severity: 'pass', description: 'Logo found on all pages' });
    }

    // ============================================
    // 2. Favicon Present (2 pts)
    // ============================================
    const faviconPatterns = [
        /<link[^>]*rel=["'](?:shortcut\s*)?icon["'][^>]*>/i,
        /<link[^>]*rel=["']apple-touch-icon["'][^>]*>/i,
        /favicon/i
    ];

    const hasFavicon = faviconPatterns.some(p => p.test(allHtml));

    if (!hasFavicon) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'Favicon Missing',
            'No favicon detected. This appears in browser tabs and bookmarks.',
            '/',
            'high',
            [
                'Add a 32x32 favicon.ico',
                'Add Apple touch icons for mobile',
                'Use your logo or brand mark as favicon'
            ],
            `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
        ));
    } else {
        issues.push({ title: 'Favicon Present', severity: 'pass', description: 'Favicon detected' });
    }

    // ============================================
    // 3. Consistent Color Palette (3 pts)
    // ============================================
    // Extract hex colors from CSS
    const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
    const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;

    const hexColors = allHtml.match(colorRegex) || [];
    const rgbColors = allHtml.match(rgbRegex) || [];
    const uniqueColors = new Set([...hexColors.map(c => c.toLowerCase())]);

    // Too many colors = inconsistent brand
    if (uniqueColors.size > 20) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'Too Many Colors Used',
            `Found ${uniqueColors.size} different colors. A consistent brand uses 3-5 primary colors.`,
            '/',
            'medium',
            [
                'Define a brand color palette (primary, secondary, accent)',
                'Use CSS custom properties for colors',
                'Limit to 3-5 main brand colors',
                'Use tints/shades of primary colors for variation'
            ],
            `:root {
  --brand-primary: #2563eb;
  --brand-secondary: #10b981;
  --brand-accent: #f59e0b;
  --brand-dark: #1f2937;
  --brand-light: #f9fafb;
}`
        ));
    } else if (uniqueColors.size < 3) {
        score -= 1;
        issues.push(createBrandSuggestion(
            'Limited Color Palette',
            'Very few colors detected. Consider adding accent colors for visual interest.',
            '/',
            'low',
            ['Add secondary and accent colors to brand palette'],
            null
        ));
    } else {
        issues.push({ title: 'Consistent Color Palette', severity: 'pass', description: `${uniqueColors.size} colors in use` });
    }

    // ============================================
    // 4. Typography Consistency (3 pts)
    // ============================================
    const fontPatterns = [
        /font-family:\s*["']?([^"';,]+)/gi,
        /fonts\.googleapis\.com\/css[^"']+family=([^"'&]+)/gi
    ];

    const fonts = new Set();
    fontPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(allHtml)) !== null) {
            fonts.add(match[1].trim().toLowerCase().replace(/['"]/g, ''));
        }
    });

    // Filter out system fonts
    const systemFonts = ['arial', 'helvetica', 'sans-serif', 'serif', 'monospace', 'inherit', 'initial'];
    const brandFonts = [...fonts].filter(f => !systemFonts.some(sf => f.includes(sf)));

    if (brandFonts.length === 0) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'No Custom Brand Fonts',
            'Using only system fonts. Custom fonts strengthen brand identity.',
            '/',
            'medium',
            [
                'Choose 1-2 brand fonts from Google Fonts',
                'Use one font for headings, another for body',
                'Ensure fonts match brand personality'
            ],
            `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

<style>
  h1, h2, h3 { font-family: 'Outfit', sans-serif; }
  body { font-family: 'Inter', sans-serif; }
</style>`
        ));
    } else if (brandFonts.length > 4) {
        score -= 2;
        issues.push(createBrandSuggestion(
            'Too Many Fonts',
            `${brandFonts.length} different fonts detected. Stick to 2-3 for consistency.`,
            '/',
            'medium',
            [
                'Limit to 2-3 font families',
                'Use font weights instead of different fonts',
                'Choose one display font and one body font'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Typography Consistent', severity: 'pass', description: `${brandFonts.length} brand fonts in use` });
    }

    // ============================================
    // 5. Tagline/Value Proposition (3 pts)
    // ============================================
    const taglinePatterns = [
        /<h1[^>]*>.*<\/h1>/gi,
        /class="[^"]*tagline[^"]*"/gi,
        /class="[^"]*hero-text[^"]*"/gi,
        /class="[^"]*value-prop[^"]*"/gi,
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/gi
    ];

    const homePage = pages.find(p =>
        p.url === crawlResults.baseUrl ||
        p.url === crawlResults.baseUrl + '/'
    ) || pages[0];
    const homeHtml = homePage?.html || '';

    const hasTagline = taglinePatterns.some(p => {
        p.lastIndex = 0;
        return p.test(homeHtml);
    });

    // Check for meta description
    const metaDescMatch = homeHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const hasMetaDesc = metaDescMatch && metaDescMatch[1].length > 50;

    if (!hasTagline && !hasMetaDesc) {
        score -= 3;
        issues.push(createBrandSuggestion(
            'No Clear Value Proposition',
            'Homepage lacks a clear tagline or value proposition in the hero section.',
            '/',
            'high',
            [
                'Add a compelling H1 headline',
                'Include a tagline under the logo',
                'State your unique value in 10 words or less',
                'Answer "What do you do?" immediately'
            ],
            `<section class="hero">
  <h1>Premium Eco-Friendly Products for Modern Living</h1>
  <p class="tagline">Sustainable style, delivered to your door</p>
  <a href="/shop" class="cta">Shop Now</a>
</section>`
        ));
    } else {
        issues.push({ title: 'Value Proposition Present', severity: 'pass', description: 'Headline or tagline detected' });
    }

    return {
        name: 'Brand Consistency',
        maxPoints: 15,
        score: Math.max(0, score),
        issues,
        subcategories: [
            { name: 'Logo Everywhere', maxPoints: 4 },
            { name: 'Favicon', maxPoints: 2 },
            { name: 'Color Palette', maxPoints: 3 },
            { name: 'Typography', maxPoints: 3 },
            { name: 'Value Proposition', maxPoints: 3 }
        ]
    };
}
