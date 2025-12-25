// ShopScore Checkers Index
// Unified 5-category Shopify QA audit system

import { runShopScoreAudit, checkEssentialPages, checkNavigation, checkContentQuality, checkVisualDesign, checkTechnicalMarkers } from './shopScoreChecker';

// List of all ShopScore categories
const shopScoreCategories = [
    { name: 'Essential Pages & Policies', fn: checkEssentialPages, maxPoints: 25 },
    { name: 'Navigation & Structure', fn: checkNavigation, maxPoints: 20 },
    { name: 'Content Quality', fn: checkContentQuality, maxPoints: 20 },
    { name: 'Visual & Design', fn: checkVisualDesign, maxPoints: 20 },
    { name: 'Technical Markers', fn: checkTechnicalMarkers, maxPoints: 15 }
];

export async function runAllCheckers(crawlResults, onProgress) {
    const results = [];

    for (let i = 0; i < shopScoreCategories.length; i++) {
        const category = shopScoreCategories[i];

        // Report progress
        if (onProgress) {
            onProgress(category.name, (i / shopScoreCategories.length) * 100);
        }

        try {
            // Run the category check
            const result = category.fn(crawlResults);
            results.push(result);
        } catch (error) {
            console.error(`Error in ${category.name}:`, error);
            results.push({
                name: category.name,
                maxPoints: category.maxPoints,
                score: 0,
                issues: [{
                    title: 'Check Failed',
                    severity: 'warning',
                    description: `Could not complete ${category.name} check: ${error.message}`
                }]
            });
        }

        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Final progress report
    if (onProgress) {
        onProgress('Complete', 100);
    }

    // Calculate overall score and status
    const totalScore = results.reduce((sum, cat) => sum + (cat.score || 0), 0);

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

    // Collect all issues
    const allIssues = [];
    const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    results.forEach(cat => {
        cat.issues.forEach(issue => {
            if (issue.severity !== 'pass') {
                allIssues.push({ ...issue, category: cat.name });
            }
        });
    });

    allIssues.sort((a, b) => (impactOrder[a.impact] || 99) - (impactOrder[b.impact] || 99));

    // Add metadata to results
    results.shopScoreData = {
        totalScore,
        maxScore: 100,
        status,
        statusColor,
        criticalCount: allIssues.filter(i => i.impact === 'critical').length,
        highCount: allIssues.filter(i => i.impact === 'high').length,
        mediumCount: allIssues.filter(i => i.impact === 'medium').length,
        lowCount: allIssues.filter(i => i.impact === 'low').length,
        allIssues
    };

    return results;
}

export {
    runShopScoreAudit,
    checkEssentialPages,
    checkNavigation,
    checkContentQuality,
    checkVisualDesign,
    checkTechnicalMarkers
};
