/**
 * Trust & Credibility Checker
 * Analyzes trust signals, social proof, and credibility elements
 * Critical for business owner conversions
 */

// Helper to create a trust suggestion
function createTrustSuggestion(title, description, location, impact, fix, codeExample = null) {
    const impactMessages = {
        critical: 'Missing this can reduce conversions by 20-40%',
        high: 'This element significantly builds customer confidence',
        medium: 'Improves perceived trustworthiness of the brand',
        low: 'Nice-to-have trust signal'
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
        whyItMatters: `Trust signals directly impact purchase decisions. ${impactMessages[impact]}`
    };
}

export function checkTrustSignals(crawlResults) {
    const issues = [];
    let score = 20; // Max 20 points for trust signals

    const allHtml = crawlResults.pages.map(p => p.html || '').join(' ');
    const allHtmlLower = allHtml.toLowerCase();
    const homePage = crawlResults.pages.find(p =>
        p.url === crawlResults.baseUrl ||
        p.url === crawlResults.baseUrl + '/' ||
        p.url.endsWith('.com') ||
        p.url.endsWith('.com/')
    ) || crawlResults.pages[0];
    const homeHtml = (homePage?.html || '').toLowerCase();

    // ============================================
    // 1. Customer Reviews/Testimonials (5 pts)
    // ============================================
    const reviewPatterns = [
        /testimonial/i,
        /customer\s*review/i,
        /what\s*(people|customers|clients)\s*say/i,
        /★|⭐|star-rating|rating/i,
        /review-widget|reviews-section/i,
        /judge\.me|yotpo|loox|stamped|trustpilot|reviews\.io/i,
        /"review"|"testimonial"/i,
        /verified\s*buyer|verified\s*purchase/i
    ];

    const hasReviews = reviewPatterns.some(p => p.test(allHtml));
    const reviewWidgets = ['judge.me', 'yotpo', 'loox', 'stamped.io', 'trustpilot', 'reviews.io', 'okendo'];
    const hasReviewWidget = reviewWidgets.some(w => allHtmlLower.includes(w));

    if (!hasReviews && !hasReviewWidget) {
        score -= 5;
        issues.push(createTrustSuggestion(
            'No Customer Reviews Found',
            'No testimonials or reviews section detected on your website.',
            '/',
            'critical',
            [
                'Add a reviews section to your homepage',
                'Install a review app (Judge.me, Yotpo, Loox)',
                'Display star ratings on product pages',
                'Add customer testimonials with photos'
            ],
            `<section class="testimonials">
  <h2>What Our Customers Say</h2>
  <div class="testimonial">
    <img src="customer-photo.jpg" alt="John D.">
    <p>"Amazing product! Exceeded my expectations."</p>
    <div class="rating">★★★★★</div>
    <span class="customer-name">John D. - Verified Buyer</span>
  </div>
</section>`
        ));
    } else if (!hasReviewWidget) {
        score -= 2;
        issues.push(createTrustSuggestion(
            'No Dedicated Review Widget',
            'Consider using a professional review platform for verified reviews.',
            '/',
            'medium',
            ['Install Judge.me, Yotpo, or Loox for verified reviews'],
            null
        ));
    } else {
        issues.push({ title: 'Customer Reviews Present', severity: 'pass', description: 'Review system detected' });
    }

    // ============================================
    // 2. Trust Badges (4 pts)
    // ============================================
    const trustBadgePatterns = [
        /secure\s*checkout|ssl|https/i,
        /money[\s-]*back\s*guarantee/i,
        /free\s*shipping|free\s*returns/i,
        /satisfaction\s*guarantee/i,
        /100%\s*secure/i,
        /trust-badge|badge-/i,
        /mcafee|norton|verisign/i,
        /payment-icons|payment-methods/i
    ];

    const foundBadges = trustBadgePatterns.filter(p => p.test(allHtml)).length;

    if (foundBadges === 0) {
        score -= 4;
        issues.push(createTrustSuggestion(
            'No Trust Badges Found',
            'No security or guarantee badges detected. These build instant credibility.',
            '/',
            'high',
            [
                'Add SSL/Secure Checkout badge',
                'Add Money-Back Guarantee badge',
                'Display payment method logos (Visa, Mastercard, PayPal)',
                'Add "Free Shipping" or "Free Returns" badges'
            ],
            `<div class="trust-badges">
  <div class="badge">🔒 Secure Checkout</div>
  <div class="badge">✓ 30-Day Money Back</div>
  <div class="badge">🚚 Free Shipping</div>
  <img src="payment-icons.png" alt="We accept Visa, Mastercard, PayPal">
</div>`
        ));
    } else if (foundBadges < 3) {
        score -= 2;
        issues.push(createTrustSuggestion(
            'Limited Trust Badges',
            `Only ${foundBadges} trust indicators found. More badges increase confidence.`,
            '/',
            'medium',
            ['Add at least 3-4 different trust badges'],
            null
        ));
    } else {
        issues.push({ title: 'Trust Badges Present', severity: 'pass', description: `${foundBadges} trust indicators found` });
    }

    // ============================================
    // 3. Payment Provider Logos (3 pts)
    // ============================================
    const paymentLogos = [
        /visa|mastercard|amex|american\s*express/i,
        /paypal|apple\s*pay|google\s*pay/i,
        /klarna|afterpay|affirm/i,
        /stripe|shop\s*pay/i,
        /payment-icons|payment-methods|accepted-cards/i
    ];

    const hasPaymentLogos = paymentLogos.some(p => p.test(allHtml));

    if (!hasPaymentLogos) {
        score -= 3;
        issues.push(createTrustSuggestion(
            'Payment Logos Missing',
            'No payment provider logos found. Customers look for familiar payment options.',
            '/cart',
            'high',
            [
                'Add Visa, Mastercard, PayPal logos to footer',
                'Display accepted payment methods on cart page',
                'Show Apple Pay / Google Pay if available'
            ],
            `<div class="payment-methods">
  <span>We Accept:</span>
  <img src="visa.svg" alt="Visa">
  <img src="mastercard.svg" alt="Mastercard">
  <img src="paypal.svg" alt="PayPal">
  <img src="applepay.svg" alt="Apple Pay">
</div>`
        ));
    } else {
        issues.push({ title: 'Payment Logos Present', severity: 'pass', description: 'Payment method icons detected' });
    }

    // ============================================
    // 4. Social Proof Numbers (3 pts)
    // ============================================
    const socialProofPatterns = [
        /\d+[,\.]?\d*\s*(happy\s*)?(customers|clients|orders|sold)/i,
        /over\s*\d+/i,
        /join\s*\d+/i,
        /trusted\s*by\s*\d+/i,
        /\d+\s*reviews/i,
        /\d+\s*5-star/i,
        /as\s*seen\s*(on|in)/i,
        /featured\s*(on|in)/i
    ];

    const hasSocialProof = socialProofPatterns.some(p => p.test(allHtml));

    if (!hasSocialProof) {
        score -= 3;
        issues.push(createTrustSuggestion(
            'No Social Proof Numbers',
            'No customer counts or "as seen on" mentions found.',
            '/',
            'medium',
            [
                'Add "Trusted by X customers" on homepage',
                'Display total reviews count',
                'Add "As Seen On" media logos if applicable',
                'Show "X orders shipped" counter'
            ],
            `<div class="social-proof">
  <span class="proof-item">🎉 Over 50,000 Happy Customers</span>
  <span class="proof-item">⭐ 4.9/5 from 2,500+ Reviews</span>
</div>`
        ));
    } else {
        issues.push({ title: 'Social Proof Present', severity: 'pass', description: 'Social proof numbers detected' });
    }

    // ============================================
    // 5. About Us with Team/Story (3 pts)
    // ============================================
    const aboutPagePatterns = [
        /about-us|about\/|our-story|who-we-are/i
    ];
    const hasAboutPage = crawlResults.pages.some(p => aboutPagePatterns.some(pat => pat.test(p.url)));

    const aboutContentPatterns = [
        /our\s*story|our\s*mission|founded|established/i,
        /team|founder|ceo|owner/i,
        /years?\s*of\s*experience/i,
        /family[\s-]owned|small\s*business/i
    ];
    const hasAboutContent = hasAboutPage || aboutContentPatterns.some(p => p.test(allHtml));

    if (!hasAboutContent) {
        score -= 3;
        issues.push(createTrustSuggestion(
            'About Us Content Missing',
            'No compelling brand story or team information found.',
            '/about',
            'medium',
            [
                'Create an About Us page with your brand story',
                'Add founder/team photos',
                'Share your mission and values',
                'Mention years in business or experience'
            ],
            null
        ));
    } else if (!hasAboutPage) {
        score -= 1;
        issues.push(createTrustSuggestion(
            'About Page Not Found',
            'No dedicated About Us page detected in navigation.',
            '/',
            'low',
            ['Add an About Us page to your main navigation'],
            null
        ));
    } else {
        issues.push({ title: 'About Us Page Present', severity: 'pass', description: 'Brand story page found' });
    }

    // ============================================
    // 6. Contact Information Visibility (2 pts)
    // ============================================
    const contactPatterns = [
        /contact@|support@|help@|info@/i,
        /\(\d{3}\)\s*\d{3}[\s-]\d{4}/,  // US phone
        /\+\d{1,3}\s*\d/,  // International phone
        /live\s*chat|chat\s*with\s*us/i,
        /contact-us|get-in-touch/i
    ];

    const hasContactInfo = contactPatterns.filter(p => p.test(allHtml)).length;

    if (hasContactInfo === 0) {
        score -= 2;
        issues.push(createTrustSuggestion(
            'Contact Info Not Visible',
            'No phone, email, or chat options prominently displayed.',
            '/',
            'high',
            [
                'Add phone number to header or footer',
                'Display email address clearly',
                'Add live chat widget',
                'Include contact form link in footer'
            ],
            `<div class="contact-info">
  <a href="tel:+1234567890">📞 (123) 456-7890</a>
  <a href="mailto:support@brand.com">✉️ support@brand.com</a>
  <button onclick="openChat()">💬 Live Chat</button>
</div>`
        ));
    } else {
        issues.push({ title: 'Contact Info Visible', severity: 'pass', description: 'Contact options found' });
    }

    return {
        name: 'Trust & Credibility',
        maxPoints: 20,
        score: Math.max(0, score),
        issues,
        subcategories: [
            { name: 'Reviews/Testimonials', maxPoints: 5 },
            { name: 'Trust Badges', maxPoints: 4 },
            { name: 'Payment Logos', maxPoints: 3 },
            { name: 'Social Proof', maxPoints: 3 },
            { name: 'About/Story', maxPoints: 3 },
            { name: 'Contact Visibility', maxPoints: 2 }
        ]
    };
}
