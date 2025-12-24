// HTML Parser Utilities

export function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
}

export function extractMetaTags(doc) {
    const metas = {};
    doc.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
            metas[name.toLowerCase()] = content;
        }
    });
    return metas;
}

export function extractTitle(doc) {
    return doc.querySelector('title')?.textContent?.trim() || '';
}

export function extractImages(doc) {
    return Array.from(doc.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        width: img.getAttribute('width'),
        height: img.getAttribute('height')
    }));
}

export function extractLinks(doc) {
    return Array.from(doc.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href') || '',
        text: a.textContent?.trim() || ''
    }));
}

export function extractStructuredData(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];

    scripts.forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            schemas.push(data);
        } catch (e) {
            // Invalid JSON
        }
    });

    return schemas;
}

export function extractText(doc) {
    const body = doc.querySelector('body');
    if (!body) return '';

    // Remove script and style elements
    const clone = body.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export function findElement(doc, selectors) {
    for (const selector of selectors) {
        const el = doc.querySelector(selector);
        if (el) return el;
    }
    return null;
}

export function findText(text, patterns) {
    const lowerText = text.toLowerCase();
    for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
            return true;
        }
    }
    return false;
}
