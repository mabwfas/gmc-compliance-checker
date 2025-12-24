// Image Quality Checker
// Validates product images for GMC requirements

import { parseHTML, extractImages } from '../utils/parser';

export function checkImageQuality(crawlResults) {
    const issues = [];
    const allImages = [];

    // Collect all images
    crawlResults.pages.forEach(page => {
        const doc = parseHTML(page.html);
        const images = extractImages(doc).map(img => ({
            ...img,
            pageUrl: page.url
        }));
        allImages.push(...images);
    });

    // Filter to likely product images
    const productImages = allImages.filter(img =>
        img.src &&
        !img.src.includes('logo') &&
        !img.src.includes('icon') &&
        !img.src.includes('favicon') &&
        !img.src.includes('sprite') &&
        !img.src.includes('placeholder')
    );

    if (productImages.length === 0) {
        issues.push({
            title: 'No Product Images Detected',
            severity: 'critical',
            description: 'Could not find product images on your website. High-quality images are required for GMC.',
            location: 'All pages',
            whyItMatters: 'Google Merchant Center requires product images for all listings. Products without images will be disapproved.',
            howToFix: [
                'Add at least one high-quality image per product',
                'Use images at least 800x800 pixels',
                'Use JPEG, PNG, or WebP formats',
                'Ensure images are hosted on your domain or CDN'
            ]
        });
        return {
            name: 'Image Quality',
            description: 'Product image requirements for GMC',
            issues
        };
    }

    // Check alt tags
    const missingAlt = productImages.filter(img => !img.alt || img.alt.length < 5);
    if (missingAlt.length > 0) {
        const percent = Math.round((missingAlt.length / productImages.length) * 100);
        issues.push({
            title: `${missingAlt.length} Images Missing Alt Text`,
            severity: percent > 50 ? 'warning' : 'info',
            description: `${percent}% of product images are missing descriptive alt text. This affects accessibility and SEO.`,
            location: 'Various product pages',
            whyItMatters: 'Alt text helps Google understand image content and is used when images cannot be displayed. Good alt text improves accessibility and can affect product discoverability.',
            howToFix: [
                'Add descriptive alt text to every product image',
                'Include product name, brand, and key features',
                'Avoid generic text like "product image" or "photo"',
                'Keep alt text concise but descriptive (under 125 chars)'
            ],
            copyPasteCode: `<!-- Good alt text examples -->
<img src="product.jpg" alt="Nike Air Max 270 Men's Running Shoes - Black/White">

<img src="dress.jpg" alt="Summer Floral Maxi Dress - Blue with White Flowers - Size M">

<img src="headphones.jpg" alt="Sony WH-1000XM4 Wireless Noise-Canceling Headphones - Black">`,
            suggestions: [
                'Describe what is visually shown in the image',
                'Include color, size, and material when visible',
                'Different images of same product need unique alt text',
                'For lifestyle images, describe the scene and product'
            ]
        });
    } else {
        issues.push({
            title: 'All Images Have Alt Text',
            severity: 'pass',
            description: 'All detected product images have alt text attributes.',
            location: 'All pages'
        });
    }

    // Check for placeholder images
    const placeholderPatterns = ['placeholder', 'no-image', 'default-image', 'coming-soon', 'noimage'];
    const placeholders = productImages.filter(img =>
        placeholderPatterns.some(p => img.src.toLowerCase().includes(p)) ||
        (img.alt && placeholderPatterns.some(p => img.alt.toLowerCase().includes(p)))
    );

    if (placeholders.length > 0) {
        issues.push({
            title: 'Placeholder Images Detected',
            severity: 'critical',
            description: `Found ${placeholders.length} placeholder or "no image" images. Products must have actual photos.`,
            location: 'Various pages',
            whyItMatters: 'Google requires actual product images, not placeholders. Products with placeholder images will be disapproved and can affect account standing.',
            howToFix: [
                'Replace all placeholder images with actual product photos',
                'Remove products from your feed if images are unavailable',
                'Use temporary high-quality stock photos if needed',
                'Never show "Image Coming Soon" placeholders'
            ],
            suggestions: [
                'Set up alerts when products lack images',
                'Consider professional product photography',
                'Use manufacturer-provided images as backup',
                'Hide products without images from Shopping feed'
            ]
        });
    } else {
        issues.push({
            title: 'No Placeholder Images Detected',
            severity: 'pass',
            description: 'No obvious placeholder images were found.',
            location: 'All pages'
        });
    }

    // Check for watermarks (common patterns)
    const watermarkPatterns = ['watermark', 'sample', 'preview', 'demo'];
    const watermarkedImages = productImages.filter(img =>
        watermarkPatterns.some(p => img.src.toLowerCase().includes(p)) ||
        (img.alt && watermarkPatterns.some(p => img.alt.toLowerCase().includes(p)))
    );

    if (watermarkedImages.length > 0) {
        issues.push({
            title: 'Potentially Watermarked Images',
            severity: 'warning',
            description: `Found ${watermarkedImages.length} images that may contain watermarks or sample overlays.`,
            location: 'Various pages',
            whyItMatters: 'Google prohibits promotional overlays, watermarks, and text on product images. This includes logos, "SALE" banners, and website URLs on product photos.',
            howToFix: [
                'Remove watermarks from all product images',
                'Do not add promotional text to product photos',
                'Remove "SALE" or discount badges from images',
                'Use clean, professional product photography'
            ],
            suggestions: [
                'Request clean images from suppliers/manufacturers',
                'Use image editing tools to remove watermarks',
                'Add promotional badges via HTML/CSS, not on images',
                'Keep product images focused on the product only'
            ]
        });
    }

    // General image recommendations
    issues.push({
        title: 'Image Size Recommendations',
        severity: 'info',
        description: 'Ensure your product images meet Google\'s size requirements.',
        location: 'All product images',
        whyItMatters: 'Google recommends images of at least 800x800 pixels for best results. Larger images perform better in Shopping ads.',
        howToFix: [
            'Use images at least 800x800 pixels',
            'For apparel, use at least 250x250 pixels minimum',
            'Maximum file size is 16MB',
            'Supported formats: JPEG, PNG, WebP, GIF (no animation)'
        ],
        copyPasteCode: `<!-- Recommended image HTML -->
<img 
  src="/images/product-large.jpg" 
  alt="Product Description" 
  width="800" 
  height="800"
  loading="lazy"
>

<!-- For responsive images -->
<img 
  src="/images/product-400.jpg"
  srcset="/images/product-400.jpg 400w,
          /images/product-800.jpg 800w,
          /images/product-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Product Description"
>`,
        suggestions: [
            'Use square images (1:1 ratio) for consistency',
            'Use white or neutral backgrounds for main image',
            'Include multiple angles of each product',
            'Optimize images for web (compress without quality loss)'
        ]
    });

    return {
        name: 'Image Quality',
        description: 'Product image requirements for GMC',
        issues
    };
}
