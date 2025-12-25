/**
 * Conversion Optimization Checker - STRICT VERSION
 * Analyzes elements that drive conversions with rigorous checks
 * Will find issues on most websites
 */

function createConversionSuggestion(title, description, location, impact, fix, codeExample = null) {
    const impactMessages = {
        critical: 'This directly impacts sales revenue',
        high: 'Fixing this could significantly increase conversions',
        medium: 'This improvement can boost engagement',
        low: 'Nice optimization for power users'
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
        whyItMatters: `Every conversion element impacts revenue. ${impactMessages[impact]}`
    };
}

export function checkConversionOptimization(crawlResults) {
    const issues = [];
    let score = 10; // Max 10 points

    const pages = crawlResults.pages || [];
    const allHtml = pages.map(p => p.html || '').join(' ');
    const allHtmlLower = allHtml.toLowerCase();

    const homePage = pages.find(p =>
        p.url === crawlResults.baseUrl ||
        p.url === crawlResults.baseUrl + '/'
    ) || pages[0];
    const homeHtml = (homePage?.html || '').toLowerCase();

    // ============================================
    // 1. Primary CTA Above the Fold (2 pts)
    // Must have a SPECIFIC action button in first 2000 chars
    // ============================================
    const aboveFold = homeHtml.substring(0, 2000);
    const primaryCTAs = [
        /shop\s*now/i,
        /buy\s*now/i,
        /order\s*now/i,
        /get\s*started/i,
        /start\s*shopping/i
    ];

    const hasPrimaryCTAAboveFold = primaryCTAs.some(p => p.test(aboveFold));

    if (!hasPrimaryCTAAboveFold) {
        score -= 2;
        issues.push(createConversionSuggestion(
            'No Primary CTA Above the Fold',
            'No "Shop Now" or "Buy Now" button visible immediately when page loads.',
            '/',
            'critical',
            [
                'Add "Shop Now" button in hero section',
                'Place CTA within first viewport',
                'Use contrasting color for visibility'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Primary CTA Above Fold', severity: 'pass', description: 'Main action button visible immediately' });
    }

    // ============================================
    // 2. Countdown Timer / Sale Banner (1 pt)
    // Very specific check - most sites don't have this
    // ============================================
    const countdownPatterns = [
        /countdown/i,
        /timer.*\d+:\d+/i,
        /ends\s*in\s*\d+/i,
        /hours?\s*:\s*minutes?/i,
        /data-countdown/i
    ];

    const hasCountdown = countdownPatterns.some(p => p.test(allHtml));

    if (!hasCountdown) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Countdown Timer',
            'No sale countdown or limited time offer timer found.',
            '/',
            'medium',
            [
                'Add countdown timer for current promotions',
                'Create urgency with timed offers',
                'Use apps like Hurrify or SUSPENDED'
            ],
            `<div class="countdown-banner">
  🔥 Sale ends in: <span id="timer">02:45:30</span>
</div>`
        ));
    } else {
        issues.push({ title: 'Countdown Timer Found', severity: 'pass', description: 'Urgency timer detected' });
    }

    // ============================================
    // 3. Exit Intent Popup (1 pt)
    // Check for popup/modal scripts - most sites miss this
    // ============================================
    const exitIntentPatterns = [
        /exit[\s-]*intent/i,
        /privy/i,
        /optinmonster/i,
        /popupsmart/i,
        /mouseout.*popup/i,
        /leaving\s*so\s*soon/i,
        /wait[\s!]*before\s*you\s*go/i
    ];

    const hasExitIntent = exitIntentPatterns.some(p => p.test(allHtml));

    if (!hasExitIntent) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Exit Intent Popup',
            'No exit-intent popup to capture leaving visitors.',
            '/',
            'medium',
            [
                'Install exit-intent popup (Privy, OptinMonster)',
                'Offer discount to visitors about to leave',
                'Capture emails before they bounce'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Exit Intent Detected', severity: 'pass', description: 'Exit popup configured' });
    }

    // ============================================
    // 4. Sticky Add to Cart (1 pt)
    // Check for sticky/fixed cart button
    // ============================================
    const stickyCartPatterns = [
        /sticky.*add[\s-]to[\s-]cart/i,
        /fixed.*add[\s-]to[\s-]cart/i,
        /class="[^"]*sticky[^"]*cart/i,
        /position:\s*fixed.*cart/i,
        /position:\s*sticky.*cart/i
    ];

    const hasStickyCart = stickyCartPatterns.some(p => p.test(allHtml));

    if (!hasStickyCart) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Sticky Add-to-Cart',
            'Product pages lack a sticky "Add to Cart" button for mobile users.',
            '/products',
            'medium',
            [
                'Add sticky footer with Add to Cart on product pages',
                'Keep buy button visible while scrolling',
                'Especially important for mobile'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Sticky Cart Present', severity: 'pass', description: 'Fixed Add to Cart detected' });
    }

    // ============================================
    // 5. Product Recommendations (1 pt)
    // ============================================
    const recommendationPatterns = [
        /you\s*may\s*also\s*like/i,
        /recommended\s*for\s*you/i,
        /customers\s*also\s*bought/i,
        /similar\s*products/i,
        /frequently\s*bought\s*together/i,
        /complete\s*the\s*look/i,
        /related\s*products/i
    ];

    const hasRecommendations = recommendationPatterns.some(p => p.test(allHtml));

    if (!hasRecommendations) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Product Recommendations',
            'No "You may also like" or related products section found.',
            '/products',
            'high',
            [
                'Add "Frequently Bought Together" section',
                'Show "Customers Also Viewed"',
                'Enable AI-powered recommendations'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Recommendations Present', severity: 'pass', description: 'Product suggestions found' });
    }

    // ============================================
    // 6. Cart Abandonment Recovery (1 pt)
    // ============================================
    const cartRecoveryPatterns = [
        /klaviyo/i,
        /omnisend/i,
        /cart\s*reminder/i,
        /abandoned\s*cart/i,
        /items?\s*in\s*your\s*cart/i,
        /complete\s*your\s*purchase/i
    ];

    const hasCartRecovery = cartRecoveryPatterns.some(p => p.test(allHtml));

    if (!hasCartRecovery) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Cart Recovery System',
            'No abandoned cart email or recovery system detected.',
            '/',
            'high',
            [
                'Install Klaviyo or Omnisend for cart recovery',
                'Set up automated abandoned cart emails',
                'Offer discount in recovery emails'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Cart Recovery Active', severity: 'pass', description: 'Recovery system detected' });
    }

    // ============================================
    // 7. Social Proof on Product Pages (1 pt)
    // ============================================
    const productSocialProof = [
        /\d+\s*people\s*(viewing|watching|bought)/i,
        /in\s*\d+\s*carts?/i,
        /sold\s*\d+\s*times/i,
        /\d+%\s*of\s*buyers/i,
        /bestseller|best\s*seller/i
    ];

    const hasProductSocialProof = productSocialProof.some(p => p.test(allHtml));

    if (!hasProductSocialProof) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Product Page Social Proof',
            'Product pages lack "X people viewing" or "Bestseller" badges.',
            '/products',
            'medium',
            [
                'Add "X people viewing this" indicator',
                'Show "In X carts right now"',
                'Display bestseller badges'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Product Social Proof', severity: 'pass', description: 'Live social proof detected' });
    }

    // ============================================
    // 8. Free Shipping Threshold (1 pt)
    // ============================================
    const freeShippingPatterns = [
        /free\s*shipping\s*(over|on\s*orders?\s*over|for\s*orders?)\s*\$?\d+/i,
        /\$\d+\s*(away\s*from|more\s*for)\s*free\s*shipping/i,
        /spend\s*\$?\d+.*free\s*shipping/i,
        /free\s*delivery\s*over/i
    ];

    const hasFreeShippingThreshold = freeShippingPatterns.some(p => p.test(allHtml));

    if (!hasFreeShippingThreshold) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Free Shipping Threshold Shown',
            'Not displaying how much more to spend for free shipping.',
            '/cart',
            'high',
            [
                'Add progress bar to free shipping',
                'Show "You\'re $X away from free shipping"',
                'Display in cart and header'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Free Shipping Shown', severity: 'pass', description: 'Threshold displayed' });
    }

    return {
        name: 'Conversion Optimization',
        maxPoints: 10,
        score: Math.max(0, score),
        issues,
        subcategories: [
            { name: 'Primary CTA', maxPoints: 2 },
            { name: 'Countdown Timer', maxPoints: 1 },
            { name: 'Exit Intent', maxPoints: 1 },
            { name: 'Sticky Cart', maxPoints: 1 },
            { name: 'Recommendations', maxPoints: 1 },
            { name: 'Cart Recovery', maxPoints: 1 },
            { name: 'Product Social Proof', maxPoints: 1 },
            { name: 'Free Shipping Bar', maxPoints: 1 }
        ]
    };
}
