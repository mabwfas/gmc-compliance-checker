// Content Quality Checker
// Validates content against GMC policies

import { parseHTML, extractText } from '../utils/parser';

export function checkContentQuality(crawlResults) {
    const issues = [];

    // Analyze content from all pages
    const allContent = crawlResults.pages.map(page => {
        const doc = parseHTML(page.html);
        return {
            url: page.url,
            text: extractText(doc).toLowerCase()
        };
    });

    const combinedText = allContent.map(c => c.text).join(' ');

    // Check for promotional/misleading terms
    const misleadingTerms = [
        { term: 'guaranteed weight loss', category: 'health claims' },
        { term: 'miracle cure', category: 'health claims' },
        { term: 'get rich quick', category: 'financial claims' },
        { term: 'make money fast', category: 'financial claims' },
        { term: '100% guaranteed', category: 'unrealistic guarantees' },
        { term: 'risk free', category: 'unrealistic guarantees' },
        { term: 'act now', category: 'pressure tactics' },
        { term: 'limited time only', category: 'pressure tactics' },
        { term: 'once in a lifetime', category: 'pressure tactics' },
        { term: 'click here', category: 'generic CTAs' }
    ];

    const foundMisleading = misleadingTerms.filter(item => combinedText.includes(item.term));

    if (foundMisleading.length > 0) {
        const categories = [...new Set(foundMisleading.map(f => f.category))];
        issues.push({
            title: 'Potentially Misleading Content Detected',
            severity: 'warning',
            description: `Found ${foundMisleading.length} phrases that may be flagged by GMC: ${foundMisleading.map(f => `"${f.term}"`).join(', ')}`,
            location: 'Various pages',
            whyItMatters: 'Google prohibits misleading claims, pressure tactics, and unrealistic promises. Content that makes exaggerated claims can lead to product or account suspension.',
            howToFix: [
                'Remove or rephrase misleading language',
                'Avoid absolute guarantees you cannot prove',
                'Replace pressure tactics with genuine urgency',
                'Use factual, verifiable product claims',
                `Review content in these categories: ${categories.join(', ')}`
            ],
            suggestions: [
                'Focus on factual product benefits',
                'Use customer testimonials with disclaimers',
                'Replace "guaranteed" with "designed to help"',
                'Avoid before/after comparisons for health products'
            ]
        });
    } else {
        issues.push({
            title: 'No Obvious Misleading Content',
            severity: 'pass',
            description: 'No obviously misleading phrases were detected in your content.',
            location: 'All pages'
        });
    }

    // Check for prohibited product indicators
    const prohibitedIndicators = [
        { term: 'counterfeit', category: 'Counterfeit goods' },
        { term: 'replica', category: 'Counterfeit goods' },
        { term: 'fake designer', category: 'Counterfeit goods' },
        { term: 'ammunition', category: 'Weapons' },
        { term: 'explosives', category: 'Weapons' },
        { term: 'recreational drugs', category: 'Drugs' },
        { term: 'steroids for sale', category: 'Drugs' },
        { term: 'tobacco products', category: 'Tobacco' },
        { term: 'cigarettes for sale', category: 'Tobacco' }
    ];

    const foundProhibited = prohibitedIndicators.filter(item => combinedText.includes(item.term));

    if (foundProhibited.length > 0) {
        issues.push({
            title: 'Potentially Prohibited Products Detected',
            severity: 'critical',
            description: `Found terms that may indicate prohibited products: ${foundProhibited.map(f => `"${f.term}" (${f.category})`).join(', ')}`,
            location: 'Various pages',
            whyItMatters: 'Google has a list of prohibited products that cannot be advertised on Shopping. Attempting to sell these will result in immediate account suspension.',
            howToFix: [
                'Remove any prohibited products from your store',
                'If these terms are used in a different context, add clarifying text',
                'Review Google\'s Shopping ads policies for prohibited items',
                'Consider if your products fall into restricted categories'
            ],
            suggestions: [
                'Review Google Ads policies for full prohibited list',
                'Some categories like alcohol require approval',
                'Health products have specific requirements',
                'Contact GMC support if unsure about a product'
            ]
        });
    }

    // Check content length/quality
    const homePage = allContent[0];
    if (homePage && homePage.text.length < 500) {
        issues.push({
            title: 'Homepage Has Thin Content',
            severity: 'warning',
            description: 'Your homepage appears to have very little text content. Rich content helps with SEO and customer understanding.',
            location: crawlResults.baseUrl,
            whyItMatters: 'Thin content websites may be flagged as low-quality by Google. Having substantive content on your homepage helps establish legitimacy.',
            howToFix: [
                'Add descriptive text about your business',
                'Include featured products with descriptions',
                'Add company story or "About Us" section',
                'Include customer testimonials or reviews'
            ],
            suggestions: [
                'Aim for at least 500-1000 words on homepage',
                'Use headers to organize content',
                'Include your unique value proposition',
                'Add FAQs or helpful information'
            ]
        });
    }

    // Check for proper language
    issues.push({
        title: 'Language Consistency',
        severity: 'info',
        description: 'Ensure your website uses consistent language that matches your GMC target country.',
        location: 'All pages',
        whyItMatters: 'Your website language must match the language settings in Google Merchant Center. Mismatches can cause products to be disapproved.',
        howToFix: [
            'Use a single, consistent language across all pages',
            'Match your website language to your GMC feed language',
            'If multilingual, use proper hreflang tags',
            'Avoid mixing languages within product descriptions'
        ],
        copyPasteCode: `<!-- Add to <head> for English -->
<html lang="en">

<!-- For multilingual sites, add hreflang -->
<link rel="alternate" hreflang="en" href="https://yoursite.com/" />
<link rel="alternate" hreflang="es" href="https://yoursite.com/es/" />`,
        suggestions: [
            'Proofread content for grammar and spelling',
            'Use a native speaker for translations',
            'Keep product descriptions professional',
            'Avoid slang in formal content'
        ]
    });

    // Check for About Us / Company info
    const hasAboutPage = allContent.some(c =>
        c.url.toLowerCase().includes('about') ||
        c.text.includes('about us') ||
        c.text.includes('our story') ||
        c.text.includes('who we are')
    );

    if (hasAboutPage) {
        issues.push({
            title: 'About Us Information Found',
            severity: 'pass',
            description: 'Your website has an About Us section or page.',
            location: 'About page'
        });
    } else {
        issues.push({
            title: 'About Us / Company Information Missing',
            severity: 'warning',
            description: 'Could not find an About Us page or company information. This helps establish legitimacy.',
            location: 'Website',
            whyItMatters: 'Having clear information about your business helps Google verify you are a legitimate merchant. It also builds customer trust.',
            howToFix: [
                'Create an About Us page',
                'Include your company history and mission',
                'Add founder or team information',
                'Link to it from your main navigation'
            ],
            suggestions: [
                'Include photos of your team or workspace',
                'Mention years in business',
                'Add any certifications or awards',
                'Share your company values'
            ]
        });
    }

    return {
        name: 'Content Quality',
        description: 'Content policy compliance and quality checks',
        issues
    };
}
