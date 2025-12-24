// Main Checkers Index
// Exports all checkers and orchestrates the checking process

import { checkPolicies } from './policiesChecker';
import { checkProductPages } from './productChecker';
import { checkTechnicalRequirements } from './technicalChecker';
import { checkCheckoutExperience } from './checkoutChecker';
import { checkContentQuality } from './contentChecker';
import { checkImageQuality } from './imageChecker';
import { checkStructuredData } from './structuredDataChecker';
import { checkSecurity } from './securityChecker';
import { checkMicroDetails } from './microChecker';

// List of all checkers with their display info - 9 comprehensive checks
const checkers = [
    { name: 'Required Policies', fn: checkPolicies },
    { name: 'Product Pages', fn: checkProductPages },
    { name: 'Technical Requirements', fn: checkTechnicalRequirements },
    { name: 'Checkout Experience', fn: checkCheckoutExperience },
    { name: 'Content Quality', fn: checkContentQuality },
    { name: 'Image Quality', fn: checkImageQuality },
    { name: 'Structured Data', fn: checkStructuredData },
    { name: 'Security', fn: checkSecurity },
    { name: 'Micro Details', fn: checkMicroDetails }
];

export async function runAllCheckers(crawlResults, onProgress) {
    const results = [];

    for (let i = 0; i < checkers.length; i++) {
        const checker = checkers[i];

        // Report progress
        if (onProgress) {
            onProgress(checker.name, (i / checkers.length) * 100);
        }

        try {
            // Run the checker
            const result = checker.fn(crawlResults);
            results.push(result);
        } catch (error) {
            console.error(`Error in ${checker.name}:`, error);
            results.push({
                name: checker.name,
                description: 'An error occurred while running this check',
                issues: [{
                    title: 'Check Failed',
                    severity: 'warning',
                    description: `Could not complete ${checker.name} check: ${error.message}`
                }]
            });
        }

        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final progress report
    if (onProgress) {
        onProgress('Complete', 100);
    }

    return results;
}

export {
    checkPolicies,
    checkProductPages,
    checkTechnicalRequirements,
    checkCheckoutExperience,
    checkContentQuality,
    checkImageQuality,
    checkStructuredData,
    checkSecurity,
    checkMicroDetails
};
