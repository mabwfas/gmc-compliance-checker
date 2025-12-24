// Required Policies Checker
// Checks for Privacy Policy, Return Policy, Shipping Policy, Terms of Service, Contact Info

import { parseHTML, extractLinks, extractText, findText } from '../utils/parser';

const POLICY_PATTERNS = {
    privacy: ['privacy policy', 'privacy', 'data protection', 'data policy', 'personal information'],
    returns: ['return policy', 'refund policy', 'returns', 'refunds', 'return & refund', 'money back', 'exchange policy'],
    shipping: ['shipping policy', 'shipping', 'delivery policy', 'delivery', 'shipping information', 'delivery info'],
    terms: ['terms of service', 'terms and conditions', 'terms & conditions', 'tos', 'terms of use', 'user agreement']
};

const CONTACT_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)[\w\s,]*\d{5}/gi
};

export function checkPolicies(crawlResults) {
    const issues = [];
    const allLinks = [];
    const allText = [];

    // Gather all links and text from all pages
    crawlResults.pages.forEach(page => {
        const doc = parseHTML(page.html);
        const links = extractLinks(doc);
        const text = extractText(doc);
        allLinks.push(...links);
        allText.push(text);
    });

    const combinedText = allText.join(' ').toLowerCase();
    const linkTexts = allLinks.map(l => l.text.toLowerCase());
    const linkHrefs = allLinks.map(l => l.href.toLowerCase());

    // Check Privacy Policy
    const hasPrivacyLink = linkTexts.some(t => POLICY_PATTERNS.privacy.some(p => t.includes(p))) ||
        linkHrefs.some(h => POLICY_PATTERNS.privacy.some(p => h.includes(p.replace(' ', '-'))));

    if (hasPrivacyLink) {
        issues.push({
            title: 'Privacy Policy Found',
            severity: 'pass',
            description: 'Your website has a Privacy Policy page accessible from the navigation.',
            whyItMatters: 'Google requires merchants to have a clear privacy policy describing how customer data is collected, stored, and used.',
            location: 'Navigation/Footer'
        });
    } else {
        issues.push({
            title: 'Privacy Policy Missing or Not Visible',
            severity: 'critical',
            description: 'No Privacy Policy link was found in your website navigation or footer. This is a mandatory requirement for GMC approval.',
            location: 'Website footer/navigation',
            whyItMatters: 'Google Merchant Center REQUIRES a privacy policy that clearly describes how you collect, use, and protect customer data. Without this, your account will be suspended.',
            howToFix: [
                'Create a dedicated Privacy Policy page (e.g., /privacy-policy)',
                'Include details about what data you collect (name, email, address, payment info)',
                'Explain how data is stored and protected',
                'Describe if/how data is shared with third parties',
                'Add a link to this page in your website footer',
                'Make sure the link text contains "Privacy Policy"'
            ],
            copyPasteCode: `<!-- Add this to your footer -->
<a href="/privacy-policy">Privacy Policy</a>

<!-- Or for a complete footer -->
<footer>
  <div class="footer-links">
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="/terms-of-service">Terms of Service</a>
    <a href="/shipping-policy">Shipping Policy</a>
    <a href="/return-policy">Return Policy</a>
    <a href="/contact">Contact Us</a>
  </div>
</footer>`,
            suggestions: [
                'Use a privacy policy generator tool to create a compliant policy',
                'Consult with a legal professional for your specific business needs',
                'Include a last updated date on your privacy policy page',
                'Consider adding a cookie consent banner'
            ]
        });
    }

    // Check Return/Refund Policy
    const hasReturnsLink = linkTexts.some(t => POLICY_PATTERNS.returns.some(p => t.includes(p))) ||
        linkHrefs.some(h => POLICY_PATTERNS.returns.some(p => h.includes(p.replace(' ', '-'))));

    if (hasReturnsLink) {
        issues.push({
            title: 'Return/Refund Policy Found',
            severity: 'pass',
            description: 'Your website has a Return/Refund Policy page accessible from the navigation.',
            whyItMatters: 'A clear return policy builds customer trust and is required by GMC.',
            location: 'Navigation/Footer'
        });
    } else {
        issues.push({
            title: 'Return/Refund Policy Missing or Not Visible',
            severity: 'critical',
            description: 'No Return or Refund Policy link was found. Customers must know your return process before purchase.',
            location: 'Website footer/navigation',
            whyItMatters: 'Google requires a clear return policy explaining the return process, eligibility, timeframe, and how refunds are processed. This must also be included in your product feed.',
            howToFix: [
                'Create a Return/Refund Policy page (e.g., /return-policy)',
                'Clearly state the return window (e.g., 30 days from purchase)',
                'Explain eligible items for return (condition, exceptions)',
                'Describe the refund process (full refund, store credit, exchange)',
                'Include who pays for return shipping',
                'Add contact information for returns questions'
            ],
            copyPasteCode: `<!-- Add this to your footer -->
<a href="/return-policy">Return & Refund Policy</a>

<!-- Sample Return Policy Page Content -->
<h1>Return & Refund Policy</h1>
<p>Last updated: ${new Date().toLocaleDateString()}</p>

<h2>Return Window</h2>
<p>You have 30 days from the date of purchase to return your item 
for a full refund.</p>

<h2>Eligibility</h2>
<ul>
  <li>Items must be unused and in original packaging</li>
  <li>Items must have original tags attached</li>
  <li>Proof of purchase is required</li>
</ul>

<h2>How to Return</h2>
<ol>
  <li>Contact us at returns@yourstore.com</li>
  <li>Pack the item securely in original packaging</li>
  <li>Ship to our returns address</li>
</ol>

<h2>Refunds</h2>
<p>Refunds will be processed within 5-7 business days after 
we receive your return.</p>`,
            suggestions: [
                'Offer free returns if possible - it increases conversion rates',
                'Consider offering exchanges as an alternative to refunds',
                'Make the return process as simple as possible',
                'Add this policy to your product pages near the buy button'
            ]
        });
    }

    // Check Shipping Policy
    const hasShippingLink = linkTexts.some(t => POLICY_PATTERNS.shipping.some(p => t.includes(p))) ||
        linkHrefs.some(h => POLICY_PATTERNS.shipping.some(p => h.includes(p.replace(' ', '-'))));

    if (hasShippingLink) {
        issues.push({
            title: 'Shipping Policy Found',
            severity: 'pass',
            description: 'Your website has a Shipping Policy page accessible from the navigation.',
            whyItMatters: 'Clear shipping information helps customers understand delivery expectations.',
            location: 'Navigation/Footer'
        });
    } else {
        issues.push({
            title: 'Shipping Policy Missing or Not Visible',
            severity: 'critical',
            description: 'No Shipping Policy or shipping information page was found. Customers need to know shipping costs and timeframes.',
            location: 'Website footer/navigation',
            whyItMatters: 'Google Merchant Center requires accurate shipping information. Mismatched or missing shipping details can lead to product disapprovals or account suspension.',
            howToFix: [
                'Create a Shipping Policy page (e.g., /shipping-policy)',
                'List shipping costs for different regions/countries',
                'Include estimated delivery timeframes',
                'Mention available shipping carriers',
                'Explain any free shipping thresholds',
                'Add tracking information policy'
            ],
            copyPasteCode: `<!-- Add this to your footer -->
<a href="/shipping-policy">Shipping Information</a>

<!-- Sample Shipping Policy Content -->
<h1>Shipping Policy</h1>

<h2>Shipping Rates</h2>
<table>
  <tr>
    <th>Region</th>
    <th>Standard (5-7 days)</th>
    <th>Express (2-3 days)</th>
  </tr>
  <tr>
    <td>Continental US</td>
    <td>$5.99</td>
    <td>$12.99</td>
  </tr>
  <tr>
    <td>Alaska & Hawaii</td>
    <td>$12.99</td>
    <td>$24.99</td>
  </tr>
</table>

<h2>Free Shipping</h2>
<p>Free standard shipping on all orders over $50!</p>

<h2>Processing Time</h2>
<p>Orders are processed within 1-2 business days.</p>

<h2>Tracking</h2>
<p>You will receive tracking information via email 
once your order ships.</p>`,
            suggestions: [
                'Offer free shipping threshold to increase average order value',
                'Display shipping estimates on product pages',
                'Consider offering expedited shipping options',
                'Clearly state if you ship internationally'
            ]
        });
    }

    // Check Terms of Service
    const hasTermsLink = linkTexts.some(t => POLICY_PATTERNS.terms.some(p => t.includes(p))) ||
        linkHrefs.some(h => POLICY_PATTERNS.terms.some(p => h.includes(p.replace(' ', '-'))));

    if (hasTermsLink) {
        issues.push({
            title: 'Terms of Service Found',
            severity: 'pass',
            description: 'Your website has a Terms of Service page.',
            whyItMatters: 'Terms of Service protect your business and set expectations for customers.',
            location: 'Navigation/Footer'
        });
    } else {
        issues.push({
            title: 'Terms of Service Not Found',
            severity: 'warning',
            description: 'No Terms of Service link was found. While not always required, having clear terms protects your business.',
            location: 'Website footer/navigation',
            whyItMatters: 'Terms of Service outline the rules for using your website, order processing, and disclaimers. They provide legal protection for your business.',
            howToFix: [
                'Create a Terms of Service page (e.g., /terms-of-service)',
                'Include website usage rules',
                'Add order processing terms',
                'Describe intellectual property rights',
                'Add limitation of liability clauses',
                'Link to this page from your footer'
            ],
            suggestions: [
                'Consult with a legal professional for comprehensive terms',
                'Include payment terms and accepted methods',
                'Add age restrictions if selling age-restricted products',
                'Update terms whenever you change business practices'
            ]
        });
    }

    // Check Contact Information - Email
    const hasEmail = CONTACT_PATTERNS.email.test(combinedText) ||
        linkHrefs.some(h => h.startsWith('mailto:')) ||
        linkTexts.some(t => t.includes('contact') || t.includes('email'));

    if (hasEmail) {
        issues.push({
            title: 'Contact Email Found',
            severity: 'pass',
            description: 'Your website displays a contact email address.',
            whyItMatters: 'Customers need a way to reach you for support.',
            location: 'Contact page or footer'
        });
    } else {
        issues.push({
            title: 'Contact Email Not Found',
            severity: 'critical',
            description: 'No contact email address was found on your website. Customers must be able to reach you.',
            location: 'Website footer or contact page',
            whyItMatters: 'Google requires merchants to provide clear contact information including email. Customers should be able to reach you for support, questions, and issues.',
            howToFix: [
                'Add a contact email to your footer',
                'Create a dedicated Contact Us page',
                'Use a professional email with your domain (e.g., support@yourstore.com)',
                'Make the email clearly visible and clickable'
            ],
            copyPasteCode: `<!-- Add to your footer or contact page -->
<div class="contact-info">
  <h3>Contact Us</h3>
  <p>Email: <a href="mailto:support@yourstore.com">support@yourstore.com</a></p>
  <p>Phone: <a href="tel:+1-555-123-4567">+1 (555) 123-4567</a></p>
  <p>Address: 123 Business Street, City, State 12345</p>
</div>`,
            suggestions: [
                'Use a professional business email, not personal email',
                'Set up an auto-responder for common inquiries',
                'Respond to customer emails within 24-48 hours',
                'Consider adding live chat for instant support'
            ]
        });
    }

    // Check Contact Information - Phone
    const hasPhone = CONTACT_PATTERNS.phone.test(combinedText) ||
        linkHrefs.some(h => h.startsWith('tel:'));

    if (hasPhone) {
        issues.push({
            title: 'Contact Phone Found',
            severity: 'pass',
            description: 'Your website displays a contact phone number.',
            location: 'Contact page or footer'
        });
    } else {
        issues.push({
            title: 'Contact Phone Number Not Found',
            severity: 'warning',
            description: 'No phone number was found on your website. While not always required, it increases customer trust.',
            location: 'Website footer or contact page',
            whyItMatters: 'Having a phone number that is answered during business hours increases customer confidence and can prevent GMC issues related to business legitimacy.',
            howToFix: [
                'Add a business phone number to your contact page',
                'Display phone number in the website header or footer',
                'Make the phone number clickable for mobile users',
                'Include business hours for phone support'
            ],
            suggestions: [
                'Use a dedicated business line, not personal number',
                'Consider a toll-free number for US customers',
                'Set up voicemail for after-hours calls',
                'Display your business hours prominently'
            ]
        });
    }

    // Check for physical address
    const hasAddress = linkTexts.some(t => t.includes('address') || t.includes('location') || t.includes('find us')) ||
        findText(combinedText, ['street', 'avenue', 'blvd', 'road', 'lane', 'suite']);

    if (!hasAddress) {
        issues.push({
            title: 'Physical Business Address Not Found',
            severity: 'warning',
            description: 'No physical business address was detected. Having a verifiable address increases business legitimacy.',
            location: 'Contact page or footer',
            whyItMatters: 'Google may verify your business address. Having a physical address that can receive mail and is verifiable on Google Maps strengthens your GMC account.',
            howToFix: [
                'Add your business address to the contact page',
                'Include the address in your website footer',
                'Make sure the address matches your Google Business Profile',
                'Ensure the address can receive packages and mail'
            ],
            suggestions: [
                'Register your address with Google My Business',
                'Use a commercial address if working from home',
                'Consider a PO Box if you need privacy',
                'Include a Google Maps embed on your contact page'
            ]
        });
    } else {
        issues.push({
            title: 'Business Address Found',
            severity: 'pass',
            description: 'Your website displays a business address.',
            location: 'Contact page or footer'
        });
    }

    return {
        name: 'Required Policies',
        description: 'Essential legal pages required by Google Merchant Center',
        issues
    };
}
