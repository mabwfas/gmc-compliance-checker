/**
 * Design Quality Checker
 * Analyzes website design elements and provides ratings with suggestions
 */

export function checkDesignQuality(crawlResults) {
    const issues = [];
    const pages = crawlResults.pages || [];

    let totalScore = 0;
    let checksPerformed = 0;

    const designMetrics = {
        colorConsistency: { score: 0, max: 20, suggestions: [] },
        typography: { score: 0, max: 20, suggestions: [] },
        spacing: { score: 0, max: 15, suggestions: [] },
        imagery: { score: 0, max: 20, suggestions: [] },
        modernElements: { score: 0, max: 15, suggestions: [] },
        mobileResponsive: { score: 0, max: 10, suggestions: [] }
    };

    pages.forEach(page => {
        const html = page.html || '';
        const url = page.url || '';
        const lowerHtml = html.toLowerCase();

        // Check for CSS frameworks and modern styling
        const hasModernFramework = lowerHtml.includes('tailwind') ||
            lowerHtml.includes('bootstrap') ||
            lowerHtml.includes('material') ||
            lowerHtml.includes('chakra');

        const hasCustomCSS = lowerHtml.includes('<style') || lowerHtml.includes('stylesheet');
        const hasCSSVariables = lowerHtml.includes('--') && lowerHtml.includes('var(');

        // Typography Analysis
        const hasGoogleFonts = lowerHtml.includes('fonts.googleapis.com') || lowerHtml.includes('fonts.gstatic.com');
        const hasCustomFonts = lowerHtml.includes('@font-face') || lowerHtml.includes('font-family');
        const hasProperHeadings = lowerHtml.includes('<h1') && lowerHtml.includes('<h2');

        if (hasGoogleFonts || hasCustomFonts) {
            designMetrics.typography.score += 10;
        }
        if (hasProperHeadings) {
            designMetrics.typography.score += 10;
        }

        // Color & Branding
        const hasColorPalette = hasCSSVariables || lowerHtml.includes('primary') || lowerHtml.includes('brand');
        const hasDarkMode = lowerHtml.includes('dark-mode') || lowerHtml.includes('theme-dark') || lowerHtml.includes('prefers-color-scheme');

        if (hasColorPalette) {
            designMetrics.colorConsistency.score += 15;
        }
        if (hasDarkMode) {
            designMetrics.colorConsistency.score += 5;
        }

        // Imagery
        const imgCount = (html.match(/<img/gi) || []).length;
        const hasLazyLoad = lowerHtml.includes('loading="lazy"') || lowerHtml.includes('lazyload');
        const hasWebP = lowerHtml.includes('.webp');
        const hasSVG = lowerHtml.includes('<svg') || lowerHtml.includes('.svg');

        if (imgCount > 0) {
            designMetrics.imagery.score += 10;
        }
        if (hasWebP || hasSVG) {
            designMetrics.imagery.score += 5;
        }
        if (hasLazyLoad) {
            designMetrics.imagery.score += 5;
        }

        // Modern Elements
        const hasAnimations = lowerHtml.includes('animation') || lowerHtml.includes('transition') || lowerHtml.includes('keyframes');
        const hasGradients = lowerHtml.includes('gradient');
        const hasFlexGrid = lowerHtml.includes('flex') || lowerHtml.includes('grid');
        const hasShadows = lowerHtml.includes('box-shadow') || lowerHtml.includes('shadow');

        if (hasAnimations) designMetrics.modernElements.score += 5;
        if (hasGradients) designMetrics.modernElements.score += 3;
        if (hasFlexGrid) designMetrics.modernElements.score += 4;
        if (hasShadows) designMetrics.modernElements.score += 3;

        // Mobile Responsive
        const hasViewport = lowerHtml.includes('viewport');
        const hasMediaQueries = lowerHtml.includes('@media') || lowerHtml.includes('responsive');

        if (hasViewport) designMetrics.mobileResponsive.score += 5;
        if (hasMediaQueries) designMetrics.mobileResponsive.score += 5;

        // Spacing
        const hasPadding = lowerHtml.includes('padding');
        const hasMargin = lowerHtml.includes('margin');
        const hasGap = lowerHtml.includes('gap:') || lowerHtml.includes('gap;');

        if (hasPadding) designMetrics.spacing.score += 5;
        if (hasMargin) designMetrics.spacing.score += 5;
        if (hasGap) designMetrics.spacing.score += 5;

        checksPerformed++;
    });

    // Normalize scores
    Object.keys(designMetrics).forEach(key => {
        designMetrics[key].score = Math.min(designMetrics[key].score, designMetrics[key].max);
    });

    // Calculate total design score
    const maxTotal = Object.values(designMetrics).reduce((sum, m) => sum + m.max, 0);
    const actualTotal = Object.values(designMetrics).reduce((sum, m) => sum + m.score, 0);
    const designScore = Math.round((actualTotal / maxTotal) * 100);

    // Generate suggestions based on scores
    if (designMetrics.typography.score < 15) {
        designMetrics.typography.suggestions.push(
            'Use Google Fonts or custom web fonts for professional typography',
            'Establish clear heading hierarchy (H1 → H2 → H3)',
            'Ensure font sizes are readable (min 16px for body text)',
            'Use line-height of 1.5-1.7 for better readability'
        );
    }

    if (designMetrics.colorConsistency.score < 15) {
        designMetrics.colorConsistency.suggestions.push(
            'Create a consistent color palette with primary, secondary, and accent colors',
            'Use CSS variables for easy theming and consistency',
            'Consider adding dark mode support for better UX',
            'Ensure sufficient color contrast (WCAG AA compliance)'
        );
    }

    if (designMetrics.imagery.score < 15) {
        designMetrics.imagery.suggestions.push(
            'Use high-quality product images with consistent dimensions',
            'Implement WebP format for faster loading',
            'Add lazy loading to images below the fold',
            'Use SVG for icons and logos for crisp rendering'
        );
    }

    if (designMetrics.modernElements.score < 10) {
        designMetrics.modernElements.suggestions.push(
            'Add subtle animations and transitions for polish',
            'Use modern gradients for CTAs and backgrounds',
            'Implement box-shadows for depth and hierarchy',
            'Use CSS Grid/Flexbox for modern layouts'
        );
    }

    if (designMetrics.mobileResponsive.score < 8) {
        designMetrics.mobileResponsive.suggestions.push(
            'Ensure proper viewport meta tag is set',
            'Use responsive breakpoints for different screen sizes',
            'Test on mobile devices for touch-friendly elements',
            'Ensure tap targets are at least 44x44px'
        );
    }

    if (designMetrics.spacing.score < 10) {
        designMetrics.spacing.suggestions.push(
            'Use consistent spacing scale (8px, 16px, 24px, etc.)',
            'Add adequate whitespace around elements',
            'Use gap property for consistent grid spacing',
            'Ensure proper padding in cards and containers'
        );
    }

    // Create the design rating issue
    issues.push({
        severity: designScore >= 70 ? 'pass' : designScore >= 40 ? 'warning' : 'critical',
        title: 'Design Quality Assessment',
        description: `Your website's design scored ${designScore}/100. ${designScore >= 70 ? 'Great visual design!' : designScore >= 40 ? 'Design needs some improvements.' : 'Significant design improvements needed.'}`,
        designScore,
        metrics: designMetrics,
        location: pages[0]?.url,
        whyItMatters: 'Professional design builds trust with customers and increases conversion rates. Google also considers user experience signals, which are influenced by design quality.',
        howToFix: [
            'Audit your color palette for consistency',
            'Upgrade to modern web fonts',
            'Add subtle animations and micro-interactions',
            'Ensure mobile-first responsive design',
            'Use high-quality, optimized images'
        ],
        suggestions: Object.values(designMetrics).flatMap(m => m.suggestions)
    });

    return {
        name: 'Design Quality',
        description: 'Evaluates visual design, typography, color consistency, and modern design practices',
        score: designScore,
        issues
    };
}
