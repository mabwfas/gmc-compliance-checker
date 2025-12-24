// Advanced Micro-Level Checker
// Catches every minor detail that could affect GMC approval

import { parseHTML, extractText, extractMetaTags, extractLinks, extractImages } from '../utils/parser';

export function checkMicroDetails(crawlResults) {
    const issues = [];

    crawlResults.pages.forEach((page, pageIndex) => {
        const doc = parseHTML(page.html);
        const text = extractText(doc).toLowerCase();
        const html = page.html.toLowerCase();
        const metas = extractMetaTags(doc);
        const links = extractLinks(doc);
        const images = extractImages(doc);

        // ============================================
        // PRICE DISPLAY MICRO-CHECKS
        // ============================================

        // Check for price format issues
        const pricePatterns = page.html.match(/\$[\d,]+\.?\d{0,2}/g) || [];
        if (pricePatterns.length > 0) {
            const invalidPrices = pricePatterns.filter(p => {
                // Check for prices like $0.00 or $0
                if (p === '$0' || p === '$0.00' || p === '$0.0') return true;
                // Check for unrealistic high prices (potential placeholder)
                const numValue = parseFloat(p.replace(/[$,]/g, ''));
                if (numValue > 99999) return true;
                return false;
            });

            if (invalidPrices.length > 0) {
                issues.push({
                    title: 'Suspicious Prices Detected',
                    severity: 'warning',
                    description: `Found prices that may be incorrect: ${invalidPrices.slice(0, 3).join(', ')}. These could be placeholders or errors.`,
                    location: page.url,
                    whyItMatters: 'Incorrect or placeholder prices will cause GMC product disapprovals and can lead to account suspension.',
                    howToFix: [
                        'Review all prices on this page for accuracy',
                        'Remove any $0.00 placeholder prices',
                        'Ensure prices match your GMC product feed exactly',
                        'Check for prices that seem too high or too low'
                    ]
                });
            }
        }

        // Check for "Price on Request" or hidden prices
        if (text.includes('price on request') || text.includes('call for price') ||
            text.includes('contact for price') || text.includes('request a quote')) {
            issues.push({
                title: 'Hidden or Request-Based Pricing',
                severity: 'critical',
                description: 'Detected "Contact for Price" or similar language. Prices must be displayed publicly.',
                location: page.url,
                whyItMatters: 'GMC requires all prices to be clearly visible on your website. Hidden pricing or "Call for Price" will result in product disapprovals.',
                howToFix: [
                    'Display actual prices for all products',
                    'Remove "Price on Request" language',
                    'If pricing varies, show starting prices or price ranges',
                    'Consider removing products with non-public pricing from GMC'
                ]
            });
        }

        // ============================================
        // TRUST & LEGITIMACY MICRO-CHECKS
        // ============================================

        // Check for company registration/legal info (for legitimacy)
        if (pageIndex === 0) {
            const legalTerms = ['registered', 'incorporated', 'llc', 'ltd', 'inc.', 'corp.', 'pvt', 'limited'];
            const hasLegalInfo = legalTerms.some(term => text.includes(term));

            if (!hasLegalInfo) {
                issues.push({
                    title: 'Company Registration Not Visible',
                    severity: 'info',
                    description: 'No company registration or legal entity information was found. This can help establish legitimacy.',
                    location: 'Footer or About page',
                    whyItMatters: 'Displaying your legal business status (LLC, Inc, etc.) increases trust with both Google and customers.',
                    suggestions: [
                        'Add your company registration type to footer',
                        'Include business registration number if applicable',
                        'Display "Registered in [State/Country]" if relevant'
                    ]
                });
            }
        }

        // Check for copyright notice
        if (pageIndex === 0 && !html.includes('©') && !html.includes('copyright')) {
            issues.push({
                title: 'Copyright Notice Missing',
                severity: 'info',
                description: 'No copyright notice was found on the homepage.',
                location: 'Footer',
                whyItMatters: 'A copyright notice is a small trust signal that indicates a legitimate business.',
                copyPasteCode: `<footer>
  <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
</footer>`
            });
        }

        // ============================================
        // NAVIGATION & UX MICRO-CHECKS
        // ============================================

        // Check for favicon
        if (pageIndex === 0) {
            const hasFavicon = html.includes('rel="icon"') || html.includes("rel='icon'") ||
                html.includes('rel="shortcut icon"');
            if (!hasFavicon) {
                issues.push({
                    title: 'Favicon Missing',
                    severity: 'info',
                    description: 'No favicon was detected. This small icon appears in browser tabs.',
                    location: 'HTML head',
                    whyItMatters: 'A missing favicon looks unprofessional and reduces brand recognition.',
                    copyPasteCode: `<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
                });
            }
        }

        // Check for broken internal links (links to # or javascript:void)
        const brokenLinks = links.filter(link =>
            link.href === '#' ||
            link.href === 'javascript:void(0)' ||
            link.href === 'javascript:;' ||
            link.href === ''
        );

        if (brokenLinks.length > 3) {
            issues.push({
                title: 'Placeholder Links Detected',
                severity: 'warning',
                description: `Found ${brokenLinks.length} links that go nowhere (# or javascript:void). These should lead to actual pages.`,
                location: page.url,
                whyItMatters: 'Non-functional links create poor user experience and can be seen as low-quality site signals.',
                howToFix: [
                    'Replace placeholder # links with actual page URLs',
                    'Remove navigation items that have no destination',
                    'Ensure all links lead to valid, accessible pages'
                ]
            });
        }

        // ============================================
        // PRODUCT & CATALOG MICRO-CHECKS
        // ============================================

        // Check for "Out of Stock" messaging without proper handling
        if (text.includes('out of stock') || text.includes('sold out') || text.includes('unavailable')) {
            const hasNotifyMe = text.includes('notify me') || text.includes('back in stock') ||
                text.includes('waitlist') || html.includes('notify');

            if (!hasNotifyMe) {
                issues.push({
                    title: 'Out of Stock Products Without Notification Option',
                    severity: 'info',
                    description: 'Found out-of-stock products without a "Notify Me" or waitlist option.',
                    location: page.url,
                    whyItMatters: 'Offering back-in-stock notifications improves customer experience and captures potential sales.',
                    suggestions: [
                        'Add email notification for out-of-stock items',
                        'Consider hiding out-of-stock products from GMC feed',
                        'Keep availability status synchronized with feed'
                    ]
                });
            }
        }

        // Check for variant/size selection
        if (html.includes('select size') || html.includes('choose size') ||
            html.includes('select color') || html.includes('choose option')) {
            const hasVariantError = text.includes('please select') || text.includes('required field');
            if (hasVariantError) {
                issues.push({
                    title: 'Product Variant Selection Issues',
                    severity: 'warning',
                    description: 'Product pages require variant selection but may have usability issues.',
                    location: page.url,
                    whyItMatters: 'If customers cannot complete variant selection, they cannot purchase, affecting GMC performance.',
                    howToFix: [
                        'Ensure size/color selectors work properly',
                        'Pre-select a default variant if possible',
                        'Make variant selection clear and easy'
                    ]
                });
            }
        }

        // ============================================
        // SEO & META MICRO-CHECKS
        // ============================================

        // Check for duplicate content indicators
        if (metas['robots'] && metas['robots'].includes('noindex')) {
            issues.push({
                title: 'Page Set to NoIndex',
                severity: 'warning',
                description: 'This page has a noindex meta tag, preventing indexing.',
                location: page.url,
                whyItMatters: 'If product pages are set to noindex, they cannot appear in Google Shopping or organic search.',
                howToFix: [
                    'Remove noindex tag from product pages',
                    'Only use noindex for admin or internal pages',
                    'Check robots.txt does not block product pages'
                ]
            });
        }

        // Check for canonical tag
        const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
        if (!hasCanonical && pageIndex === 0) {
            issues.push({
                title: 'Canonical Tag Missing',
                severity: 'info',
                description: 'No canonical tag found. This helps prevent duplicate content issues.',
                location: page.url,
                copyPasteCode: `<link rel="canonical" href="${page.url}">`,
                suggestions: [
                    'Add canonical tags to all pages',
                    'Use self-referencing canonicals on unique pages',
                    'Point variant URLs to main product page'
                ]
            });
        }

        // Check Open Graph tags
        if (pageIndex === 0 && !metas['og:title'] && !metas['og:image']) {
            issues.push({
                title: 'Open Graph Tags Missing',
                severity: 'info',
                description: 'Open Graph meta tags not found. These improve social sharing.',
                location: 'HTML head',
                copyPasteCode: `<meta property="og:title" content="Your Page Title">
<meta property="og:description" content="Your page description">
<meta property="og:image" content="https://yoursite.com/og-image.jpg">
<meta property="og:url" content="${page.url}">
<meta property="og:type" content="website">`,
                suggestions: [
                    'Add OG tags to all important pages',
                    'Use unique OG images for products',
                    'Test with Facebook Sharing Debugger'
                ]
            });
        }

        // ============================================
        // ACCESSIBILITY MICRO-CHECKS
        // ============================================

        // Check for form labels
        const forms = doc.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"])');
            const labels = form.querySelectorAll('label');
            if (inputs.length > labels.length) {
                issues.push({
                    title: 'Form Inputs Missing Labels',
                    severity: 'info',
                    description: 'Some form inputs are missing label tags, affecting accessibility.',
                    location: page.url,
                    whyItMatters: 'Accessible forms improve user experience and help screen reader users complete purchases.',
                    howToFix: [
                        'Add <label> tags for all form inputs',
                        'Use aria-label if visual labels are not possible',
                        'Test forms with accessibility tools'
                    ]
                });
            }
        });

        // Check for alt text quality (not just existence)
        const poorAltText = images.filter(img =>
            img.alt && (
                img.alt.length < 5 ||
                img.alt.toLowerCase() === 'image' ||
                img.alt.toLowerCase() === 'photo' ||
                img.alt.toLowerCase() === 'picture' ||
                img.alt.includes('img_') ||
                img.alt.includes('DSC') ||
                /^\d+$/.test(img.alt)
            )
        );

        if (poorAltText.length > 0) {
            issues.push({
                title: 'Poor Quality Alt Text',
                severity: 'info',
                description: `${poorAltText.length} images have generic or low-quality alt text (e.g., "image", "photo", numbers).`,
                location: page.url,
                whyItMatters: 'Descriptive alt text helps Google understand images and improves accessibility.',
                howToFix: [
                    'Replace generic alt text with product descriptions',
                    'Include brand, product name, and key features',
                    'Make each alt text unique and descriptive'
                ]
            });
        }

        // ============================================
        // PERFORMANCE MICRO-CHECKS
        // ============================================

        // Check for large inline styles
        const inlineStyles = html.match(/style="[^"]{200,}"/g) || [];
        if (inlineStyles.length > 5) {
            issues.push({
                title: 'Excessive Inline Styles',
                severity: 'info',
                description: `Found ${inlineStyles.length} large inline style attributes. This can slow down page rendering.`,
                location: page.url,
                suggestions: [
                    'Move inline styles to CSS files',
                    'Reduces HTML size and improves caching',
                    'Better maintainability'
                ]
            });
        }

        // Check for lazy loading on images
        const lazyImages = images.filter(img =>
            html.includes('loading="lazy"') || html.includes("loading='lazy'")
        );

        if (images.length > 5 && lazyImages.length === 0 && pageIndex === 0) {
            issues.push({
                title: 'Images Not Lazy Loaded',
                severity: 'info',
                description: 'Images do not use lazy loading, which can slow initial page load.',
                location: 'Product pages',
                copyPasteCode: `<img src="product.jpg" alt="Product" loading="lazy">`,
                suggestions: [
                    'Add loading="lazy" to images below the fold',
                    'Keep above-the-fold images loading normally',
                    'Improves Core Web Vitals scores'
                ]
            });
        }

        // ============================================
        // PROMOTIONAL CONTENT MICRO-CHECKS
        // ============================================

        // Check for excessive exclamation marks
        const exclamationCount = (text.match(/!/g) || []).length;
        const wordCount = text.split(/\s+/).length;
        if (exclamationCount > wordCount / 20) {
            issues.push({
                title: 'Excessive Exclamation Marks',
                severity: 'info',
                description: 'High frequency of exclamation marks detected. This can appear spammy.',
                location: page.url,
                whyItMatters: 'Overly promotional language with excessive punctuation can be flagged as low quality.',
                suggestions: [
                    'Use exclamation marks sparingly',
                    'Focus on factual product descriptions',
                    'Maintain professional tone'
                ]
            });
        }

        // Check for ALL CAPS text
        const capsText = text.match(/\b[A-Z]{5,}\b/g) || [];
        if (capsText.length > 3) {
            issues.push({
                title: 'Excessive ALL CAPS Text',
                severity: 'info',
                description: `Found ${capsText.length} instances of ALL CAPS words. This can appear aggressive.`,
                location: page.url,
                suggestions: [
                    'Use normal capitalization',
                    'Reserve caps for acronyms only',
                    'Maintain professional presentation'
                ]
            });
        }

        // ============================================
        // CURRENCY & LOCATION MICRO-CHECKS
        // ============================================

        // Check for currency consistency
        const currencies = [];
        if (text.includes('$')) currencies.push('USD');
        if (text.includes('€')) currencies.push('EUR');
        if (text.includes('£')) currencies.push('GBP');
        if (text.includes('₹')) currencies.push('INR');
        if (text.includes('¥')) currencies.push('JPY/CNY');

        if (currencies.length > 1) {
            issues.push({
                title: 'Multiple Currencies Detected',
                severity: 'warning',
                description: `Found multiple currencies on the same page: ${currencies.join(', ')}. This may confuse customers.`,
                location: page.url,
                whyItMatters: 'GMC requires consistent currency that matches your target country. Mixed currencies cause confusion.',
                howToFix: [
                    'Use one consistent currency per market',
                    'If multi-currency, use a currency selector',
                    'Match currency to GMC feed currency setting'
                ]
            });
        }

        // ============================================
        // LEGAL COMPLIANCE MICRO-CHECKS
        // ============================================

        // Check for cookie consent
        if (pageIndex === 0) {
            const hasCookieNotice = html.includes('cookie') && (
                html.includes('consent') || html.includes('accept') || html.includes('agree')
            );

            if (!hasCookieNotice) {
                issues.push({
                    title: 'Cookie Consent Notice Not Detected',
                    severity: 'info',
                    description: 'No cookie consent banner was found. This may be required depending on your target regions.',
                    location: 'Homepage',
                    whyItMatters: 'GDPR and other privacy laws require cookie consent notices for EU and other regions.',
                    suggestions: [
                        'Add cookie consent banner for EU visitors',
                        'Required for GDPR compliance',
                        'Many free solutions available (CookieYes, Osano, etc.)'
                    ]
                });
            }
        }

        // Check for age restriction notice (if applicable)
        const ageRestricted = text.includes('21+') || text.includes('18+') ||
            text.includes('must be 21') || text.includes('must be 18') ||
            text.includes('adult') || text.includes('alcohol') ||
            text.includes('tobacco') || text.includes('vape');

        if (ageRestricted) {
            const hasAgeGate = html.includes('age verification') || html.includes('age gate') ||
                html.includes('verify your age') || html.includes('date of birth');

            if (!hasAgeGate) {
                issues.push({
                    title: 'Age-Restricted Products Without Verification',
                    severity: 'warning',
                    description: 'Age-restricted content detected without proper age verification.',
                    location: page.url,
                    whyItMatters: 'Age-restricted products require proper age gates. GMC has strict policies on age-restricted items.',
                    howToFix: [
                        'Implement age verification gate',
                        'Require date of birth entry',
                        'Check GMC policies for age-restricted products'
                    ]
                });
            }
        }
    });

    // ============================================
    // SITE-WIDE MICRO-CHECKS
    // ============================================

    // Check for consistent branding
    const combinedText = crawlResults.pages.map(p => extractText(parseHTML(p.html))).join(' ').toLowerCase();

    // Check for phone number format consistency
    const phonePatterns = combinedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
    const uniquePhones = [...new Set(phonePatterns)];

    if (uniquePhones.length > 2) {
        issues.push({
            title: 'Multiple Phone Numbers Displayed',
            severity: 'info',
            description: `Found ${uniquePhones.length} different phone number formats. Consider standardizing.`,
            location: 'Various pages',
            suggestions: [
                'Use consistent phone number format',
                'Display one main customer service number prominently',
                'Format: +1 (555) 123-4567'
            ]
        });
    }

    // Check for social media links
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    const combinedHtml = crawlResults.pages.map(p => p.html).join(' ').toLowerCase();
    const foundSocials = socialPlatforms.filter(s => combinedHtml.includes(s + '.com'));

    if (foundSocials.length === 0) {
        issues.push({
            title: 'No Social Media Links Found',
            severity: 'info',
            description: 'No social media profile links were detected on your website.',
            location: 'Footer',
            whyItMatters: 'Social media presence helps establish business legitimacy and builds customer trust.',
            suggestions: [
                'Add social media links to footer',
                'At minimum, include Facebook and Instagram',
                'Use official social media icons'
            ]
        });
    } else if (foundSocials.length < 3) {
        issues.push({
            title: 'Limited Social Media Presence',
            severity: 'info',
            description: `Only found links to: ${foundSocials.join(', ')}. Consider adding more platforms.`,
            location: 'Footer',
            suggestions: [
                'Add more social media profiles',
                'Popular platforms: Facebook, Instagram, Twitter, YouTube',
                'Helps establish brand presence'
            ]
        });
    } else {
        issues.push({
            title: 'Social Media Links Present',
            severity: 'pass',
            description: `Found links to ${foundSocials.length} social platforms: ${foundSocials.join(', ')}.`,
            location: 'Footer'
        });
    }

    // Check for newsletter/email signup
    const hasNewsletter = combinedHtml.includes('newsletter') || combinedHtml.includes('subscribe') ||
        combinedHtml.includes('email signup') || combinedHtml.includes('mailing list');

    if (hasNewsletter) {
        issues.push({
            title: 'Newsletter Signup Found',
            severity: 'pass',
            description: 'Your website has an email newsletter signup feature.',
            location: 'Various pages'
        });
    }

    // Check for live chat
    const hasLiveChat = combinedHtml.includes('live chat') || combinedHtml.includes('livechat') ||
        combinedHtml.includes('intercom') || combinedHtml.includes('zendesk') ||
        combinedHtml.includes('tidio') || combinedHtml.includes('drift') ||
        combinedHtml.includes('crisp') || combinedHtml.includes('freshchat');

    if (hasLiveChat) {
        issues.push({
            title: 'Live Chat Detected',
            severity: 'pass',
            description: 'Your website has live chat functionality for customer support.',
            location: 'Site-wide'
        });
    } else {
        issues.push({
            title: 'Consider Adding Live Chat',
            severity: 'info',
            description: 'No live chat widget detected. Live chat improves customer experience.',
            location: 'Site-wide',
            suggestions: [
                'Consider adding live chat support',
                'Popular options: Intercom, Zendesk, Tidio, Crisp',
                'Improves customer satisfaction and reduces abandonment'
            ]
        });
    }

    return {
        name: 'Micro Details',
        description: 'Fine-grained checks for minor issues that affect GMC approval',
        issues
    };
}
