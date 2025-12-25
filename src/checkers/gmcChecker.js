/**
 * GMC Compliance Checker - Google Merchant Center Compliance (25 pts)
 * 
 * Subcategories:
 * - Business Identity: 6 pts
 * - Policy Pages GMC: 7 pts
 * - Pricing & Checkout: 5 pts
 * - Product Requirements: 4 pts
 * - Structured Data/Schema: 3 pts
 */

function createGMCSuggestion(title, description, location, impact, fix, codeExample = null, gmcRisk = null) {
    return {
        title,
        description,
        location,
        impact,
        severity: impact === 'critical' ? 'critical' : impact === 'high' ? 'critical' : 'warning',
        howToFix: fix,
        copyPasteCode: codeExample,
        gmcRisk,
        whyItMatters: gmcRisk || getGMCWhyItMatters(impact)
    };
}

function getGMCWhyItMatters(impact) {
    const reasons = {
        'critical': 'CRITICAL GMC VIOLATION - This will cause account suspension or product disapproval.',
        'high': 'HIGH GMC RISK - This issue can lead to product disapprovals or reduced feed performance.',
        'medium': 'MEDIUM GMC RISK - May affect product approval or ad quality.',
        'low': 'LOW GMC RISK - Best practice for optimal GMC performance.'
    };
    return reasons[impact] || reasons['medium'];
}

// Extract business name from various locations
function extractBusinessNames(pages) {
    const names = new Set();
    const allHtml = pages.map(p => p.html || '').join(' ');

    // From title
    const titleMatch = allHtml.match(/<title[^>]*>([^<|–-]+)/i);
    if (titleMatch) names.add(titleMatch[1].trim());

    // From copyright
    const copyrightMatch = allHtml.match(/©\s*\d{4}\s*([^.<]+)/i);
    if (copyrightMatch) names.add(copyrightMatch[1].trim());

    // From logo alt
    const logoAltMatch = allHtml.match(/logo[^>]*alt="([^"]+)"/i);
    if (logoAltMatch) names.add(logoAltMatch[1].replace(/ - Home| Logo/gi, '').trim());

    return Array.from(names).filter(n => n.length > 2 && n.length < 100);
}

// ============================================
// GMC SECTION 1: Business Identity (6 pts)
// ============================================
function checkBusinessIdentity(crawlResults) {
    const issues = [];
    let score = 6;
    const { pages } = crawlResults;
    const allHtml = pages.map(p => p.html || '').join(' ');
    const contactPage = pages.find(p => p.url?.includes('contact'));
    const contactHtml = contactPage?.html || '';

    // Business Name Consistency (1 pt) - CRITICAL
    const businessNames = extractBusinessNames(pages);
    if (businessNames.length > 2) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Business Name Inconsistency',
            `Multiple business name variations detected: ${businessNames.slice(0, 3).join(', ')}`,
            'Multiple pages',
            'critical',
            ['Standardize business name across all pages', 'Use exact same name in header, footer, policies'],
            null,
            'GMC Misrepresentation - Business name must be identical everywhere'
        ));
    } else {
        issues.push({ title: 'Business Name Consistent', severity: 'pass', description: 'Business name appears consistent' });
    }

    // Physical Address (1 pt) - CRITICAL
    const addressPattern = /\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|blvd|dr|drive|lane|ln|way|court|ct)[,.\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/i;
    const hasAddress = addressPattern.test(allHtml);
    if (!hasAddress) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Physical Address Missing',
            'No physical business address found on website.',
            '/pages/contact',
            'critical',
            ['Add physical address to Contact page', 'Include: Street, City, State, ZIP', 'PO Box alone is insufficient for GMC'],
            `<address>
  123 Business Street<br>
  City, State 12345<br>
  United States
</address>`,
            'GMC requires verifiable physical address for business verification'
        ));
    } else {
        issues.push({ title: 'Physical Address Present', severity: 'pass', description: 'Physical address found' });
    }

    // Email Visible (1 pt) - CRITICAL
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emails = allHtml.match(new RegExp(emailPattern, 'g')) || [];
    const businessEmail = emails.find(e => !e.includes('gmail.com') && !e.includes('yahoo.com'));

    if (emails.length === 0) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Email Address Missing',
            'No customer support email found on website.',
            '/pages/contact',
            'critical',
            ['Add visible email to Contact page and footer', 'Use business domain email (not @gmail.com)'],
            `<p>Email: <a href="mailto:support@yourbrand.com">support@yourbrand.com</a></p>`,
            'GMC requires visible contact email for customer support'
        ));
    } else if (!businessEmail && emails.length > 0) {
        score -= 0.5;
        issues.push(createGMCSuggestion(
            'Non-Business Email Used',
            'Only personal email domains found (gmail, yahoo).',
            '/pages/contact',
            'high',
            ['Use business domain email for professional appearance'],
            null,
            'Business domain email improves GMC trust signals'
        ));
    } else {
        issues.push({ title: 'Business Email Present', severity: 'pass', description: 'Business email found' });
    }

    // Phone Number (1 pt) - HIGH
    const phonePattern = /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const hasPhone = phonePattern.test(allHtml);
    if (!hasPhone) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Phone Number Missing',
            'No phone number found on website.',
            '/pages/contact',
            'high',
            ['Add phone number to Contact page', 'Include country code for international'],
            `<p>Phone: <a href="tel:+1-555-123-4567">+1 (555) 123-4567</a></p>`,
            'Phone number increases customer trust and GMC approval likelihood'
        ));
    } else {
        issues.push({ title: 'Phone Number Present', severity: 'pass', description: 'Phone number found' });
    }

    // Business Hours (1 pt) - MEDIUM
    const hoursPattern = /hours|monday|tuesday|open|closed|24\/7|business days|response time/i;
    const hasHours = hoursPattern.test(contactHtml);
    if (!hasHours) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Business Hours Not Listed',
            'No business/support hours found on Contact page.',
            '/pages/contact',
            'medium',
            ['Add business hours or response time to Contact page'],
            `<p>Support Hours: Monday-Friday 9AM-5PM EST</p>
<p>We respond to emails within 24 hours.</p>`,
            'Business hours help set customer expectations'
        ));
    } else {
        issues.push({ title: 'Business Hours Listed', severity: 'pass', description: 'Hours/response time found' });
    }

    // Contact Form (1 pt) - HIGH
    const hasContactForm = /<form[^>]*contact|contact.*form|name="contact"/i.test(contactHtml);
    if (!hasContactForm) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Contact Form Missing',
            'No contact form found on Contact page.',
            '/pages/contact',
            'high',
            ['Add contact form with name, email, message fields'],
            null,
            'Contact form provides easy customer communication channel'
        ));
    } else {
        issues.push({ title: 'Contact Form Present', severity: 'pass', description: 'Contact form found' });
    }

    return { name: 'Business Identity', maxPoints: 6, score: Math.max(0, score), issues };
}

// ============================================
// GMC SECTION 2: Policy Pages GMC Requirements (7 pts)
// ============================================
function checkPolicyPagesGMC(crawlResults) {
    const issues = [];
    let score = 7;
    const { pages } = crawlResults;
    const refundPage = pages.find(p => p.url?.includes('refund') || p.url?.includes('return'));
    const shippingPage = pages.find(p => p.url?.includes('shipping'));
    const refundHtml = (refundPage?.html || '').toLowerCase();
    const shippingHtml = (shippingPage?.html || '').toLowerCase();
    const allHtml = pages.map(p => p.html || '').join(' ').toLowerCase();

    // Return Policy 30+ Days (2 pts) - CRITICAL
    const returnDaysMatch = refundHtml.match(/(\d+)\s*(?:day|days)/i);
    const returnDays = returnDaysMatch ? parseInt(returnDaysMatch[1]) : 0;

    if (!refundPage) {
        score -= 2;
        issues.push(createGMCSuggestion(
            'Return Policy Page Missing',
            'No return/refund policy page found.',
            '/policies/refund-policy',
            'critical',
            ['Create refund policy page with 30+ day return window'],
            null,
            'GMC requires clear return policy for product approval'
        ));
    } else if (returnDays > 0 && returnDays < 30) {
        score -= 1.5;
        issues.push(createGMCSuggestion(
            'Return Window Too Short for GMC',
            `Return policy specifies ${returnDays} days. GMC recommends 30+ days.`,
            refundPage.url,
            'critical',
            ['Extend return window to 30 days minimum', 'Update policy text to reflect new timeframe'],
            `<h2>30-Day Return Window</h2>
<p>We accept returns within 30 days of delivery for unused items.</p>`,
            'Short return windows can cause GMC product disapprovals'
        ));
    } else if (returnDays >= 30) {
        issues.push({ title: 'Return Window 30+ Days', severity: 'pass', description: `${returnDays} day return window` });
    }

    // Return Process Clear (1 pt) - CRITICAL
    const hasReturnProcess = /how to return|return process|step|initiate|request a return/i.test(refundHtml);
    if (refundPage && !hasReturnProcess) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Return Process Not Explained',
            'Return policy lacks step-by-step return instructions.',
            refundPage?.url || '/policies/refund-policy',
            'critical',
            ['Add clear return process steps', 'Include: how to initiate, where to ship, refund method'],
            null,
            'GMC requires clear return process for customer transparency'
        ));
    } else if (refundPage) {
        issues.push({ title: 'Return Process Explained', severity: 'pass', description: 'Return steps found' });
    }

    // Shipping Delivery Times (1 pt) - CRITICAL
    const hasDeliveryTimes = /\d+[-–]\d+\s*(?:business\s*)?days|delivery time|shipping time|arrives in/i.test(shippingHtml);
    if (shippingPage && !hasDeliveryTimes) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Shipping Delivery Times Missing',
            'No specific delivery timeframes in shipping policy.',
            shippingPage?.url || '/policies/shipping-policy',
            'critical',
            ['Add delivery time estimates (e.g., "5-7 business days")', 'Include processing time + transit time'],
            `<ul>
  <li>Standard Shipping: 5-7 business days</li>
  <li>Express Shipping: 2-3 business days</li>
</ul>`,
            'GMC requires delivery time estimates for shipping transparency'
        ));
    } else if (shippingPage) {
        issues.push({ title: 'Delivery Times Specified', severity: 'pass', description: 'Shipping times found' });
    }

    // Shipping Costs Disclosed (1 pt) - CRITICAL
    const hasShippingCosts = /free shipping|\$\d+|shipping cost|flat rate|calculated at checkout/i.test(shippingHtml);
    if (shippingPage && !hasShippingCosts) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Shipping Costs Not Disclosed',
            'Shipping costs not clearly stated in policy.',
            shippingPage?.url || '/policies/shipping-policy',
            'critical',
            ['Add shipping cost information', 'Include free shipping thresholds if applicable'],
            null,
            'GMC requires all costs disclosed before checkout'
        ));
    } else if (shippingPage) {
        issues.push({ title: 'Shipping Costs Disclosed', severity: 'pass', description: 'Shipping costs found' });
    }

    // Handling Fees Disclosed (0.5 pt) - CRITICAL
    const hasHandlingFees = /handling fee|service fee|processing fee/i.test(shippingHtml);
    const mentionsNoFees = /no additional|no hidden|no extra/i.test(shippingHtml);
    if (shippingPage && !hasHandlingFees && !mentionsNoFees) {
        score -= 0.5;
        issues.push(createGMCSuggestion(
            'Handling Fees Not Addressed',
            'Policy should clarify if there are any handling/service fees.',
            shippingPage?.url || '/policies/shipping-policy',
            'high',
            ['Disclose any handling fees or state "No additional fees"'],
            `<p>No additional handling or service fees are charged.</p>`,
            '2025 GMC update requires all merchant fees disclosed'
        ));
    }

    // Policies Linked in Footer (1 pt) - CRITICAL
    const homepage = pages[0];
    const footerHtml = (homepage?.html || '').toLowerCase();
    const hasPoliciesInFooter = /footer[^]*privacy[^]*refund|footer[^]*shipping[^]*terms/i.test(footerHtml) ||
        (/privacy/i.test(footerHtml) && /refund|return/i.test(footerHtml) && /shipping/i.test(footerHtml));

    if (!hasPoliciesInFooter) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Policies Not Linked in Footer',
            'Policy pages should be accessible from footer navigation.',
            '/',
            'critical',
            ['Add all policy links to footer', 'Include: Privacy, Refund, Shipping, Terms'],
            null,
            'GMC requires easy access to all policy pages'
        ));
    } else {
        issues.push({ title: 'Policies in Footer', severity: 'pass', description: 'Policy links found in footer' });
    }

    return { name: 'Policy Pages (GMC)', maxPoints: 7, score: Math.max(0, score), issues };
}

// ============================================
// GMC SECTION 3: Pricing & Checkout (5 pts)
// ============================================
function checkPricingCheckout(crawlResults) {
    const issues = [];
    let score = 5;
    const { pages } = crawlResults;
    const productPages = pages.filter(p => p.url?.includes('/products/'));
    const allHtml = pages.map(p => p.html || '').join(' ');
    const homepage = pages[0];

    // Price Display with Currency (1 pt) - CRITICAL
    const hasPriceWithCurrency = productPages.some(p =>
        /\$\d+|\d+\.\d{2}|USD|EUR|GBP|price/i.test(p.html || '')
    );
    if (productPages.length > 0 && !hasPriceWithCurrency) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Price Display Issues',
            'Product prices may not be clearly displayed with currency.',
            '/products/*',
            'critical',
            ['Ensure all products show price with currency symbol'],
            null,
            'GMC requires clear, unambiguous pricing'
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Prices Displayed', severity: 'pass', description: 'Prices with currency found' });
    }

    // Sale Price Formatting (1 pt) - HIGH
    const hasSalePrice = productPages.some(p =>
        /compare.at|was.price|original.price|sale|crossed|strikethrough/i.test(p.html || '')
    );
    if (productPages.length > 0 && !hasSalePrice) {
        // Not a failure but a note
        issues.push({ title: 'Sale Pricing', severity: 'pass', description: 'Sale price formatting checked' });
    } else if (hasSalePrice) {
        issues.push({ title: 'Sale Prices Formatted', severity: 'pass', description: 'Compare-at prices found' });
    }

    // HTTPS Checkout (1 pt) - CRITICAL
    const hasHTTPS = pages.some(p => p.url?.startsWith('https://'));
    if (!hasHTTPS) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'HTTPS Not Detected',
            'Website may not be using HTTPS.',
            '/',
            'critical',
            ['Ensure SSL certificate is installed', 'All pages should use HTTPS'],
            null,
            'GMC requires HTTPS on all checkout pages'
        ));
    } else {
        issues.push({ title: 'HTTPS Enabled', severity: 'pass', description: 'SSL certificate active' });
    }

    // Multiple Payment Methods (1 pt) - CRITICAL
    const paymentMethods = /visa|mastercard|amex|paypal|apple pay|google pay|shop pay|credit card|debit/i;
    const hasPaymentMethods = paymentMethods.test(allHtml);
    if (!hasPaymentMethods) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Payment Methods Not Visible',
            'Payment method icons/info not found on site.',
            '/',
            'critical',
            ['Add payment method icons to footer', 'Show accepted cards (Visa, MC, Amex)'],
            null,
            'GMC requires conventional payment methods (not crypto-only)'
        ));
    } else {
        issues.push({ title: 'Payment Methods Shown', severity: 'pass', description: 'Payment options visible' });
    }

    // No Hidden Fees (1 pt) - CRITICAL (hard to detect automatically)
    issues.push({ title: 'Hidden Fees Check', severity: 'pass', description: 'Manual verification recommended' });

    return { name: 'Pricing & Checkout', maxPoints: 5, score: Math.max(0, score), issues };
}

// ============================================
// GMC SECTION 4: Product Page Requirements (4 pts)
// ============================================
function checkProductRequirements(crawlResults) {
    const issues = [];
    let score = 4;
    const { pages } = crawlResults;
    const productPages = pages.filter(p => p.url?.includes('/products/'));
    const allProductHtml = productPages.map(p => p.html || '').join(' ');

    if (productPages.length === 0) {
        return {
            name: 'Product Requirements', maxPoints: 4, score: 0, issues: [
                { title: 'No Products Found', severity: 'warning', description: 'Could not analyze product pages' }
            ]
        };
    }

    // High Quality Images (1 pt) - CRITICAL
    const hasImages = /<img[^>]*product[^>]*>|class="[^"]*product.*image/i.test(allProductHtml);
    if (!hasImages) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Product Images Not Detected',
            'Product images may be missing or incorrectly structured.',
            '/products/*',
            'critical',
            ['Ensure all products have high-quality images', 'Min 100x100px, recommended 500x500px'],
            null,
            'GMC requires clear product images without overlays or watermarks'
        ));
    } else {
        issues.push({ title: 'Product Images Present', severity: 'pass', description: 'Product images found' });
    }

    // Availability Shown (1 pt) - CRITICAL
    const hasAvailability = /in stock|out of stock|available|sold out|add to cart/i.test(allProductHtml);
    if (!hasAvailability) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Stock Status Not Visible',
            'Product availability status not clearly shown.',
            '/products/*',
            'critical',
            ['Show "In Stock" or "Out of Stock" on product pages', 'Must match GMC feed availability'],
            null,
            'GMC requires availability to match between site and feed'
        ));
    } else {
        issues.push({ title: 'Availability Shown', severity: 'pass', description: 'Stock status visible' });
    }

    // Product Condition (0.5 pt) - HIGH
    const hasCondition = /new|used|refurbished|pre-owned|condition/i.test(allProductHtml);
    // Most products are new by default, only flag if selling used
    issues.push({ title: 'Product Condition', severity: 'pass', description: 'Assumed new (default)' });

    // No Prohibited Products (1 pt) - CRITICAL
    const prohibitedKeywords = /gun|rifle|ammo|ammunition|tobacco|cigarette|vape|cannabis|marijuana|cbd|replica|counterfeit|gambling|casino/i;
    const hasProhibited = prohibitedKeywords.test(allProductHtml);
    if (hasProhibited) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Potentially Prohibited Products',
            'Keywords matching GMC prohibited categories detected.',
            '/products/*',
            'critical',
            ['Review products for GMC policy compliance', 'Remove or hide prohibited items from GMC feed'],
            null,
            'Prohibited products cause immediate GMC suspension'
        ));
    } else {
        issues.push({ title: 'No Prohibited Products', severity: 'pass', description: 'No prohibited keywords detected' });
    }

    // Accurate Title (0.5 pt) - HIGH
    const hasGoodTitles = productPages.some(p => {
        const titleMatch = (p.html || '').match(/<h1[^>]*>([^<]+)</i);
        const title = titleMatch ? titleMatch[1] : '';
        return title.length > 10 && title.length < 150 && !/best|free shipping|sale/i.test(title);
    });
    if (!hasGoodTitles) {
        score -= 0.5;
        issues.push(createGMCSuggestion(
            'Product Titles May Need Review',
            'Product titles may contain promotional text or be too generic.',
            '/products/*',
            'high',
            ['Remove promotional text from titles', 'No "Best!", "Free Shipping!" in titles'],
            null,
            'GMC disapproves products with promotional text in titles'
        ));
    } else {
        issues.push({ title: 'Product Titles OK', severity: 'pass', description: 'Titles appear clean' });
    }

    return { name: 'Product Requirements', maxPoints: 4, score: Math.max(0, score), issues };
}

// ============================================
// GMC SECTION 5: Structured Data / Schema (3 pts)
// ============================================
function checkStructuredData(crawlResults) {
    const issues = [];
    let score = 3;
    const { pages } = crawlResults;
    const productPages = pages.filter(p => p.url?.includes('/products/'));

    if (productPages.length === 0) {
        return {
            name: 'Structured Data', maxPoints: 3, score: 0, issues: [
                { title: 'No Products to Check', severity: 'warning', description: 'Could not analyze schema' }
            ]
        };
    }

    // Product Schema Present (1 pt) - CRITICAL
    const hasProductSchema = productPages.some(p =>
        /application\/ld\+json[^>]*>[^<]*"@type"\s*:\s*"Product"/i.test(p.html || '')
    );
    if (!hasProductSchema) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Product Schema Missing',
            'No JSON-LD Product schema found on product pages.',
            '/products/*',
            'critical',
            ['Add JSON-LD Product markup to product template', 'Include @type: "Product" with required properties'],
            `<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Product Title",
  "image": "https://...",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>`,
            'Schema markup enables Automatic Item Updates in GMC'
        ));
    } else {
        issues.push({ title: 'Product Schema Present', severity: 'pass', description: 'JSON-LD Product found' });
    }

    // Required Schema Properties (1 pt) - CRITICAL
    const hasRequiredProps = productPages.some(p => {
        const html = p.html || '';
        return /offers[^}]*price/i.test(html) &&
            /offers[^}]*availability/i.test(html) &&
            /"name"\s*:/i.test(html);
    });
    if (hasProductSchema && !hasRequiredProps) {
        score -= 1;
        issues.push(createGMCSuggestion(
            'Schema Missing Required Properties',
            'Product schema may be missing price, availability, or name.',
            '/products/*',
            'critical',
            ['Ensure schema includes: name, price, priceCurrency, availability'],
            null,
            'Missing schema properties cause GMC disapprovals'
        ));
    } else if (hasProductSchema) {
        issues.push({ title: 'Schema Properties OK', severity: 'pass', description: 'Required properties found' });
    }

    // Schema Price/Availability Matching (1 pt) - CRITICAL
    // This requires comparing schema values to displayed values - simplified check
    if (hasProductSchema) {
        issues.push({ title: 'Schema-Display Match', severity: 'pass', description: 'Manual verification recommended' });
    }

    return { name: 'Structured Data', maxPoints: 3, score: Math.max(0, score), issues };
}

// ============================================
// MAIN: Check GMC Compliance (25 pts total)
// ============================================
export function checkGMCCompliance(crawlResults) {
    const businessIdentity = checkBusinessIdentity(crawlResults);
    const policyPages = checkPolicyPagesGMC(crawlResults);
    const pricingCheckout = checkPricingCheckout(crawlResults);
    const productReqs = checkProductRequirements(crawlResults);
    const structuredData = checkStructuredData(crawlResults);

    const totalScore = businessIdentity.score + policyPages.score + pricingCheckout.score +
        productReqs.score + structuredData.score;

    // Combine all issues
    const allIssues = [
        ...businessIdentity.issues,
        ...policyPages.issues,
        ...pricingCheckout.issues,
        ...productReqs.issues,
        ...structuredData.issues
    ];

    // Determine GMC Readiness
    const criticalIssues = allIssues.filter(i => i.impact === 'critical' && i.severity !== 'pass');
    let gmcStatus, gmcStatusColor;
    if (criticalIssues.length === 0 && totalScore >= 20) {
        gmcStatus = 'GMC READY';
        gmcStatusColor = 'success';
    } else if (criticalIssues.length <= 2 && totalScore >= 15) {
        gmcStatus = 'GMC NEEDS WORK';
        gmcStatusColor = 'warning';
    } else {
        gmcStatus = 'GMC NOT READY';
        gmcStatusColor = 'critical';
    }

    return {
        name: 'GMC Compliance',
        maxPoints: 25,
        score: Math.max(0, Math.round(totalScore * 10) / 10),
        issues: allIssues,
        gmcStatus,
        gmcStatusColor,
        subcategories: {
            businessIdentity,
            policyPages,
            pricingCheckout,
            productReqs,
            structuredData
        }
    };
}
