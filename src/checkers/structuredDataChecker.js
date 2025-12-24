// Structured Data (Schema.org) Checker
// Validates JSON-LD product schema for GMC

import { parseHTML, extractStructuredData } from '../utils/parser';

export function checkStructuredData(crawlResults) {
    const issues = [];
    let hasProductSchema = false;
    let hasOrganizationSchema = false;
    let hasBreadcrumbSchema = false;
    let schemaIssues = [];

    // Analyze structured data from all pages
    crawlResults.pages.forEach(page => {
        const doc = parseHTML(page.html);
        const schemas = extractStructuredData(doc);

        schemas.forEach(schema => {
            // Handle @graph arrays
            const schemaItems = schema['@graph'] || [schema];

            schemaItems.forEach(item => {
                const type = item['@type'];

                if (type === 'Product' || type === 'product') {
                    hasProductSchema = true;

                    // Check required product fields
                    if (!item.name) {
                        schemaIssues.push({ field: 'name', url: page.url });
                    }
                    if (!item.image) {
                        schemaIssues.push({ field: 'image', url: page.url });
                    }
                    if (!item.offers && !item.Offers) {
                        schemaIssues.push({ field: 'offers/price', url: page.url });
                    } else {
                        const offers = item.offers || item.Offers;
                        const offer = Array.isArray(offers) ? offers[0] : offers;
                        if (!offer.price && !offer.lowPrice) {
                            schemaIssues.push({ field: 'price', url: page.url });
                        }
                        if (!offer.priceCurrency) {
                            schemaIssues.push({ field: 'priceCurrency', url: page.url });
                        }
                        if (!offer.availability) {
                            schemaIssues.push({ field: 'availability', url: page.url });
                        }
                    }
                    if (!item.description) {
                        schemaIssues.push({ field: 'description (recommended)', url: page.url, severity: 'info' });
                    }
                    if (!item.sku && !item.gtin && !item.gtin13 && !item.gtin12 && !item.mpn) {
                        schemaIssues.push({ field: 'identifier (sku/gtin/mpn)', url: page.url, severity: 'info' });
                    }
                }

                if (type === 'Organization' || type === 'LocalBusiness') {
                    hasOrganizationSchema = true;
                }

                if (type === 'BreadcrumbList') {
                    hasBreadcrumbSchema = true;
                }
            });
        });
    });

    // Product Schema
    if (hasProductSchema) {
        issues.push({
            title: 'Product Schema (JSON-LD) Found',
            severity: 'pass',
            description: 'Your website has Product structured data which helps Google understand your products.',
            location: 'Product pages'
        });

        // Report missing fields
        if (schemaIssues.length > 0) {
            const criticalFields = schemaIssues.filter(i => i.severity !== 'info');
            const infoFields = schemaIssues.filter(i => i.severity === 'info');

            if (criticalFields.length > 0) {
                const uniqueFields = [...new Set(criticalFields.map(i => i.field))];
                issues.push({
                    title: 'Product Schema Missing Required Fields',
                    severity: 'warning',
                    description: `Product schema is missing these important fields: ${uniqueFields.join(', ')}`,
                    location: 'Product pages',
                    whyItMatters: 'Complete product schema helps Google display rich results and improves Shopping ad quality. Missing required fields may affect ad performance.',
                    howToFix: [
                        'Ensure all Product schema includes: name, image, offers.price, offers.priceCurrency, offers.availability',
                        'Use Google\'s Rich Results Test to validate your schema',
                        'Match schema prices with displayed prices exactly',
                        'Use schema.org URLs for availability (e.g., https://schema.org/InStock)'
                    ]
                });
            }

            if (infoFields.length > 0) {
                const uniqueInfoFields = [...new Set(infoFields.map(i => i.field))];
                issues.push({
                    title: 'Product Schema Recommended Fields Missing',
                    severity: 'info',
                    description: `Consider adding these fields to improve schema: ${uniqueInfoFields.join(', ')}`,
                    location: 'Product pages',
                    suggestions: [
                        'Add description for better search context',
                        'Add SKU, GTIN, or MPN for product identification',
                        'Add brand for brand filtering',
                        'Add reviews/ratings if available'
                    ]
                });
            }
        }
    } else {
        issues.push({
            title: 'Product Schema (JSON-LD) Not Found',
            severity: 'critical',
            description: 'No Product structured data was detected on your website. This is highly recommended for GMC success.',
            location: 'Product pages',
            whyItMatters: 'Product structured data helps Google understand your product information and can lead to rich results in search. It improves ad quality and matches between your feed and website.',
            howToFix: [
                'Add JSON-LD Product schema to each product page',
                'Place the script in the <head> or end of <body>',
                'Include all required fields: name, image, offers',
                'Validate with Google Rich Results Test',
                'Ensure schema data matches visible page content'
            ],
            copyPasteCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Your Product Name",
  "image": [
    "https://yoursite.com/images/product-1.jpg",
    "https://yoursite.com/images/product-2.jpg"
  ],
  "description": "Detailed product description goes here...",
  "sku": "SKU-12345",
  "gtin13": "1234567890123",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://yoursite.com/product/example",
    "priceCurrency": "USD",
    "price": "49.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Your Store Name"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "89"
  }
}
</script>`,
            suggestions: [
                'Use your platform\'s built-in schema generation if available',
                'Consider schema plugins for Shopify/WooCommerce/etc.',
                'Test every product page with Rich Results Test',
                'Keep schema data synchronized with GMC feed'
            ]
        });
    }

    // Organization Schema
    if (hasOrganizationSchema) {
        issues.push({
            title: 'Organization Schema Found',
            severity: 'pass',
            description: 'Your website has Organization/LocalBusiness schema.',
            location: 'Homepage'
        });
    } else {
        issues.push({
            title: 'Organization Schema Recommended',
            severity: 'info',
            description: 'Consider adding Organization schema to establish business identity.',
            location: 'Homepage',
            whyItMatters: 'Organization schema helps Google understand your business identity and can improve Knowledge Panel presence.',
            copyPasteCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Store Name",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://facebook.com/yourstore",
    "https://twitter.com/yourstore",
    "https://instagram.com/yourstore"
  ]
}
</script>`,
            suggestions: [
                'Include your business logo URL',
                'Add social media profiles',
                'Include contact information',
                'Add for better brand presence in search'
            ]
        });
    }

    // Breadcrumb Schema
    if (hasBreadcrumbSchema) {
        issues.push({
            title: 'Breadcrumb Schema Found',
            severity: 'pass',
            description: 'Your website has Breadcrumb structured data for navigation.',
            location: 'Various pages'
        });
    } else {
        issues.push({
            title: 'Breadcrumb Schema Not Found',
            severity: 'info',
            description: 'Breadcrumb schema helps Google understand your site structure.',
            location: 'Category and product pages',
            copyPasteCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yoursite.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Category",
      "item": "https://yoursite.com/category"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Product Name",
      "item": "https://yoursite.com/category/product"
    }
  ]
}
</script>`,
            suggestions: [
                'Add breadcrumbs to product and category pages',
                'Helps with site navigation in search results',
                'Improves user experience and SEO'
            ]
        });
    }

    return {
        name: 'Structured Data',
        description: 'Schema.org markup for rich results and better ad matching',
        issues
    };
}
