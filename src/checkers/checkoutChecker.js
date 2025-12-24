// Checkout Experience Checker
// Validates checkout and cart functionality

import { parseHTML, extractText, extractLinks } from '../utils/parser';

export function checkCheckoutExperience(crawlResults) {
    const issues = [];
    const combinedText = crawlResults.pages.map(p => extractText(parseHTML(p.html))).join(' ').toLowerCase();
    const combinedHtml = crawlResults.pages.map(p => p.html).join(' ').toLowerCase();

    // Check for Add to Cart functionality
    const hasAddToCart = combinedHtml.includes('add to cart') ||
        combinedHtml.includes('addtocart') ||
        combinedHtml.includes('add-to-cart') ||
        combinedHtml.includes('buy now') ||
        combinedHtml.includes('buynow');

    if (hasAddToCart) {
        issues.push({
            title: 'Add to Cart Functionality Detected',
            severity: 'pass',
            description: 'Your website has Add to Cart or Buy Now buttons.',
            location: 'Product pages'
        });
    } else {
        issues.push({
            title: 'Add to Cart Button Not Detected',
            severity: 'critical',
            description: 'Could not find "Add to Cart" or "Buy Now" buttons on your website.',
            location: 'Product pages',
            whyItMatters: 'Google requires that customers can actually purchase products from your website. Products must be directly purchasable with a functional cart and checkout.',
            howToFix: [
                'Add visible "Add to Cart" buttons on all product pages',
                'Ensure the button text is clear ("Add to Cart", "Buy Now")',
                'Make buttons prominent and easy to find',
                'Test that clicking adds products to cart correctly'
            ],
            copyPasteCode: `<button class="add-to-cart-btn" type="button" onclick="addToCart(productId)">
  🛒 Add to Cart
</button>

<!-- Or a simple form -->
<form action="/cart/add" method="post">
  <input type="hidden" name="product_id" value="123">
  <input type="number" name="quantity" value="1" min="1">
  <button type="submit" class="add-to-cart-btn">Add to Cart</button>
</form>`,
            suggestions: [
                'Make the Add to Cart button a contrasting color',
                'Show cart count in the header after adding',
                'Consider "Buy Now" for direct checkout option',
                'Add quantity selector near the button'
            ]
        });
    }

    // Check for payment methods visibility
    const paymentMethods = ['visa', 'mastercard', 'paypal', 'amex', 'american express',
        'credit card', 'debit card', 'apple pay', 'google pay',
        'stripe', 'payment', 'secure payment'];

    const hasPaymentInfo = paymentMethods.some(pm => combinedText.includes(pm));

    if (hasPaymentInfo) {
        issues.push({
            title: 'Payment Methods Visible',
            severity: 'pass',
            description: 'Your website mentions payment methods available.',
            location: 'Footer or checkout'
        });
    } else {
        issues.push({
            title: 'Payment Methods Not Clearly Displayed',
            severity: 'warning',
            description: 'Could not find visible payment method information. Customers should know how they can pay.',
            location: 'Footer or checkout page',
            whyItMatters: 'Google requires at least one conventional payment method (credit/debit card). Displaying accepted payment methods builds customer trust.',
            howToFix: [
                'Add payment method icons to your footer',
                'Display accepted cards on the checkout page',
                'Mention payment options on product pages',
                'Use recognizable payment icons (Visa, MC, PayPal)'
            ],
            copyPasteCode: `<!-- Add to your footer -->
<div class="payment-methods">
  <span>We accept:</span>
  <img src="/icons/visa.svg" alt="Visa" width="40">
  <img src="/icons/mastercard.svg" alt="Mastercard" width="40">
  <img src="/icons/amex.svg" alt="American Express" width="40">
  <img src="/icons/paypal.svg" alt="PayPal" width="40">
</div>

<!-- Or text version -->
<p>Secure payments via Visa, Mastercard, American Express & PayPal</p>`,
            suggestions: [
                'Use official payment brand logos',
                'Add "Secure Checkout" messaging',
                'Display any payment security certifications',
                'Consider adding "Buy Now Pay Later" options'
            ]
        });
    }

    // Check for secure checkout signals
    const securityTerms = ['secure checkout', 'ssl', 'encrypted', 'safe payment',
        'secure payment', '256-bit', 'protected', 'security'];

    const hasSecurityMessaging = securityTerms.some(term => combinedText.includes(term));

    if (hasSecurityMessaging) {
        issues.push({
            title: 'Security Messaging Present',
            severity: 'pass',
            description: 'Your website has security-related messaging to build trust.',
            location: 'Checkout or footer'
        });
    } else {
        issues.push({
            title: 'Security Trust Signals Missing',
            severity: 'warning',
            description: 'No security messaging was found. Customers need reassurance that checkout is safe.',
            location: 'Throughout website',
            whyItMatters: 'Customers are more likely to complete purchases when they feel secure. Trust signals reduce cart abandonment and can improve GMC performance.',
            howToFix: [
                'Add "Secure Checkout" messaging near buy buttons',
                'Display SSL/security badges',
                'Mention data encryption',
                'Add trust badges from payment providers'
            ],
            copyPasteCode: `<!-- Security badge section -->
<div class="trust-badges">
  <div class="badge">
    🔒 Secure Checkout
  </div>
  <div class="badge">
    🛡️ 256-bit SSL Encryption
  </div>
  <div class="badge">
    ✓ Safe & Protected Payments
  </div>
</div>`,
            suggestions: [
                'Add SSL seal from your certificate provider',
                'Display Norton, McAfee, or similar trust seals',
                'Show money-back guarantee prominently',
                'Add customer review/rating badges'
            ]
        });
    }

    // Check for cart/checkout links
    const hasCartLink = combinedHtml.includes('href="/cart') ||
        combinedHtml.includes('href="/checkout') ||
        combinedHtml.includes('view cart') ||
        combinedHtml.includes('shopping cart');

    if (hasCartLink) {
        issues.push({
            title: 'Cart/Checkout Links Found',
            severity: 'pass',
            description: 'Your website has cart and checkout links accessible.',
            location: 'Navigation'
        });
    } else {
        issues.push({
            title: 'Cart Link Not Visible in Navigation',
            severity: 'warning',
            description: 'Could not find a clear cart or checkout link in the website navigation.',
            location: 'Header/Navigation',
            whyItMatters: 'Customers must be able to easily find their cart and proceed to checkout. A hidden or missing cart link creates friction.',
            howToFix: [
                'Add a cart icon to your header navigation',
                'Show cart item count on the icon',
                'Link to /cart or /checkout page',
                'Make the cart always visible, not just on hover'
            ],
            copyPasteCode: `<!-- Add to your header -->
<a href="/cart" class="cart-link">
  🛒 Cart (<span class="cart-count">0</span>)
</a>`,
            suggestions: [
                'Use a recognizable cart icon (shopping bag or cart)',
                'Show real-time cart count updates',
                'Consider mini-cart popup on hover',
                'Highlight cart when items are added'
            ]
        });
    }

    return {
        name: 'Checkout Experience',
        description: 'Cart and checkout functionality requirements',
        issues
    };
}
