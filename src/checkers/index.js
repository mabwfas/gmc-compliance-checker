// ShopScore v2.0 Checkers Index
// 6-category Shopify QA audit with GMC Compliance

import { checkEssentialPages, checkNavigation, checkContentQuality, checkVisualDesign, checkTechnicalMarkers } from './shopScoreChecker';
import { checkGMCCompliance } from './gmcChecker';

// List of all ShopScore categories (v2.0 - 100 points)
const shopScoreCategories = [
    { name: 'Essential Pages & Policies', fn: checkEssentialPages, maxPoints: 20 },
    { name: 'Navigation & Structure', fn: checkNavigation, maxPoints: 15 },
    { name: 'Content Quality', fn: checkContentQuality, maxPoints: 15 },
    { name: 'Visual & Design', fn: checkVisualDesign, maxPoints: 15 },
    { name: 'Technical Markers', fn: checkTechnicalMarkers, maxPoints: 10 },
    { name: 'GMC Compliance', fn: checkGMCCompliance, maxPoints: 25 }
];

export async function runAllCheckers(crawlResults, onProgress) {
    const results = [];
    let gmcResult = null;

    for (let i = 0; i < shopScoreCategories.length; i++) {
        const category = shopScoreCategories[i];

        if (onProgress) {
            onProgress(category.name, (i / shopScoreCategories.length) * 100);
        }

        try {
            const result = category.fn(crawlResults);
            results.push(result);

            // Track GMC result separately for status
            if (category.name === 'GMC Compliance') {
                gmcResult = result;
            }
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

        await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (onProgress) {
        onProgress('Complete', 100);
    }

    // Calculate overall score
    const totalScore = results.reduce((sum, cat) => sum + (cat.score || 0), 0);

    // Determine overall status
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
        // GMC specific status
        gmcStatus: gmcResult?.gmcStatus || 'UNKNOWN',
        gmcStatusColor: gmcResult?.gmcStatusColor || 'warning',
        gmcSubcategories: gmcResult?.subcategories || null,
        // Issue counts
        criticalCount: allIssues.filter(i => i.impact === 'critical').length,
        highCount: allIssues.filter(i => i.impact === 'high').length,
        mediumCount: allIssues.filter(i => i.impact === 'medium').length,
        lowCount: allIssues.filter(i => i.impact === 'low').length,
        allIssues
    };

    return results;
}

export {
    checkEssentialPages,
    checkNavigation,
    checkContentQuality,
    checkVisualDesign,
    checkTechnicalMarkers,
    checkGMCCompliance
};
