/**
 * Copywriting Quality Checker
 * Analyzes website copy, headlines, CTAs, and product descriptions
 */

export function checkCopywritingQuality(crawlResults) {
    const issues = [];
    const pages = crawlResults.pages || [];

    const copyMetrics = {
        headlines: { score: 0, max: 25, suggestions: [], details: [] },
        ctaQuality: { score: 0, max: 25, suggestions: [], details: [] },
        productDescriptions: { score: 0, max: 25, suggestions: [], details: [] },
        trustElements: { score: 0, max: 15, suggestions: [], details: [] },
        readability: { score: 0, max: 10, suggestions: [], details: [] }
    };

    // Power words that increase conversions
    const powerWords = [
        'free', 'new', 'guaranteed', 'proven', 'exclusive', 'limited',
        'premium', 'instant', 'easy', 'save', 'best', 'top', 'amazing',
        'discover', 'unlock', 'transform', 'boost', 'ultimate', 'secret'
    ];

    const ctaWords = [
        'buy now', 'add to cart', 'shop now', 'get started', 'order now',
        'subscribe', 'sign up', 'try free', 'learn more', 'get yours',
        'claim', 'grab', 'start', 'join', 'download'
    ];

    const trustWords = [
        'guarantee', 'warranty', 'secure', 'verified', 'certified',
        'authentic', 'official', 'trusted', 'safe', 'protected',
        'money back', 'refund', 'satisfaction', 'quality', 'tested'
    ];

    const urgencyWords = [
        'limited', 'today only', 'ends soon', 'last chance', 'hurry',
        'only', 'left', 'selling fast', 'don\'t miss', 'now'
    ];

    pages.forEach(page => {
        const html = page.html || '';
        const url = page.url || '';
        const lowerHtml = html.toLowerCase();
        const textContent = html.replace(/<[^>]*>/g, ' ').toLowerCase();

        // Extract headings
        const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
        const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];

        // Headline Analysis
        if (h1Matches.length > 0) {
            copyMetrics.headlines.score += 10;
            h1Matches.forEach(h1 => {
                const headlineText = h1.replace(/<[^>]*>/g, '').trim();
                if (headlineText.length > 10 && headlineText.length < 80) {
                    copyMetrics.headlines.score += 5;
                }
                const hasPowerWord = powerWords.some(pw => headlineText.toLowerCase().includes(pw));
                if (hasPowerWord) {
                    copyMetrics.headlines.score += 5;
                }
                copyMetrics.headlines.details.push({
                    url,
                    headline: headlineText,
                    hasPowerWord
                });
            });
        }

        // CTA Analysis
        const buttonMatches = html.match(/<button[^>]*>(.*?)<\/button>/gi) || [];
        const linkMatches = html.match(/<a[^>]*class[^>]*(btn|button|cta)[^>]*>(.*?)<\/a>/gi) || [];
        const allCTAs = [...buttonMatches, ...linkMatches];

        if (allCTAs.length > 0) {
            copyMetrics.ctaQuality.score += 10;
            allCTAs.forEach(cta => {
                const ctaText = cta.replace(/<[^>]*>/g, '').trim().toLowerCase();
                const hasCtaWord = ctaWords.some(cw => ctaText.includes(cw));
                const hasUrgency = urgencyWords.some(uw => ctaText.includes(uw));

                if (hasCtaWord) copyMetrics.ctaQuality.score += 3;
                if (hasUrgency) copyMetrics.ctaQuality.score += 2;
            });
        }

        // Product Description Analysis
        const isProductPage = url.includes('/product') || url.includes('/p/') ||
            lowerHtml.includes('add to cart') || lowerHtml.includes('add-to-cart');

        if (isProductPage) {
            // Check for detailed descriptions
            const descriptionPatterns = [
                /description/i, /details/i, /about this/i, /features/i,
                /specifications/i, /overview/i
            ];
            const hasDetailedDesc = descriptionPatterns.some(p => p.test(html));

            if (hasDetailedDesc) {
                copyMetrics.productDescriptions.score += 10;
            }

            // Check for benefit-focused copy
            const benefitWords = ['you', 'your', 'enjoy', 'experience', 'love', 'perfect for'];
            const hasBenefitCopy = benefitWords.some(bw => textContent.includes(bw));
            if (hasBenefitCopy) {
                copyMetrics.productDescriptions.score += 8;
            }

            // Check for feature lists
            const hasFeatureList = lowerHtml.includes('<ul') && lowerHtml.includes('<li');
            if (hasFeatureList) {
                copyMetrics.productDescriptions.score += 7;
            }
        }

        // Trust Elements
        const hasTrustWord = trustWords.some(tw => textContent.includes(tw));
        if (hasTrustWord) {
            copyMetrics.trustElements.score += 5;
        }

        const hasReviews = lowerHtml.includes('review') || lowerHtml.includes('testimonial') || lowerHtml.includes('rating');
        if (hasReviews) {
            copyMetrics.trustElements.score += 5;
        }

        const hasBadges = lowerHtml.includes('badge') || lowerHtml.includes('certified') || lowerHtml.includes('ssl') || lowerHtml.includes('secure');
        if (hasBadges) {
            copyMetrics.trustElements.score += 5;
        }

        // Readability
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / (sentences.length || 1);

        if (avgSentenceLength < 20) {
            copyMetrics.readability.score += 5;
        }

        // Check for short paragraphs
        const paragraphs = html.match(/<p[^>]*>.*?<\/p>/gi) || [];
        if (paragraphs.length > 0) {
            copyMetrics.readability.score += 5;
        }
    });

    // Normalize scores
    Object.keys(copyMetrics).forEach(key => {
        copyMetrics[key].score = Math.min(copyMetrics[key].score, copyMetrics[key].max);
    });

    // Calculate total copy score
    const maxTotal = Object.values(copyMetrics).reduce((sum, m) => sum + m.max, 0);
    const actualTotal = Object.values(copyMetrics).reduce((sum, m) => sum + m.score, 0);
    const copyScore = Math.round((actualTotal / maxTotal) * 100);

    // Generate suggestions
    if (copyMetrics.headlines.score < 20) {
        copyMetrics.headlines.suggestions.push(
            'Write compelling H1 headlines that grab attention immediately',
            'Use power words like "New," "Free," "Exclusive," "Limited"',
            'Keep headlines between 40-70 characters for optimal impact',
            'Include your unique value proposition in the main headline',
            'A/B test different headline variations'
        );
    }

    if (copyMetrics.ctaQuality.score < 20) {
        copyMetrics.ctaQuality.suggestions.push(
            'Use action-oriented CTA buttons (e.g., "Get Yours Now" instead of "Submit")',
            'Add urgency to CTAs ("Order Today - Limited Stock")',
            'Make CTAs visually prominent with contrasting colors',
            'Use first-person phrasing ("Start My Free Trial")',
            'Place CTAs above the fold and repeat throughout the page'
        );
    }

    if (copyMetrics.productDescriptions.score < 20) {
        copyMetrics.productDescriptions.suggestions.push(
            'Write benefit-focused descriptions (what customers gain, not just features)',
            'Use bullet points for easy scanning',
            'Include size, dimensions, materials, and care instructions',
            'Add a compelling product story or brand narrative',
            'Use sensory language that helps customers imagine using the product'
        );
    }

    if (copyMetrics.trustElements.score < 10) {
        copyMetrics.trustElements.suggestions.push(
            'Add customer reviews and testimonials prominently',
            'Display trust badges (SSL, secure payment, guarantees)',
            'Include money-back guarantee messaging',
            'Show social proof (customer count, ratings)',
            'Display certifications and awards'
        );
    }

    if (copyMetrics.readability.score < 8) {
        copyMetrics.readability.suggestions.push(
            'Keep sentences short (under 20 words)',
            'Use short paragraphs (2-3 sentences max)',
            'Add subheadings to break up long content',
            'Use simple, conversational language',
            'Include white space for visual breathing room'
        );
    }

    issues.push({
        severity: copyScore >= 70 ? 'pass' : copyScore >= 40 ? 'warning' : 'critical',
        title: 'Copywriting Quality Assessment',
        description: `Your website's copywriting scored ${copyScore}/100. ${copyScore >= 70 ? 'Strong persuasive copy!' : copyScore >= 40 ? 'Copy needs optimization.' : 'Major copywriting improvements needed.'}`,
        copyScore,
        metrics: copyMetrics,
        location: pages[0]?.url,
        whyItMatters: 'Compelling copy directly impacts conversion rates. Well-written headlines, CTAs, and product descriptions can significantly increase sales and reduce bounce rates.',
        howToFix: [
            'Audit all headlines for power words and clarity',
            'Rewrite CTAs to be action-oriented with urgency',
            'Add detailed, benefit-focused product descriptions',
            'Include trust signals throughout the buying journey',
            'Simplify language for better readability'
        ],
        suggestions: Object.values(copyMetrics).flatMap(m => m.suggestions)
    });

    return {
        name: 'Copywriting Quality',
        description: 'Evaluates headlines, CTAs, product descriptions, and persuasive elements',
        score: copyScore,
        issues
    };
}
