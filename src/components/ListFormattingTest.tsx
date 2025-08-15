import React, { useState, useEffect } from 'react';
import { SimpleContentFormatter } from '@/utils/simpleContentFormatter';
import { EnhancedBlogCleaner } from '@/utils/enhancedBlogCleaner';

export function ListFormattingTest() {
  const [formattedContent, setFormattedContent] = useState('');

  const testContent = `
**Introduction:** Did you know that forum profile backlinks are like hidden gems in the vast landscape of SEO strategies?

## Key Benefits of Forum Profile Backlinks

Forum profile backlinks offer numerous advantages for your SEO strategy:

1. Enhanced SEO Performance: Forum profile backlinks can significantly improve your website's search engine rankings by signaling to search engines that your site is credible and trustworthy.

2. Targeted Traffic Generation: By participating in relevant discussions and including your website link in your forum profile, you attract visitors who are genuinely interested in your niche.

3. Building Authority and Credibility: Active engagement on forums not only builds backlinks but also establishes you as an authority in your industry.

## Strategic Implementation Steps

To harness the full power of forum profile backlinks, follow these essential steps:

1. Choose the Right Forums: Select forums that are relevant to your niche and have a strong community of engaged users.

2. Optimize Your Profile: Craft a compelling bio and include a link to your website in a natural and non-promotional way.

3. Engage Meaningfully: Participate in discussions, offer valuable insights, and avoid overly promotional behavior.

4. Monitor and Maintain: Regularly check your forum profile links for any changes or broken links.

## Best Practices for Success

Here are some additional tips to maximize your forum backlink strategy:

• Focus on quality over quantity
• Build relationships within the community
• Share valuable content and insights
• Stay consistent with your participation
• Track your results and adjust your strategy

## Conclusion

Forum profile backlinks remain one of the most accessible and effective link building strategies when executed properly.
  `;

  useEffect(() => {
    try {
      console.log('🧪 Testing list formatting...');
      console.log('📝 Original content length:', testContent.length);
      
      // Step 1: Clean with EnhancedBlogCleaner
      const cleaned = EnhancedBlogCleaner.cleanContent(testContent, 'Test Title');
      console.log('🧹 After cleaning:', cleaned.length);
      
      // Step 2: Format with SimpleContentFormatter
      const formatted = SimpleContentFormatter.formatBlogContent(cleaned);
      console.log('🎨 After formatting:', formatted.length);
      console.log('📄 Formatted content:', formatted);
      
      setFormattedContent(formatted);
    } catch (error) {
      console.error('💥 Formatting failed:', error);
      setFormattedContent('<p style="color: red;">Formatting failed: ' + error.message + '</p>');
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">List Formatting Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Content */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Original (Unformatted)</h2>
          <div className="bg-gray-100 p-4 rounded text-sm">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {testContent}
            </pre>
          </div>
        </div>

        {/* Formatted Content */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Formatted (With Lists)</h2>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: formattedContent
            }}
          />
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Lists should be formatted as proper HTML &lt;ol&gt; and &lt;ul&gt; elements</li>
          <li>✅ Numbered items (1., 2., 3.) should become ordered lists</li>
          <li>✅ Bullet items (•) should become unordered lists</li>
          <li>✅ Bold text should be preserved within list items</li>
        </ul>
      </div>
    </div>
  );
}

export default ListFormattingTest;
