import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentFormatter } from '@/utils/contentFormatter';
import { LinkAttributeFixer } from '@/utils/linkAttributeFixer';

const LinkFixTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  
  const runTest = () => {
    // Test the exact malformed pattern from your issue
    const malformedContent = `
      Check out <a hrefhttps="" :="" gohighlevelstars.com="" stylecolor:#2563eb;font-weight:500;"="">Go High Level Stars</a> for more info.
      
      Also visit <a hrefhttps="" :="" example.com="" target_blank="" rel="">Example Site</a> here.
    `;
    
    console.log('🧪 Testing malformed link fixing...');
    console.log('Original content:', malformedContent);
    
    // Apply our fixes
    let fixedContent = LinkAttributeFixer.fixMalformedLinks(malformedContent);
    fixedContent = LinkAttributeFixer.ensureLinkStyling(fixedContent);
    fixedContent = ContentFormatter.formatBlogContent(fixedContent);
    
    console.log('Fixed content:', fixedContent);
    setTestResult(fixedContent);
  };
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Link Fix Test</CardTitle>
        <CardDescription>
          Test the malformed link attribute fixing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest}>
          Test Link Fixing
        </Button>
        
        {testResult && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Result:</h3>
            <div 
              className="p-4 bg-gray-50 border rounded prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: testResult }}
            />
            
            <details className="text-xs">
              <summary className="cursor-pointer">View Raw HTML</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                {testResult}
              </pre>
            </details>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside mt-1">
            <li>Malformed href attributes (hrefhttps="", :="", domain="")</li>
            <li>Broken style attributes (stylecolor:...)</li>
            <li>Missing target and rel attributes</li>
            <li>Link clickability and styling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkFixTest;
