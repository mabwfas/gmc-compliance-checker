/**
 * ShopScore v2.0 - Unified Shopify QA Audit Checker
 * 
 * 6 Categories totaling 100 points:
 * - Essential Pages & Policies: 20 pts
 * - Navigation & Structure: 15 pts
 * - Content Quality: 15 pts
 * - Visual & Design: 15 pts
 * - Technical Markers: 10 pts
 * - GMC Compliance: 25 pts (see gmcChecker.js)
 */

// Helper to create a suggestion with specific format
function createSuggestion(title, description, location, impact, fix, codeExample = null) {
    return {
        title,
        description,
        location,
        impact, // 'critical', 'high', 'medium', 'low'
        severity: impact === 'critical' ? 'critical' : impact === 'high' ? 'critical' : 'warning',
        howToFix: fix,
        copyPasteCode: codeExample,
        whyItMatters: getWhyItMatters(title, impact)
    };
}

function getWhyItMatters(title, impact) {
    const reasons = {
        'critical': 'This is a critical issue that will prevent client delivery. Must be fixed immediately.',
        'high': 'This issue significantly impacts user experience and professional appearance.',
        'medium': 'This issue affects quality standards and should be addressed before delivery.',
        'low': 'This is a minor issue that improves overall polish.'
    };
    return reasons[impact] || reasons['medium'];
}

// ============================================
// CATEGORY 1: Essential Pages & Policies (20 pts)
// ============================================
function checkEssentialPages(crawlResults) {
    const issues = [];
    let score = 20;
    const { pages } = crawlResults;
    const allHtml = pages.map(p => p.html || '').join(' ').toLowerCase();

    // Privacy Policy (3 pts)
    const privacyPage = pages.find(p =>
        p.url?.includes('privacy') ||
        p.url?.includes('policies/privacy')
    );
    if (!privacyPage) {
        score -= 3;
        issues.push(createSuggestion(
            'Privacy Policy Page Missing',
            'No privacy policy page was found on the store.',
            '/policies/privacy-policy',
            'critical',
            [
                'Go to Shopify Admin → Settings → Policies',
                'Click on "Privacy policy" and add your policy text',
                'Replace all "[Brand Name]" placeholders with your actual brand name',
                'Ensure GDPR compliance elements are included'
            ],
            `<!-- Privacy Policy Page -->
<div class="policy-page">
  <h1>Privacy Policy</h1>
  <p>Last updated: ${new Date().toLocaleDateString()}</p>
  <h2>What Information We Collect</h2>
  <p>We collect information you provide directly...</p>
</div>`
        ));
    } else {
        // Check for placeholder text
        const privacyHtml = privacyPage.html?.toLowerCase() || '';
        if (privacyHtml.includes('[brand name]') || privacyHtml.includes('[company name]')) {
            score -= 2;
            issues.push(createSuggestion(
                'Privacy Policy Contains Placeholder Text',
                'The privacy policy contains "[Brand Name]" or similar placeholder text.',
                privacyPage.url,
                'high',
                ['Open the privacy policy page in Shopify Admin', 'Find and replace all "[Brand Name]" with your actual brand name'],
                null
            ));
        } else {
            issues.push({ title: 'Privacy Policy Present', severity: 'pass', description: 'Privacy policy page exists and is accessible' });
        }
    }

    // Refund/Return Policy (4 pts)
    const refundPage = pages.find(p =>
        p.url?.includes('refund') ||
        p.url?.includes('return') ||
        p.url?.includes('policies/refund')
    );
    if (!refundPage) {
        score -= 4;
        issues.push(createSuggestion(
            'Refund/Return Policy Page Missing',
            'No refund or return policy page was found.',
            '/policies/refund-policy',
            'critical',
            [
                'Go to Shopify Admin → Settings → Policies',
                'Click on "Refund policy" and add your policy',
                'Include clear timeframes (e.g., "30-day return window")',
                'Explain the return process step by step'
            ],
            `<h1>Refund & Return Policy</h1>
<h2>30-Day Return Window</h2>
<p>We accept returns within 30 days of purchase.</p>
<h2>How to Return</h2>
<ol>
  <li>Contact us at support@yourbrand.com</li>
  <li>We'll send you a prepaid return label</li>
  <li>Ship the item back in original packaging</li>
</ol>`
        ));
    } else {
        issues.push({ title: 'Refund Policy Present', severity: 'pass', description: 'Refund/return policy page exists' });
    }

    // Shipping Policy (4 pts)
    const shippingPage = pages.find(p =>
        p.url?.includes('shipping') ||
        p.url?.includes('policies/shipping') ||
        p.url?.includes('delivery')
    );
    if (!shippingPage) {
        score -= 4;
        issues.push(createSuggestion(
            'Shipping Policy Page Missing',
            'No shipping policy page was found.',
            '/policies/shipping-policy',
            'critical',
            [
                'Go to Shopify Admin → Settings → Policies',
                'Add shipping policy with delivery times',
                'Include shipping costs and regions covered',
                'Mention any free shipping thresholds'
            ],
            `<h1>Shipping Policy</h1>
<h2>Delivery Times</h2>
<ul>
  <li>Standard Shipping: 5-7 business days</li>
  <li>Express Shipping: 2-3 business days</li>
</ul>
<h2>Free Shipping</h2>
<p>Free shipping on orders over $50</p>`
        ));
    } else {
        issues.push({ title: 'Shipping Policy Present', severity: 'pass', description: 'Shipping policy page exists' });
    }

    // Terms of Service (4 pts)
    const termsPage = pages.find(p =>
        p.url?.includes('terms') ||
        p.url?.includes('policies/terms') ||
        p.url?.includes('tos')
    );
    if (!termsPage) {
        score -= 4;
        issues.push(createSuggestion(
            'Terms of Service Page Missing',
            'No terms of service page was found.',
            '/policies/terms-of-service',
            'critical',
            [
                'Go to Shopify Admin → Settings → Policies',
                'Add terms of service',
                'Include legal disclaimers and usage terms',
                'Replace all placeholder text with brand name'
            ],
            null
        ));
    } else {
        issues.push({ title: 'Terms of Service Present', severity: 'pass', description: 'Terms of service page exists' });
    }

    // Contact Us Page (4 pts)
    const contactPage = pages.find(p =>
        p.url?.includes('contact') ||
        p.url?.includes('pages/contact')
    );
    if (!contactPage) {
        score -= 4;
        issues.push(createSuggestion(
            'Contact Page Missing',
            'No contact page was found on the store.',
            '/pages/contact',
            'critical',
            [
                'Create a new page called "Contact Us"',
                'Add visible email address',
                'Include a contact form',
                'Add physical address if applicable'
            ],
            `<div class="contact-page">
  <h1>Contact Us</h1>
  <p>Email: <a href="mailto:support@yourbrand.com">support@yourbrand.com</a></p>
  <p>We respond within 24 hours.</p>
  {{ 'contact' | form_tag }}
    <input type="email" name="email" placeholder="Your email" required>
    <textarea name="message" placeholder="Your message" required></textarea>
    <button type="submit">Send Message</button>
  {{ end }}
</div>`
        ));
    } else {
        // Check for email presence
        const contactHtml = contactPage.html || '';
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(contactHtml);
        if (!hasEmail) {
            score -= 2;
            issues.push(createSuggestion(
                'Contact Page Missing Email Address',
                'The contact page exists but no visible email address was found.',
                contactPage.url,
                'high',
                ['Add a visible email address to the contact page', 'Use format: support@yourbrand.com'],
                `<p class="contact-email">Email us: <a href="mailto:support@yourbrand.com">support@yourbrand.com</a></p>`
            ));
        } else {
            issues.push({ title: 'Contact Page with Email', severity: 'pass', description: 'Contact page has visible email' });
        }
    }

    // Track Order Page (2 pts)
    const trackPage = pages.find(p =>
        p.url?.includes('track') ||
        p.url?.includes('order-tracking') ||
        p.url?.includes('apps/track')
    );
    if (!trackPage) {
        score -= 2;
        issues.push(createSuggestion(
            'Track Order Page Missing',
            'No order tracking page was found. This is commonly missing.',
            '/pages/track-order',
            'high',
            [
                'Install a tracking app like "Track123" or "Parcel Panel"',
                'Create a "Track Your Order" page',
                'Add tracking input field for order number/email',
                'Link from footer navigation'
            ],
            `<div class="track-order-page">
  <h1>Track Your Order</h1>
  <p>Enter your order number and email to track your package.</p>
  <form class="tracking-form">
    <input type="text" placeholder="Order Number" required>
    <input type="email" placeholder="Email Address" required>
    <button type="submit">Track Order</button>
  </form>
</div>`
        ));
    } else {
        issues.push({ title: 'Track Order Page Present', severity: 'pass', description: 'Order tracking page exists' });
    }

    return {
        name: 'Essential Pages & Policies',
        maxPoints: 20,
        score: Math.max(0, score),
        issues
    };
}

// ============================================
// CATEGORY 2: Navigation & Structure (15 pts)
// ============================================
function checkNavigation(crawlResults) {
    const issues = [];
    let score = 15;
    const { pages } = crawlResults;
    const homepage = pages[0];
    const html = homepage?.html || '';
    const allHtml = pages.map(p => p.html || '').join(' ');

    // Header Navigation (4 pts)
    const hasLogo = /<img[^>]*(?:logo|brand)[^>]*>/i.test(html) || /class="[^"]*logo[^"]*"/i.test(html);
    const hasNav = /<nav|<header|class="[^"]*nav[^"]*"|class="[^"]*menu[^"]*"/i.test(html);
    const hasCartIcon = /cart|bag|basket/i.test(html) && (/icon|svg|fa-/i.test(html));

    if (!hasLogo) {
        score -= 2;
        issues.push(createSuggestion(
            'Logo Not Properly Linked',
            'Logo element is missing or not properly configured.',
            '/',
            'medium',
            ['Ensure logo links to homepage', 'Add proper alt text to logo image'],
            `<a href="/" class="logo-link">
  <img src="logo.png" alt="Your Brand Name - Home">
</a>`
        ));
    }
    if (!hasNav) {
        score -= 2;
        issues.push(createSuggestion(
            'Header Navigation Missing',
            'Main navigation structure not found in header.',
            '/',
            'high',
            ['Add a proper <nav> element', 'Include main menu items'],
            null
        ));
    } else {
        issues.push({ title: 'Header Navigation Present', severity: 'pass', description: 'Main navigation structure exists' });
    }

    // Footer Structure (4 pts)
    const hasFooter = /<footer/i.test(html);
    const footerHasPolicyLinks = /privacy|refund|shipping|terms/i.test(html);
    const hasSocialLinks = /facebook|instagram|twitter|tiktok|youtube|linkedin/i.test(html);
    const hasCopyright = /©|copyright|\d{4}/i.test(html);

    if (!hasFooter || !footerHasPolicyLinks) {
        score -= 2;
        issues.push(createSuggestion(
            'Footer Missing Policy Links',
            'Footer should contain links to all policy pages.',
            '/',
            'medium',
            ['Add Privacy Policy link to footer', 'Add Refund Policy link', 'Add Shipping Policy link', 'Add Terms of Service link'],
            `<footer>
  <nav class="footer-policies">
    <a href="/policies/privacy-policy">Privacy Policy</a>
    <a href="/policies/refund-policy">Refund Policy</a>
    <a href="/policies/shipping-policy">Shipping Policy</a>
    <a href="/policies/terms-of-service">Terms of Service</a>
  </nav>
</footer>`
        ));
    }
    if (!hasCopyright) {
        score -= 1;
        issues.push(createSuggestion(
            'Copyright Text Missing',
            'Footer should contain copyright text with current year.',
            '/',
            'low',
            ['Add copyright text to footer'],
            `<p class="copyright">© ${new Date().getFullYear()} Your Brand Name. All rights reserved.</p>`
        ));
    } else {
        issues.push({ title: 'Footer Structure Complete', severity: 'pass', description: 'Footer has proper structure' });
    }

    // Mobile Menu (3 pts)
    const hasMobileMenu = /hamburger|mobile-menu|nav-toggle|menu-toggle|burger/i.test(html) ||
        /class="[^"]*drawer[^"]*"/i.test(html);
    if (!hasMobileMenu) {
        score -= 3;
        issues.push(createSuggestion(
            'Mobile Menu Not Detected',
            'Hamburger menu or mobile navigation toggle not found.',
            '/',
            'high',
            ['Add hamburger icon for mobile', 'Ensure mobile navigation drawer exists'],
            null
        ));
    } else {
        issues.push({ title: 'Mobile Menu Present', severity: 'pass', description: 'Mobile navigation structure exists' });
    }

    // Breadcrumbs (2 pts)
    const productPages = pages.filter(p => p.url?.includes('/products/'));
    const hasBreadcrumbs = productPages.some(p => /breadcrumb/i.test(p.html || ''));
    if (productPages.length > 0 && !hasBreadcrumbs) {
        score -= 2;
        issues.push(createSuggestion(
            'Breadcrumbs Missing on Product Pages',
            'Product pages should have breadcrumb navigation.',
            '/products/*',
            'low',
            ['Add breadcrumb component to product template'],
            `<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a> › 
  <a href="/collections/all">Products</a> › 
  <span>Product Name</span>
</nav>`
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Breadcrumbs Present', severity: 'pass', description: 'Product pages have breadcrumbs' });
    }

    // Search Functionality (2 pts)
    const hasSearch = /search|type="search"/i.test(html);
    if (!hasSearch) {
        score -= 2;
        issues.push(createSuggestion(
            'Search Functionality Missing',
            'No search icon or search form found in header.',
            '/',
            'medium',
            ['Add search icon to header', 'Ensure search form works correctly'],
            null
        ));
    } else {
        issues.push({ title: 'Search Present', severity: 'pass', description: 'Search functionality exists' });
    }

    // 404 Page (2 pts)
    const page404 = pages.find(p => p.url?.includes('404') || p.statusCode === 404);
    const has404Custom = page404 && !/shopify|default/i.test(page404.html || '');
    if (!has404Custom) {
        score -= 2;
        issues.push(createSuggestion(
            '404 Page Not Customized',
            'Custom 404 error page not found or using Shopify default.',
            '/404',
            'medium',
            ['Customize 404.liquid template', 'Add branded messaging and helpful links'],
            `<div class="page-404">
  <h1>Page Not Found</h1>
  <p>Sorry, we couldn't find what you're looking for.</p>
  <a href="/" class="btn">Return to Home</a>
</div>`
        ));
    } else {
        issues.push({ title: 'Custom 404 Page', severity: 'pass', description: '404 page is customized' });
    }

    return {
        name: 'Navigation & Structure',
        maxPoints: 15,
        score: Math.max(0, score),
        issues
    };
}

// ============================================
// CATEGORY 3: Content Quality (15 pts)
// ============================================
function checkContentQuality(crawlResults) {
    const issues = [];
    let score = 15;
    const { pages } = crawlResults;
    const homepage = pages[0];
    const html = homepage?.html || '';
    const allHtml = pages.map(p => p.html || '').join(' ');
    const allText = allHtml.replace(/<[^>]*>/g, ' ').toLowerCase();

    // Homepage Copy (3 pts)
    const hasPlaceholderHomepage = /lorem ipsum|placeholder text|sample text|edit this/i.test(html);
    if (hasPlaceholderHomepage) {
        score -= 3;
        issues.push(createSuggestion(
            'Homepage Contains Placeholder Text',
            'Lorem ipsum or placeholder text found on homepage.',
            '/',
            'critical',
            ['Remove all placeholder text', 'Write brand-specific messaging', 'Add clear value proposition'],
            null
        ));
    } else {
        issues.push({ title: 'Homepage Copy Clear', severity: 'pass', description: 'No placeholder text on homepage' });
    }

    // Product Descriptions (3 pts)
    const productPages = pages.filter(p => p.url?.includes('/products/'));
    const hasLoremProducts = productPages.some(p => /lorem ipsum/i.test(p.html || ''));
    const hasEmptyDescriptions = productPages.some(p => {
        const desc = (p.html || '').match(/product-description|description[^>]*>([^<]*)</i);
        return desc && desc[1]?.trim().length < 20;
    });

    if (hasLoremProducts) {
        score -= 3;
        issues.push(createSuggestion(
            'Product Descriptions Have Placeholder Text',
            'Lorem ipsum found in product descriptions.',
            '/products/*',
            'critical',
            ['Write unique product descriptions', 'List key features and benefits', 'Include material/size information'],
            null
        ));
    } else if (hasEmptyDescriptions) {
        score -= 2;
        issues.push(createSuggestion(
            'Product Descriptions Too Short',
            'Some product descriptions are too short or empty.',
            '/products/*',
            'high',
            ['Add detailed descriptions to all products', 'Include features, benefits, and specifications'],
            null
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Product Descriptions Present', severity: 'pass', description: 'Products have descriptions' });
    }

    // Spelling & Grammar (2 pts)
    const commonTypos = ['teh ', 'recieve', 'seperate', 'occured', 'definately'];
    const hasTypos = commonTypos.some(typo => allText.includes(typo));
    if (hasTypos) {
        score -= 2;
        issues.push(createSuggestion(
            'Spelling Errors Detected',
            'Common spelling errors found on the website.',
            'Multiple pages',
            'medium',
            ['Run content through spell checker', 'Review all page content for errors'],
            null
        ));
    } else {
        issues.push({ title: 'No Obvious Spelling Errors', severity: 'pass', description: 'No common typos detected' });
    }

    // Brand Consistency (3 pts)
    const hasBrandPlaceholders = /\[brand name\]|\[company name\]|\[your brand\]|\[store name\]/i.test(allHtml);
    const hasShopifyBranding = /powered by shopify/i.test(allHtml);

    if (hasBrandPlaceholders) {
        score -= 3;
        issues.push(createSuggestion(
            'Brand Name Placeholders Found',
            '"[Brand Name]" or similar placeholders found in content.',
            'Multiple pages',
            'critical',
            ['Find and replace all "[Brand Name]" with actual brand', 'Check policies especially'],
            null
        ));
    } else {
        issues.push({ title: 'Brand Consistency', severity: 'pass', description: 'No brand placeholders found' });
    }

    if (hasShopifyBranding) {
        score -= 1;
        issues.push(createSuggestion(
            'Powered by Shopify Text Visible',
            'Default "Powered by Shopify" text in footer.',
            '/',
            'low',
            ['Remove "Powered by Shopify" from footer in theme settings'],
            null
        ));
    }

    // Meta Information (4 pts)
    const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
    const hasMeta = /<meta[^>]*description[^>]*>/i.test(html);
    const hasFavicon = /favicon|icon.*\.(?:ico|png)/i.test(html);

    if (!hasTitle) {
        score -= 2;
        issues.push(createSuggestion(
            'Page Title Missing',
            'Homepage is missing a proper title tag.',
            '/',
            'high',
            ['Set title in Shopify Admin → Preferences', 'Use format: "Brand Name - Tagline"'],
            null
        ));
    }
    if (!hasMeta) {
        score -= 1;
        issues.push(createSuggestion(
            'Meta Description Missing',
            'No meta description found on homepage.',
            '/',
            'medium',
            ['Add meta description in Shopify Admin → Preferences'],
            null
        ));
    }
    if (!hasFavicon) {
        score -= 1;
        issues.push(createSuggestion(
            'Favicon Missing',
            'No favicon detected on the website.',
            '/',
            'low',
            ['Upload favicon in Theme Settings → Favicon'],
            null
        ));
    }
    if (hasTitle && hasMeta && hasFavicon) {
        issues.push({ title: 'Meta Information Complete', severity: 'pass', description: 'Title, meta, and favicon present' });
    }

    return {
        name: 'Content Quality',
        maxPoints: 15,
        score: Math.max(0, score),
        issues
    };
}

// ============================================
// CATEGORY 4: Visual & Design (15 pts)
// ============================================
function checkVisualDesign(crawlResults) {
    const issues = [];
    let score = 15;
    const { pages } = crawlResults;
    const homepage = pages[0];
    const html = homepage?.html || '';
    const allHtml = pages.map(p => p.html || '').join(' ');

    // Logo Implementation (3 pts)
    const logoMatch = html.match(/<img[^>]*logo[^>]*>/i);
    const hasLogoAlt = logoMatch && /alt="[^"]+"/i.test(logoMatch[0]);
    const logoLinked = /<a[^>]*href="[^"]*\/"[^>]*>[\s\S]*?<img[^>]*logo/i.test(html);

    if (!logoMatch) {
        score -= 3;
        issues.push(createSuggestion(
            'Logo Not Found',
            'Website logo image not detected.',
            '/',
            'high',
            ['Upload logo in Theme Settings', 'Ensure logo is in header'],
            null
        ));
    } else if (!hasLogoAlt) {
        score -= 2;
        issues.push(createSuggestion(
            'Logo Missing Alt Text',
            'Logo image does not have descriptive alt text.',
            '/',
            'medium',
            ['Add alt text to logo: "Brand Name - Home"'],
            `<img src="logo.png" alt="Your Brand Name - Home">`
        ));
    } else {
        issues.push({ title: 'Logo Properly Implemented', severity: 'pass', description: 'Logo present with alt text' });
    }

    // Image Alt Text (3 pts)
    const images = allHtml.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = images.filter(img => !/alt="[^"]+"/i.test(img) || /alt=""/i.test(img));
    const altPercentage = images.length > 0 ? ((images.length - imagesWithoutAlt.length) / images.length) * 100 : 100;

    if (altPercentage < 50) {
        score -= 3;
        issues.push(createSuggestion(
            'Most Images Missing Alt Text',
            `Only ${Math.round(altPercentage)}% of images have alt text.`,
            'Multiple pages',
            'high',
            ['Add descriptive alt text to all product images', 'Describe what the image shows'],
            `<img src="product.jpg" alt="Blue Cotton T-Shirt - Front View">`
        ));
    } else if (altPercentage < 80) {
        score -= 2;
        issues.push(createSuggestion(
            'Some Images Missing Alt Text',
            `${Math.round(altPercentage)}% of images have alt text.`,
            'Multiple pages',
            'medium',
            ['Review all images and add missing alt text'],
            null
        ));
    } else {
        issues.push({ title: 'Image Alt Text Good', severity: 'pass', description: 'Most images have alt text' });
    }

    // Button Styling (3 pts)
    const hasButtons = /<button|type="submit"|class="[^"]*btn[^"]*"/i.test(html);
    const hasDefaultBlue = /#1773b0|#008060|shopify-blue/i.test(allHtml);

    if (!hasButtons) {
        score -= 3;
        issues.push(createSuggestion(
            'Button Elements Not Found',
            'Standard button elements not detected in HTML.',
            '/',
            'high',
            ['Ensure buttons use proper <button> or styled elements'],
            null
        ));
    } else if (hasDefaultBlue) {
        score -= 2;
        issues.push(createSuggestion(
            'Default Shopify Colors Detected',
            'Default Shopify blue color scheme may still be in use.',
            '/',
            'medium',
            ['Update button colors to match brand', 'Change accent colors in theme settings'],
            null
        ));
    } else {
        issues.push({ title: 'Button Styling Custom', severity: 'pass', description: 'Buttons appear customized' });
    }

    // Color Consistency (3 pts)
    const cssVars = (allHtml.match(/--[a-zA-Z-]+:\s*#[0-9a-fA-F]+/g) || []).length;
    const hasColorSystem = cssVars > 3 || /theme|brand.*color/i.test(allHtml);

    if (!hasColorSystem) {
        score -= 1.5;
        issues.push(createSuggestion(
            'Color System Not Detected',
            'CSS custom properties for colors may not be set up.',
            '/',
            'low',
            ['Set up brand colors in theme settings', 'Ensure consistent color usage'],
            null
        ));
    } else {
        issues.push({ title: 'Color System Present', severity: 'pass', description: 'Color variables detected' });
    }

    // Typography (3 pts)
    const hasCustomFonts = /font-family|@font-face|fonts\.googleapis|fonts\.shopify/i.test(allHtml);
    if (!hasCustomFonts) {
        score -= 3;
        issues.push(createSuggestion(
            'Custom Fonts Not Detected',
            'Website may be using default system fonts.',
            '/',
            'medium',
            ['Add custom brand fonts in theme settings', 'Ensure fonts load properly'],
            null
        ));
    } else {
        issues.push({ title: 'Custom Typography', severity: 'pass', description: 'Custom fonts detected' });
    }

    return {
        name: 'Visual & Design',
        maxPoints: 15,
        score: Math.max(0, score),
        issues
    };
}

// ============================================
// CATEGORY 5: Technical Markers (10 pts)
// ============================================
function checkTechnicalMarkers(crawlResults) {
    const issues = [];
    let score = 10;
    const { pages } = crawlResults;
    const allHtml = pages.map(p => p.html || '').join(' ');
    const productPages = pages.filter(p => p.url?.includes('/products/'));

    // Add to Cart Button (2 pts)
    const hasAddToCart = productPages.some(p =>
        /add.to.cart|add-to-cart|AddToCart/i.test(p.html || '') ||
        /type="submit"[^>]*cart/i.test(p.html || '')
    );
    if (productPages.length > 0 && !hasAddToCart) {
        score -= 2;
        issues.push(createSuggestion(
            'Add to Cart Button Not Found',
            'Add to cart button not detected on product pages.',
            '/products/*',
            'critical',
            ['Ensure product form has add to cart button', 'Check product template'],
            `<button type="submit" class="add-to-cart-btn">Add to Cart</button>`
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Add to Cart Present', severity: 'pass', description: 'Add to cart buttons found' });
    }

    // Cart Page (2 pts)
    const cartPage = pages.find(p => p.url?.includes('/cart'));
    if (!cartPage) {
        score -= 2;
        issues.push(createSuggestion(
            'Cart Page Not Accessible',
            'Cart page could not be accessed or analyzed.',
            '/cart',
            'high',
            ['Ensure cart page is accessible', 'Verify cart functionality works'],
            null
        ));
    } else {
        issues.push({ title: 'Cart Page Accessible', severity: 'pass', description: 'Cart page exists' });
    }

    // Quantity Selectors (1 pt)
    const hasQuantity = productPages.some(p =>
        /quantity|qty/i.test(p.html || '') &&
        /input|select/i.test(p.html || '')
    );
    if (productPages.length > 0 && !hasQuantity) {
        score -= 1;
        issues.push(createSuggestion(
            'Quantity Selector Not Found',
            'Quantity input not detected on product pages.',
            '/products/*',
            'medium',
            ['Add quantity selector to product form'],
            `<input type="number" name="quantity" min="1" value="1">`
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Quantity Selectors Present', severity: 'pass', description: 'Quantity inputs found' });
    }

    // Variant Selectors (2 pts)
    const hasVariants = productPages.some(p =>
        /variant|option|size.*select|color.*select/i.test(p.html || '')
    );
    if (productPages.length > 0 && !hasVariants) {
        score -= 1; // Only partial deduction as not all products have variants
        issues.push(createSuggestion(
            'Variant Selectors May Be Missing',
            'Size/color variant selectors not clearly detected.',
            '/products/*',
            'low',
            ['Ensure products with variants have proper selectors'],
            null
        ));
    } else if (productPages.length > 0) {
        issues.push({ title: 'Variant Selectors Present', severity: 'pass', description: 'Variant selectors found' });
    }

    // Newsletter Signup (2 pts)
    const hasNewsletter = /newsletter|subscribe|email.*signup|mailing.list/i.test(allHtml) &&
        /type="email"/i.test(allHtml);
    if (!hasNewsletter) {
        score -= 2;
        issues.push(createSuggestion(
            'Newsletter Signup Not Found',
            'Email signup form not detected in footer.',
            '/',
            'medium',
            ['Add newsletter signup form to footer', 'Include email input with validation'],
            `<form class="newsletter-form">
  <input type="email" placeholder="Enter your email" required>
  <button type="submit">Subscribe</button>
</form>`
        ));
    } else {
        issues.push({ title: 'Newsletter Signup Present', severity: 'pass', description: 'Email signup form found' });
    }

    // Social Links (2 pts)
    const socialPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'pinterest', 'linkedin'];
    const foundSocials = socialPlatforms.filter(s =>
        new RegExp(`href="[^"]*${s}\\.com`, 'i').test(allHtml)
    );

    if (foundSocials.length === 0) {
        score -= 2;
        issues.push(createSuggestion(
            'Social Media Links Missing',
            'No social media links found on the website.',
            '/',
            'medium',
            ['Add social media links to footer', 'Ensure links open in new tab'],
            `<div class="social-links">
  <a href="https://facebook.com/yourbrand" target="_blank" rel="noopener">Facebook</a>
  <a href="https://instagram.com/yourbrand" target="_blank" rel="noopener">Instagram</a>
</div>`
        ));
    } else if (foundSocials.length < 2) {
        score -= 1;
        issues.push(createSuggestion(
            'Few Social Links',
            `Only ${foundSocials.length} social media link found.`,
            '/',
            'low',
            ['Add more social media links if available'],
            null
        ));
    } else {
        issues.push({ title: 'Social Links Present', severity: 'pass', description: `${foundSocials.length} social links found` });
    }

    return {
        name: 'Technical Markers',
        maxPoints: 10,
        score: Math.max(0, score),
        issues
    };
}

// ============================================
// MAIN EXPORT: Run All ShopScore Checks
// ============================================
export function runShopScoreAudit(crawlResults) {
    const categories = [
        checkEssentialPages(crawlResults),
        checkNavigation(crawlResults),
        checkContentQuality(crawlResults),
        checkVisualDesign(crawlResults),
        checkTechnicalMarkers(crawlResults)
    ];

    // Calculate total score
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = 100;

    // Determine status
    let status, statusColor;
    if (totalScore >= 90) {
        status = 'Ready for Delivery';
        statusColor = 'success';
    } else if (totalScore >= 80) {
        status = 'Nearly Ready';
        statusColor = 'warning';
    } else if (totalScore >= 60) {
        status = 'Needs Work';
        statusColor = 'warning';
    } else {
        status = 'Not Ready';
        statusColor = 'critical';
    }

    // Collect all issues and sort by impact
    const allIssues = [];
    const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    categories.forEach(cat => {
        cat.issues.forEach(issue => {
            if (issue.severity !== 'pass') {
                allIssues.push({ ...issue, category: cat.name });
            }
        });
    });

    allIssues.sort((a, b) => (impactOrder[a.impact] || 99) - (impactOrder[b.impact] || 99));

    return {
        score: totalScore,
        maxScore,
        status,
        statusColor,
        categories,
        allIssues,
        criticalCount: allIssues.filter(i => i.impact === 'critical').length,
        highCount: allIssues.filter(i => i.impact === 'high').length,
        mediumCount: allIssues.filter(i => i.impact === 'medium').length,
        lowCount: allIssues.filter(i => i.impact === 'low').length
    };
}

export {
    checkEssentialPages,
    checkNavigation,
    checkContentQuality,
    checkVisualDesign,
    checkTechnicalMarkers
};
