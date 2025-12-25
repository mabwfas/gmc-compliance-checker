/**
 * Mobile Experience Checker
 * Analyzes mobile responsiveness and usability
 * Critical since 60%+ of e-commerce traffic is mobile
 */

// Helper to create a mobile suggestion
function createMobileSuggestion(title, description, location, impact, fix, codeExample = null) {
    const impactMessages = {
        critical: 'Breaks mobile experience, losing 60%+ of visitors',
        high: 'Significantly impacts mobile usability',
        medium: 'Improves mobile user experience',
        low: 'Nice enhancement for mobile users'
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
        whyItMatters: `Mobile is 60%+ of e-commerce traffic. ${impactMessages[impact]}`
    };
}

export function checkMobileExperience(crawlResults) {
    const issues = [];
    let score = 10; // Max 10 points for mobile experience

    const pages = crawlResults.pages || [];
    const allHtml = pages.map(p => p.html || '').join(' ');

    // ============================================
    // 1. Viewport Meta Tag (3 pts)
    // ============================================
    const viewportPattern = /<meta[^>]*name=["']viewport["'][^>]*>/i;
    const hasViewport = viewportPattern.test(allHtml);

    const properViewport = /width=device-width/i.test(allHtml);

    if (!hasViewport) {
        score -= 3;
        issues.push(createMobileSuggestion(
            'Missing Viewport Meta Tag',
            'No viewport meta tag found. Site will not render correctly on mobile.',
            '/',
            'critical',
            [
                'Add viewport meta tag to HTML head',
                'Set width=device-width, initial-scale=1',
                'Ensure all pages have this tag'
            ],
            `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
        ));
    } else if (!properViewport) {
        score -= 2;
        issues.push(createMobileSuggestion(
            'Improper Viewport Configuration',
            'Viewport tag found but may not be configured correctly.',
            '/',
            'high',
            ['Ensure viewport includes width=device-width'],
            `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
        ));
    } else {
        issues.push({ title: 'Viewport Configured', severity: 'pass', description: 'Mobile viewport tag found' });
    }

    // ============================================
    // 2. Responsive CSS (2 pts)
    // ============================================
    const responsivePatterns = [
        /@media/i,
        /max-width:\s*\d+px/i,
        /min-width:\s*\d+px/i,
        /class="[^"]*mobile[^"]*"/i,
        /class="[^"]*responsive[^"]*"/i,
        /bootstrap|tailwind|foundation/i
    ];

    const responsiveScore = responsivePatterns.filter(p => p.test(allHtml)).length;

    if (responsiveScore === 0) {
        score -= 2;
        issues.push(createMobileSuggestion(
            'No Responsive CSS Detected',
            'No media queries or responsive framework found.',
            '/',
            'high',
            [
                'Add CSS media queries for different screen sizes',
                'Use a responsive CSS framework',
                'Test on multiple device sizes'
            ],
            `/* Mobile-first approach */
@media (min-width: 768px) {
  .container { max-width: 720px; }
}
@media (min-width: 1024px) {
  .container { max-width: 960px; }
}`
        ));
    } else {
        issues.push({ title: 'Responsive CSS Present', severity: 'pass', description: 'Media queries detected' });
    }

    // ============================================
    // 3. Mobile Navigation (2 pts)
    // ============================================
    const mobileNavPatterns = [
        /hamburger|burger-menu/i,
        /mobile[\s-]*menu/i,
        /nav[\s-]*toggle/i,
        /menu[\s-]*toggle/i,
        /≡|☰/,  // Hamburger icons
        /class="[^"]*drawer[^"]*"/i
    ];

    const hasMobileNav = mobileNavPatterns.some(p => p.test(allHtml));

    if (!hasMobileNav) {
        score -= 2;
        issues.push(createMobileSuggestion(
            'No Mobile Navigation',
            'No hamburger menu or mobile navigation pattern detected.',
            '/',
            'high',
            [
                'Add hamburger menu for mobile',
                'Use a slide-out drawer for navigation',
                'Ensure all nav items are accessible on mobile'
            ],
            `<button class="mobile-menu-toggle" aria-label="Menu">
  <span class="hamburger-icon">☰</span>
</button>

<nav class="mobile-drawer">
  <!-- Navigation links -->
</nav>`
        ));
    } else {
        issues.push({ title: 'Mobile Navigation Present', severity: 'pass', description: 'Mobile menu detected' });
    }

    // ============================================
    // 4. Touch-Friendly Elements (2 pts)
    // ============================================
    // Check for minimum touch target sizes
    const smallButtonPatterns = [
        /padding:\s*[0-4]px/i,
        /font-size:\s*[0-9]px/i,  // Very small font
        /height:\s*[0-2][0-9]px/i  // Very small height
    ];

    const hasTinyElements = smallButtonPatterns.filter(p => p.test(allHtml)).length >= 2;

    // Check for touch-friendly patterns
    const touchFriendlyPatterns = [
        /touch-action/i,
        /-webkit-tap/i,
        /cursor:\s*pointer/i,
        /padding:\s*1[0-9]px|padding:\s*[2-9][0-9]px/i  // Decent padding
    ];

    const touchScore = touchFriendlyPatterns.filter(p => p.test(allHtml)).length;

    if (hasTinyElements && touchScore < 2) {
        score -= 2;
        issues.push(createMobileSuggestion(
            'Small Touch Targets',
            'Some elements may be too small for comfortable touch interaction.',
            '/',
            'medium',
            [
                'Ensure buttons are at least 44x44px',
                'Add adequate padding to clickable elements',
                'Space links apart for easier tapping'
            ],
            `.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 20px;
}`
        ));
    } else {
        issues.push({ title: 'Touch-Friendly Design', severity: 'pass', description: 'Adequate touch targets' });
    }

    // ============================================
    // 5. Sticky Mobile CTA (1 pt)
    // ============================================
    const stickyPatterns = [
        /position:\s*sticky/i,
        /position:\s*fixed/i,
        /class="[^"]*sticky[^"]*"/i,
        /class="[^"]*fixed[^"]*"/i,
        /sticky[\s-]*cart|sticky[\s-]*cta|sticky[\s-]*button/i
    ];

    const hasStickyElements = stickyPatterns.some(p => p.test(allHtml));

    if (!hasStickyElements) {
        score -= 1;
        issues.push(createMobileSuggestion(
            'No Sticky Mobile CTA',
            'No sticky/fixed CTA button for mobile users.',
            '/',
            'low',
            [
                'Add sticky "Add to Cart" on product pages',
                'Consider sticky header with cart icon',
                'Add floating action button for key action'
            ],
            `.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}`
        ));
    } else {
        issues.push({ title: 'Sticky Elements Present', severity: 'pass', description: 'Fixed/sticky CTA found' });
    }

    return {
        name: 'Mobile Experience',
        maxPoints: 10,
        score: Math.max(0, score),
        issues,
        subcategories: [
            { name: 'Viewport Meta', maxPoints: 3 },
            { name: 'Responsive CSS', maxPoints: 2 },
            { name: 'Mobile Navigation', maxPoints: 2 },
            { name: 'Touch Targets', maxPoints: 2 },
            { name: 'Sticky CTA', maxPoints: 1 }
        ]
    };
}
