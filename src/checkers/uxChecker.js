/**
 * User Experience (UX) Quality Checker
 * Analyzes navigation, usability, accessibility, and user journey
 */

export function checkUserExperience(crawlResults) {
    const issues = [];
    const pages = crawlResults.pages || [];

    const uxMetrics = {
        navigation: { score: 0, max: 25, suggestions: [], details: [] },
        accessibility: { score: 0, max: 20, suggestions: [], details: [] },
        pageSpeed: { score: 0, max: 20, suggestions: [], details: [] },
        userJourney: { score: 0, max: 20, suggestions: [], details: [] },
        mobileUX: { score: 0, max: 15, suggestions: [], details: [] }
    };

    pages.forEach(page => {
        const html = page.html || '';
        const url = page.url || '';
        const lowerHtml = html.toLowerCase();

        // Navigation Analysis
        const hasNav = lowerHtml.includes('<nav') || lowerHtml.includes('navigation');
        const hasHeader = lowerHtml.includes('<header');
        const hasFooter = lowerHtml.includes('<footer');
        const hasBreadcrumbs = lowerHtml.includes('breadcrumb');
        const hasSearch = lowerHtml.includes('search') && (lowerHtml.includes('<input') || lowerHtml.includes('<form'));
        const hasMenu = lowerHtml.includes('menu') || lowerHtml.includes('hamburger');

        if (hasNav) uxMetrics.navigation.score += 8;
        if (hasHeader) uxMetrics.navigation.score += 4;
        if (hasFooter) uxMetrics.navigation.score += 4;
        if (hasBreadcrumbs) uxMetrics.navigation.score += 5;
        if (hasSearch) uxMetrics.navigation.score += 4;

        // Accessibility Analysis
        const hasAltTags = (html.match(/alt=["'][^"']+["']/gi) || []).length;
        const totalImages = (html.match(/<img/gi) || []).length;
        const hasAriaLabels = lowerHtml.includes('aria-label') || lowerHtml.includes('aria-');
        const hasSkipLink = lowerHtml.includes('skip to') || lowerHtml.includes('skip-to');
        const hasFocusStyles = lowerHtml.includes(':focus') || lowerHtml.includes('focus-visible');
        const hasSemanticHTML = lowerHtml.includes('<main') || lowerHtml.includes('<article') || lowerHtml.includes('<section');
        const hasFormLabels = (html.match(/<label/gi) || []).length > 0;

        if (totalImages > 0 && hasAltTags >= totalImages * 0.5) {
            uxMetrics.accessibility.score += 5;
        }
        if (hasAriaLabels) uxMetrics.accessibility.score += 5;
        if (hasSemanticHTML) uxMetrics.accessibility.score += 5;
        if (hasFormLabels) uxMetrics.accessibility.score += 5;

        // Page Speed Indicators
        const hasLazyLoad = lowerHtml.includes('loading="lazy"') || lowerHtml.includes('lazyload');
        const hasMinifiedAssets = !lowerHtml.includes('    ') || lowerHtml.length < 100000;
        const hasAsyncScripts = lowerHtml.includes('async') || lowerHtml.includes('defer');
        const hasCriticalCSS = lowerHtml.includes('<style') && lowerHtml.indexOf('<style') < lowerHtml.indexOf('</head>');
        const hasPreload = lowerHtml.includes('rel="preload"') || lowerHtml.includes("rel='preload'");

        if (hasLazyLoad) uxMetrics.pageSpeed.score += 5;
        if (hasAsyncScripts) uxMetrics.pageSpeed.score += 5;
        if (hasCriticalCSS) uxMetrics.pageSpeed.score += 5;
        if (hasPreload) uxMetrics.pageSpeed.score += 5;

        // User Journey Analysis
        const isHomePage = url.endsWith('/') || url.endsWith('.com') || url.includes('index');
        const hasHeroCTA = lowerHtml.includes('hero') && (lowerHtml.includes('button') || lowerHtml.includes('cta'));
        const hasCategories = lowerHtml.includes('category') || lowerHtml.includes('collection');
        const hasFilters = lowerHtml.includes('filter') || lowerHtml.includes('sort');
        const hasWishlist = lowerHtml.includes('wishlist') || lowerHtml.includes('save for later') || lowerHtml.includes('favorite');
        const hasQuickView = lowerHtml.includes('quick view') || lowerHtml.includes('quick-view');

        if (hasHeroCTA) uxMetrics.userJourney.score += 5;
        if (hasCategories) uxMetrics.userJourney.score += 5;
        if (hasFilters) uxMetrics.userJourney.score += 5;
        if (hasWishlist) uxMetrics.userJourney.score += 3;
        if (hasQuickView) uxMetrics.userJourney.score += 2;

        // Mobile UX
        const hasViewport = lowerHtml.includes('viewport');
        const hasTouchFriendly = lowerHtml.includes('touch') || lowerHtml.includes('swipe');
        const hasMobileMenu = lowerHtml.includes('mobile-menu') || lowerHtml.includes('hamburger') || lowerHtml.includes('mobile-nav');
        const hasResponsiveImages = lowerHtml.includes('srcset') || lowerHtml.includes('picture');
        const noHorizontalScroll = !lowerHtml.includes('overflow-x: scroll');

        if (hasViewport) uxMetrics.mobileUX.score += 5;
        if (hasMobileMenu) uxMetrics.mobileUX.score += 4;
        if (hasResponsiveImages) uxMetrics.mobileUX.score += 3;
        if (noHorizontalScroll) uxMetrics.mobileUX.score += 3;
    });

    // Normalize scores
    Object.keys(uxMetrics).forEach(key => {
        uxMetrics[key].score = Math.min(uxMetrics[key].score, uxMetrics[key].max);
    });

    // Calculate total UX score
    const maxTotal = Object.values(uxMetrics).reduce((sum, m) => sum + m.max, 0);
    const actualTotal = Object.values(uxMetrics).reduce((sum, m) => sum + m.score, 0);
    const uxScore = Math.round((actualTotal / maxTotal) * 100);

    // Generate suggestions
    if (uxMetrics.navigation.score < 20) {
        uxMetrics.navigation.suggestions.push(
            'Add a clear, sticky navigation header',
            'Include breadcrumb navigation on product/category pages',
            'Add a prominent search bar for easy product discovery',
            'Create a mega menu for better category browsing',
            'Include footer navigation with key links'
        );
    }

    if (uxMetrics.accessibility.score < 15) {
        uxMetrics.accessibility.suggestions.push(
            'Add alt text to all images describing the content',
            'Use ARIA labels for interactive elements',
            'Include a skip-to-content link for keyboard users',
            'Ensure sufficient color contrast (4.5:1 ratio)',
            'Add labels to all form inputs'
        );
    }

    if (uxMetrics.pageSpeed.score < 15) {
        uxMetrics.pageSpeed.suggestions.push(
            'Implement lazy loading for images below the fold',
            'Use async/defer attributes for non-critical scripts',
            'Add preload hints for critical resources',
            'Minimize and compress CSS/JavaScript files',
            'Use a CDN for faster asset delivery'
        );
    }

    if (uxMetrics.userJourney.score < 15) {
        uxMetrics.userJourney.suggestions.push(
            'Add clear CTAs in your hero section',
            'Include product filtering and sorting options',
            'Show recently viewed products for easy navigation',
            'Add wishlist/save for later functionality',
            'Implement quick view for faster product browsing'
        );
    }

    if (uxMetrics.mobileUX.score < 10) {
        uxMetrics.mobileUX.suggestions.push(
            'Ensure proper viewport meta tag is set',
            'Create a mobile-friendly hamburger menu',
            'Use responsive images with srcset',
            'Make buttons and links at least 44x44px',
            'Test on real mobile devices'
        );
    }

    issues.push({
        severity: uxScore >= 70 ? 'pass' : uxScore >= 40 ? 'warning' : 'critical',
        title: 'User Experience Assessment',
        description: `Your website's UX scored ${uxScore}/100. ${uxScore >= 70 ? 'Excellent user experience!' : uxScore >= 40 ? 'UX needs some improvements.' : 'Significant UX improvements needed.'}`,
        uxScore,
        metrics: uxMetrics,
        location: pages[0]?.url,
        whyItMatters: 'User experience directly impacts customer satisfaction, conversion rates, and SEO rankings. Google uses Core Web Vitals and user signals to rank websites.',
        howToFix: [
            'Simplify navigation and make key pages easy to find',
            'Improve accessibility for all users',
            'Optimize page speed for faster loading',
            'Streamline the path from landing to purchase',
            'Ensure excellent mobile experience'
        ],
        suggestions: Object.values(uxMetrics).flatMap(m => m.suggestions)
    });

    return {
        name: 'User Experience',
        description: 'Evaluates navigation, accessibility, speed, user journey, and mobile experience',
        score: uxScore,
        issues
    };
}
