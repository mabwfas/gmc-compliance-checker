import { useState } from 'react';
import IssueItem from './IssueItem';

const categoryIcons = {
    'Required Policies': { icon: '📋', class: 'policies' },
    'Product Pages': { icon: '🏷️', class: 'product' },
    'Technical Requirements': { icon: '⚙️', class: 'technical' },
    'Checkout Experience': { icon: '🛒', class: 'checkout' },
    'Content Quality': { icon: '📝', class: 'content' },
    'Image Quality': { icon: '🖼️', class: 'images' },
    'Structured Data': { icon: '📊', class: 'schema' },
    'Security': { icon: '🔒', class: 'security' }
};

function CategoryCard({ category }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const criticalCount = category.issues.filter(i => i.severity === 'critical').length;
    const warningCount = category.issues.filter(i => i.severity === 'warning').length;
    const infoCount = category.issues.filter(i => i.severity === 'info').length;
    const passCount = category.issues.filter(i => i.severity === 'pass').length;

    const iconData = categoryIcons[category.name] || { icon: '📌', class: 'policies' };

    return (
        <div className={`category-card ${isExpanded ? 'expanded' : ''}`}>
            <div
                className="category-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="category-info">
                    <div className={`category-icon ${iconData.class}`}>
                        {iconData.icon}
                    </div>
                    <div className="category-title-wrapper">
                        <h3>{category.name}</h3>
                        <p className="category-subtitle">{category.description}</p>
                    </div>
                </div>

                <div className="category-badges">
                    {criticalCount > 0 && (
                        <span className="badge critical">{criticalCount} Critical</span>
                    )}
                    {warningCount > 0 && (
                        <span className="badge warning">{warningCount} Warning</span>
                    )}
                    {infoCount > 0 && (
                        <span className="badge info">{infoCount} Info</span>
                    )}
                    {passCount > 0 && (
                        <span className="badge success">{passCount} Passed</span>
                    )}
                    <span className="category-chevron">▼</span>
                </div>
            </div>

            <div className="category-content">
                <div className="issues-list">
                    {category.issues.map((issue, index) => (
                        <IssueItem key={index} issue={issue} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CategoryCard;
