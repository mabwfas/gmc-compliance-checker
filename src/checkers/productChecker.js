// Product Pages Checker
// Validates product page requirements for GMC

import { parseHTML, extractImages, extractText, extractStructuredData, extractMetaTags } from '../utils/parser';

export function checkProductPages(crawlResults) {
    const issues = [];

    // Try to identify product pages
    const productPages = crawlResults.pages.filter(page => {
        const url = page.url.toLowerCase();
        const html = page.html.toLowerCase();
        return url.includes('product') ||
            url.includes('/p/') ||
            url.includes('/item/') ||
            html.includes('add to cart') ||
            html.includes('add-to-cart') ||
            html.includes('buy now') ||
            html.includes('addtocart');
    });

    if (productPages.length === 0) {
        issues.push({
            title: 'No Product Pages Detected',
            severity: 'info',
            description: 'Could not identify product pages on your website. This check requires pages with "Add to Cart" functionality.',
            location: 'Website',
            whyItMatters: 'Product pages are the core of your GMC feed. Each product must have proper titles, descriptions, prices, and images.',
            suggestions: [
                'Ensure your product URLs contain identifiable patterns like /product/ or /item/',
                'Make sure "Add to Cart" buttons are present on product pages',
                'Product pages should have clear product titles and prices'
            ]
        });
        return {
            name: 'Product Pages',
            description: 'Product listing requirements for GMC approval',
            issues
        };
    }

    // Analyze each product page
    productPages.forEach((page, index) => {
        const doc = parseHTML(page.html);
        const text = extractText(doc);
        const images = extractImages(doc);
        const schemas = extractStructuredData(doc);
        const metas = extractMetaTags(doc);

        // Check product title
        const title = doc.querySelector('h1')?.textContent?.trim() || '';
        if (!title || title.length < 10) {
            issues.push({
                title: 'Product Title Missing or Too Short',
                severity: 'critical',
                description: `Product page ${index + 1} has a missing or very short title. Product titles should be clear and descriptive.`,
                location: page.url,
                whyItMatters: 'Google requires clear, descriptive product titles. Titles that are too short, vague, or missing will cause product disapprovals.',
                howToFix: [
                    'Add a clear H1 title that describes the product',
                    'Include brand name, product type, and key attributes',
                    'Keep titles between 50-150 characters',
                    'Avoid excessive punctuation or all caps'
                ],
                copyPasteCode: `<h1>Brand Name - Product Type - Key Feature - Size/Color</h1>

<!-- Example: -->
<h1>Nike Air Max 270 - Men's Running Shoes - Black/White - Size 10</h1>`,
                suggestions: [
                    'Include brand name at the beginning',
                    'Add model number if applicable',
                    'Include color and size variants',
                    'Use natural language, not keyword stuffing'
                ]
            });
        } else {
            issues.push({
                title: 'Product Title Present',
                severity: 'pass',
                description: `Product page has a descriptive title: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`,
                location: page.url
            });
        }

        // Check product description
        const descriptionLength = text.length;
        if (descriptionLength < 500) {
            issues.push({
                title: 'Product Description Too Short',
                severity: 'warning',
                description: 'Product description appears thin. Google recommends at least 500 characters for product descriptions.',
                location: page.url,
                whyItMatters: 'Detailed product descriptions help Google understand your product and improve ad quality. Thin content may result in lower ad rankings or disapprovals.',
                howToFix: [
                    'Write detailed product descriptions (500+ characters)',
                    'Include product features and benefits',
                    'Add material, dimensions, and specifications',
                    'Use natural language, not bullet points only'
                ],
                suggestions: [
                    'Describe what makes this product unique',
                    'Include use cases and scenarios',
                    'Add care instructions if applicable',
                    'Mention warranty or guarantees'
                ]
            });
        }

        // Check for price display
        const hasPrice = text.includes('$') ||
            text.includes('₹') ||
            text.includes('€') ||
            text.includes('£') ||
            /\d+\.\d{2}/.test(text) ||
            doc.querySelector('[class*="price"]') !== null;

        if (!hasPrice) {
            issues.push({
                title: 'Price Not Visible',
                severity: 'critical',
                description: 'No visible price was detected on this product page. Prices must be clearly displayed.',
                location: page.url,
                whyItMatters: 'Google requires accurate, visible prices on product pages. The price on your website MUST match the price in your GMC feed exactly.',
                howToFix: [
                    'Display the price prominently near the product title',
                    'Include the currency symbol',
                    'Show sale prices alongside original prices if applicable',
                    'Ensure prices match your GMC product feed'
                ],
                copyPasteCode: `<div class="product-price">
  <span class="current-price">$49.99</span>
  <!-- If on sale, show original price -->
  <span class="original-price" style="text-decoration: line-through;">$69.99</span>
  <span class="sale-badge">Save 29%</span>
</div>`,
                suggestions: [
                    'Use structured data to mark up prices',
                    'Include tax information if required for your region',
                    'Show price per unit for bulk items',
                    'Display "Free Shipping" if applicable'
                ]
            });
        } else {
            issues.push({
                title: 'Price Displayed',
                severity: 'pass',
                description: 'Price is visible on the product page.',
                location: page.url
            });
        }

        // Check for product images
        const productImages = images.filter(img =>
            img.src &&
            !img.src.includes('logo') &&
            !img.src.includes('icon') &&
            !img.src.includes('badge')
        );

        if (productImages.length === 0) {
            issues.push({
                title: 'Product Images Missing',
                severity: 'critical',
                description: 'No product images were detected on this page. High-quality images are essential.',
                location: page.url,
                whyItMatters: 'Google requires high-quality product images. Products without images will be disapproved. Images must be clear, non-watermarked, and accurately represent the product.',
                howToFix: [
                    'Add at least one high-quality product image',
                    'Use images at least 800x800 pixels',
                    'Show the actual product, not placeholders',
                    'Remove watermarks and promotional overlays'
                ],
                copyPasteCode: `<div class="product-images">
  <img 
    src="/images/product-main.jpg" 
    alt="Product Name - Front View" 
    width="800" 
    height="800"
  >
  <img 
    src="/images/product-side.jpg" 
    alt="Product Name - Side View" 
    width="800" 
    height="800"
  >
</div>`,
                suggestions: [
                    'Include multiple angles of the product',
                    'Add lifestyle images showing product in use',
                    'Use a white or neutral background for main image',
                    'Consider 360-degree view or video'
                ]
            });
        }

        // Check image alt tags
        const imagesWithoutAlt = productImages.filter(img => !img.alt || img.alt.length < 5);
        if (imagesWithoutAlt.length > 0) {
            issues.push({
                title: 'Product Images Missing Alt Text',
                severity: 'warning',
                description: `${imagesWithoutAlt.length} product image(s) are missing descriptive alt text.`,
                location: page.url,
                whyItMatters: 'Alt text helps Google understand image content and is important for accessibility. Missing alt text can affect SEO and GMC acceptance.',
                howToFix: [
                    'Add descriptive alt text to all product images',
                    'Include product name and key features in alt text',
                    'Avoid generic alt text like "image" or "photo"',
                    'Keep alt text under 125 characters'
                ],
                copyPasteCode: `<img 
  src="product.jpg" 
  alt="Nike Air Max 270 Running Shoes in Black - Men's Size 10"
>`,
                suggestions: [
                    'Describe what is shown in the image',
                    'Include color, size, and material if visible',
                    'Don\'t start with "Image of" or "Picture of"',
                    'Make alt text unique for each image'
                ]
            });
        }

        // Check for availability status
        const hasAvailability = text.toLowerCase().includes('in stock') ||
            text.toLowerCase().includes('out of stock') ||
            text.toLowerCase().includes('available') ||
            text.toLowerCase().includes('ships in') ||
            text.toLowerCase().includes('add to cart');

        if (!hasAvailability) {
            issues.push({
                title: 'Stock/Availability Status Not Clear',
                severity: 'warning',
                description: 'Product availability status (In Stock/Out of Stock) is not clearly displayed.',
                location: page.url,
                whyItMatters: 'GMC requires accurate availability information. The availability in your feed must match your website. Selling out-of-stock items leads to account suspension.',
                howToFix: [
                    'Display "In Stock" or "Out of Stock" clearly',
                    'Disable purchase button for unavailable items',
                    'Show estimated restock dates if out of stock',
                    'Keep availability in sync with your GMC feed'
                ],
                copyPasteCode: `<!-- In Stock -->
<span class="availability in-stock">
  ✓ In Stock - Ships within 1-2 business days
</span>

<!-- Out of Stock -->
<span class="availability out-of-stock">
  ✗ Out of Stock - Expected back on June 15th
</span>`,
                suggestions: [
                    'Show exact stock quantities for low stock items',
                    'Add "Notify Me" option for out-of-stock items',
                    'Update inventory in real-time',
                    'Consider showing warehouse location for faster shipping estimates'
                ]
            });
        }
    });

    return {
        name: 'Product Pages',
        description: 'Product listing requirements for GMC approval',
        issues
    };
}
