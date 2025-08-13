import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BlogContentCleaner } from '@/utils/blogContentCleaner';

const sampleBlogContent = `**Introduction:**
Digital Marketing SEO is crucial for business success in the modern world.

**Section 1: Understanding the Essence of Digital Marketing SEO**
This section covers the fundamentals of SEO and digital marketing strategies.

**Call-to-Action:**
Take action now to improve your SEO rankings.

--- This 1000-word blog post on Digital Marketing SEO combines expert insights, actionable tips, and real-world examples to provide readers with a comprehensive guide to mastering SEO in the digital age. By integrating strategic backlinks to Backlinko, the content not only educates but also empowers readers to take their SEO efforts to the next level.

This is regular content that should remain unchanged and continue to provide value to readers.`;

export function ContentCleaningDemo() {
  const [showCleaned, setShowCleaned] = useState(false);

  const cleanedContent = BlogContentCleaner.cleanBlogContent(sampleBlogContent);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blog Content Cleaning Demo</CardTitle>
          <p className="text-gray-600">
            This demonstrates how the BlogContentCleaner removes unwanted section headers and footer text.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowCleaned(!showCleaned)}>
            {showCleaned ? 'Show Original' : 'Show Cleaned Version'}
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Content (Bad)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm bg-red-50 p-4 rounded border">
                  {sampleBlogContent}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cleaned Content (Good)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm bg-green-50 p-4 rounded border">
                  {cleanedContent}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">What was removed:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>**Introduction:**</strong> - Section header</li>
              <li>• <strong>**Section 1: Understanding...**</strong> - Section header</li>
              <li>• <strong>**Call-to-Action:**</strong> - Section header</li>
              <li>• The long footer text about "This 1000-word blog post..."</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
