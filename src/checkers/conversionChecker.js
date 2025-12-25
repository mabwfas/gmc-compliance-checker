/**
 * Conversion Optimization Checker
 * Analyzes elements that drive conversions (CTAs, urgency, email capture)
 * Helps business owners convert more visitors into customers
 */

// Helper to create a conversion suggestion
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
    let score = 10; // Max 10 points for conversion optimization

    const pages = crawlResults.pages || [];
    const allHtml = pages.map(p => p.html || '').join(' ');
    const allHtmlLower = allHtml.toLowerCase();

    const homePage = pages.find(p =>
        p.url === crawlResults.baseUrl ||
        p.url === crawlResults.baseUrl + '/'
    ) || pages[0];
    const homeHtml = (homePage?.html || '').toLowerCase();

    // ============================================
    // 1. Clear CTA Buttons (3 pts)
    // ============================================
    const ctaPatterns = [
        /add[\s-]to[\s-]cart/i,
        /buy[\s-]now/i,
        /shop[\s-]now/i,
        /order[\s-]now/i,
        /get[\s-]started/i,
        /learn[\s-]more/i,
        /sign[\s-]up/i,
        /subscribe/i,
        /class="[^"]*cta[^"]*"/i,
        /class="[^"]*button[^"]*primary/i
    ];

    const ctaCount = ctaPatterns.filter(p => p.test(homeHtml)).length;

    if (ctaCount === 0) {
        score -= 3;
        issues.push(createConversionSuggestion(
            'No Clear CTA on Homepage',
            'No "Buy Now", "Shop Now", or "Add to Cart" buttons found on homepage.',
            '/',
            'critical',
            [
                'Add a prominent "Shop Now" button above the fold',
                'Use action-oriented button text',
                'Make CTA stand out with contrasting color'
            ],
            `<a href="/collections/all" class="cta-button">
  Shop Now
</a>

<style>
.cta-button {
  background: #2563eb;
  color: white;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
}
</style>`
        ));
    } else if (ctaCount < 2) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'Limited CTAs',
            'Only one type of CTA found. Multiple conversion paths improve results.',
            '/',
            'low',
            ['Add secondary CTAs like "Learn More" or "View Collection"'],
            null
        ));
    } else {
        issues.push({ title: 'Strong CTAs Present', severity: 'pass', description: `${ctaCount} CTA types found` });
    }

    // ============================================
    // 2. Above-the-Fold Value Proposition (2 pts)
    // ============================================
    const heroPatterns = [
        /class="[^"]*hero[^"]*"/i,
        /class="[^"]*banner[^"]*"/i,
        /class="[^"]*jumbotron[^"]*"/i,
        /<section[^>]*id="[^"]*hero[^"]*"/i
    ];

    const hasHeroSection = heroPatterns.some(p => p.test(homeHtml));

    // Check for H1 in first 3000 chars (above fold approximation)
    const aboveFoldApprox = homeHtml.substring(0, 3000);
    const hasAboveFoldH1 = /<h1/i.test(aboveFoldApprox);

    if (!hasHeroSection && !hasAboveFoldH1) {
        score -= 2;
        issues.push(createConversionSuggestion(
            'Weak Above-the-Fold Content',
            'No hero section or headline visible immediately on homepage.',
            '/',
            'high',
            [
                'Add a hero section with compelling headline',
                'Ensure value proposition loads first',
                'Include CTA above the fold'
            ],
            `<section class="hero">
  <h1>Your Compelling Value Proposition</h1>
  <p>Why customers should choose you</p>
  <a href="/shop" class="cta">Shop Now</a>
</section>`
        ));
    } else {
        issues.push({ title: 'Hero Section Present', severity: 'pass', description: 'Above-the-fold content detected' });
    }

    // ============================================
    // 3. Urgency/Scarcity Indicators (2 pts)
    // ============================================
    const urgencyPatterns = [
        /limited\s*(time|stock|edition)/i,
        /only\s*\d+\s*(left|remaining)/i,
        /hurry/i,
        /ends?\s*(soon|today|tomorrow)/i,
        /sale\s*ends/i,
        /countdown|timer/i,
        /last\s*chance/i,
        /selling\s*fast/i,
        /flash\s*sale/i,
        /(free\s*shipping|get\s*free)/i
    ];

    const hasUrgency = urgencyPatterns.some(p => p.test(allHtmlLower));

    if (!hasUrgency) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Urgency Elements',
            'No scarcity or urgency messaging found. These motivate faster decisions.',
            '/',
            'low',
            [
                'Add "Limited Stock" indicators',
                'Show sale countdown timers',
                'Highlight "Free Shipping" offers',
                'Use "Selling Fast" badges'
            ],
            `<div class="urgency-banner">
  🔥 Flash Sale! Ends in <span class="countdown">02:15:30</span>
</div>

<div class="stock-indicator">
  ⚡ Only 3 left in stock!
</div>`
        ));
    } else {
        issues.push({ title: 'Urgency Elements Present', severity: 'pass', description: 'Scarcity/urgency messaging found' });
    }

    // ============================================
    // 4. Email Capture (2 pts)
    // ============================================
    const emailPatterns = [
        /type=["']email["']/i,
        /newsletter/i,
        /subscribe/i,
        /join\s*(our)?\s*(list|mailing|newsletter)/i,
        /get\s*\d+%\s*off/i,
        /signup|sign-up/i,
        /klaviyo|mailchimp|omnisend|privy/i,
        /popup|pop-up/i
    ];

    const hasEmailCapture = emailPatterns.filter(p => p.test(allHtml)).length >= 2;

    if (!hasEmailCapture) {
        score -= 2;
        issues.push(createConversionSuggestion(
            'No Email Capture Found',
            'No newsletter signup or email capture form detected.',
            '/',
            'high',
            [
                'Add newsletter signup to footer',
                'Install popup for first-time visitors',
                'Offer discount for email signup',
                'Use Klaviyo, Mailchimp, or Privy'
            ],
            `<div class="newsletter-signup">
  <h3>Get 15% Off Your First Order</h3>
  <form action="/subscribe" method="POST">
    <input type="email" placeholder="Enter your email" required>
    <button type="submit">Subscribe</button>
  </form>
</div>`
        ));
    } else {
        issues.push({ title: 'Email Capture Present', severity: 'pass', description: 'Email signup form found' });
    }

    // ============================================
    // 5. Product Quick View/Add (1 pt)
    // ============================================
    const quickViewPatterns = [
        /quick[\s-]view/i,
        /quick[\s-]add/i,
        /quick[\s-]shop/i,
        /add[\s-]to[\s-]cart.*collection/i
    ];

    const hasQuickView = quickViewPatterns.some(p => p.test(allHtml));

    if (!hasQuickView) {
        score -= 1;
        issues.push(createConversionSuggestion(
            'No Quick Add Feature',
            'No quick view or quick add functionality on product collections.',
            '/collections',
            'low',
            [
                'Add "Quick View" on product cards',
                'Enable "Add to Cart" from collection pages',
                'Reduce clicks needed to purchase'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Quick Add Available', severity: 'pass', description: 'Quick view/add detected' });
    }

    return {
        name: 'Conversion Optimization',
        maxPoints: 10,
        score: Math.max(0, score),
        issues,
        subcategories: [
            { name: 'Clear CTAs', maxPoints: 3 },
            { name: 'Above-Fold Hero', maxPoints: 2 },
            { name: 'Urgency Elements', maxPoints: 2 },
            { name: 'Email Capture', maxPoints: 2 },
            { name: 'Quick Add', maxPoints: 1 }
        ]
    };
}
