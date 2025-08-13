import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOScoreDisplay } from '@/components/SEOScoreDisplay';

/**
 * Test component to verify the Premium SEO Analysis Modal works correctly
 */
export const PremiumSEOTest: React.FC = () => {
  const testContent = `
# The Ultimate Guide to Forum Profile Backlinks: Unlocking the Power of Quality Link Building

**Introduction:** Did you know that forum profile backlinks are like hidden gems in the vast landscape of SEO strategies? These powerful yet often underutilized backlinks can significantly boost your website's authority and visibility. Imagine having the key to unlock a treasure trove of high-quality link building opportunities. In this comprehensive guide, we will delve into the world of forum profile backlinks, uncovering their potential to revolutionize your SEO game.

## Key Benefits of Forum Profile Backlinks

**Enhanced SEO Performance:** Forum profile backlinks can significantly improve your website's search engine rankings by signaling to search engines that your site is reputable and trustworthy.

**Targeted Traffic Generation:** By participating in relevant discussions and including your website link in your forum profile, you attract visitors who are genuinely interested in your niche.

**Building Authority and Credibility:** Active engagement on forums not only builds backlinks but also establishes you as an authority in your industry.

## Implementation Strategy

Ready to take your link building efforts to the next level? <a href="https://backlinkoo.com" target="_blank" rel="noopener noreferrer"><strong><u>Visit our comprehensive resource center</u></strong></a> for additional tools and expert guidance.
  `;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Premium SEO Analysis Modal Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Regular SEO Score */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Regular SEO Score (75/100)</h3>
            <div className="bg-gray-50 p-4 rounded">
              <SEOScoreDisplay
                score={75}
                title="The Ultimate Guide to Forum Profile Backlinks"
                content={testContent}
                metaDescription="Discover the power of forum profile backlinks and learn how to create a strategic link building campaign that drives targeted traffic and improves your search engine rankings."
                targetKeyword="forum profile backlinks"
                showDetails={true}
                isPremiumScore={false}
              />
            </div>
          </div>

          {/* Premium SEO Score */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Premium SEO Score (100/100)</h3>
            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <SEOScoreDisplay
                score={100}
                title="The Ultimate Guide to Forum Profile Backlinks: Premium Optimized"
                content={testContent}
                metaDescription="Premium optimized content featuring tier 2 and tier 3 link building strategies for maximum SEO performance and authority transfer."
                targetKeyword="forum profile backlinks"
                showDetails={true}
                isPremiumScore={true}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Test Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click "Analyze" on the regular SEO score to see the standard analysis modal</li>
              <li>• Click "Premium Analysis" on the premium SEO score to see the new premium modal</li>
              <li>• The premium modal should show 100/100 scores across all categories</li>
              <li>• Look for tier 2/tier 3 link building metrics and comprehensive positive analysis</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumSEOTest;
