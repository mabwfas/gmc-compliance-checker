// ShopScore v3.0 Checkers Index
// 10-category Shopify QA audit with Brand-Focused Reports

import { checkEssentialPages, checkNavigation, checkContentQuality, checkVisualDesign, checkTechnicalMarkers } from './shopScoreChecker';
import { checkGMCCompliance } from './gmcChecker';
import { checkTrustSignals } from './trustChecker';
import { checkBrandConsistency } from './brandChecker';
import { checkConversionOptimization } from './conversionChecker';
import { checkMobileExperience } from './mobileChecker';

// List of all ShopScore categories (v3.0 - 100 points)
// Rebalanced with brand-focused categories
const shopScoreCategories = [
    // Core Quality Checks (50 pts)
    { name: 'Essential Pages & Policies', fn: checkEssentialPages, maxPoints: 15, group: 'core' },
    { name: 'Navigation & Structure', fn: checkNavigation, maxPoints: 10, group: 'core' },
    { name: 'Content Quality', fn: checkContentQuality, maxPoints: 10, group: 'core' },
    { name: 'Technical Markers', fn: checkTechnicalMarkers, maxPoints: 5, group: 'core' },
    { name: 'GMC Compliance', fn: checkGMCCompliance, maxPoints: 10, group: 'core' },

    // Brand & Conversion Checks (50 pts) - NEW
    { name: 'Trust & Credibility', fn: checkTrustSignals, maxPoints: 15, group: 'brand' },
    { name: 'Brand Consistency', fn: checkBrandConsistency, maxPoints: 10, group: 'brand' },
    { name: 'Visual & Design', fn: checkVisualDesign, maxPoints: 10, group: 'brand' },
    { name: 'Conversion Optimization', fn: checkConversionOptimization, maxPoints: 10, group: 'brand' },
    { name: 'Mobile Experience', fn: checkMobileExperience, maxPoints: 10, group: 'brand' }
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

            // Normalize score to maxPoints for this category
            const normalizedScore = Math.min(result.score || 0, category.maxPoints);

            results.push({
                ...result,
                name: category.name,
                maxPoints: category.maxPoints,
                score: normalizedScore,
                group: category.group
            });

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
                group: category.group,
                issues: [{
                    title: 'Check Failed',
                    severity: 'warning',
                    description: `Could not complete ${category.name} check: ${error.message}`
                }]
            });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (onProgress) {
        onProgress('Complete', 100);
    }

    // Calculate overall score
    const totalScore = results.reduce((sum, cat) => sum + (cat.score || 0), 0);

    // Calculate group scores
    const coreScore = results.filter(r => r.group === 'core').reduce((sum, cat) => sum + (cat.score || 0), 0);
    const brandScore = results.filter(r => r.group === 'brand').reduce((sum, cat) => sum + (cat.score || 0), 0);

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
        (cat.issues || []).forEach(issue => {
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
        coreScore,
        coreMaxScore: 50,
        brandScore,
        brandMaxScore: 50,
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
    checkGMCCompliance,
    checkTrustSignals,
    checkBrandConsistency,
    checkConversionOptimization,
    checkMobileExperience
};
