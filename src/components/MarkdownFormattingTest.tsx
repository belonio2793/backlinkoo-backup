import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer, MarkdownList, BoldTextRenderer } from '@/components/MarkdownRenderer';

/**
 * Test component to verify markdown formatting is working correctly
 * Especially for bold text in bullet points and lists
 */
export const MarkdownFormattingTest: React.FC = () => {
  const testContent = {
    // Test content similar to what was shown in the user's image
    listItems: [
      "**Enhanced SEO Performance:** Forum profile backlinks can significantly improve your website's search engine rankings by signaling to search engines that your site is reputable and trustworthy.",
      "**Targeted Traffic Generation:** By participating in relevant discussions and including your website link in your forum profile, you attract visitors who are genuinely interested in your niche.",
      "**Building Authority and Credibility:** Active engagement on forums not only builds backlinks but also establishes you as an authority in your industry."
    ],
    
    blogContent: `
# The Ultimate Guide to Forum Profile Backlinks

**Introduction:** Did you know that forum profile backlinks are like hidden gems in the vast landscape of SEO strategies?

## Key Benefits of Forum Profile Backlinks

**Enhanced SEO Performance:** Forum profile backlinks can significantly improve your website's search engine rankings by signaling to search engines that your site is reputable and trustworthy.

**Targeted Traffic Generation:** By participating in relevant discussions and including your website link in your forum profile, you attract visitors who are genuinely interested in your niche.

**Building Authority and Credibility:** Active engagement on forums not only builds backlinks but also establishes you as an authority in your industry.

## Implementation Strategy

1. **Research and Identify Relevant Forums:** Start by identifying forums in your niche with active participation and high domain authority.

2. **Optimize Your Forum Profile:** When creating your forum profile, ensure your username and information link back to your website.

3. **Engage Thoughtfully and Add Value:** Avoid spammy tactics and focus on adding value to forum discussions.
    `,
    
    simpleText: "**Enhanced SEO Performance:** This is a test of inline bold formatting."
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Formatting Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test 1: Simple Bold Text */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 1: Simple Bold Text</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-2">Raw: {testContent.simpleText}</p>
              <BoldTextRenderer text={testContent.simpleText} className="text-gray-900" />
            </div>
          </div>

          {/* Test 2: List with Bold Headers */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 2: List with Bold Headers</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-4">Using MarkdownList component:</p>
              <MarkdownList items={testContent.listItems} className="space-y-3" />
            </div>
          </div>

          {/* Test 3: Full Blog Content */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 3: Full Blog Content</h3>
            <div className="bg-gray-50 p-4 rounded">
              <MarkdownRenderer 
                content={testContent.blogContent}
                type="blog"
                className="prose prose-sm max-w-none"
              />
            </div>
          </div>

          {/* Test 4: Raw HTML Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test 4: Manual List Format</h3>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="space-y-2 markdown-list">
                {testContent.listItems.map((item, index) => (
                  <li key={index} className="text-gray-700">
                    <div dangerouslySetInnerHTML={{ 
                      __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Visual Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Visual Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded">
                <h4 className="font-medium text-red-800 mb-2">❌ Without Processing</h4>
                <p className="text-sm">**Enhanced SEO Performance:** This should be bold</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">✅ With Processing</h4>
                <div className="text-sm">
                  <strong className="font-bold text-gray-900">Enhanced SEO Performance:</strong> This should be bold
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default MarkdownFormattingTest;
