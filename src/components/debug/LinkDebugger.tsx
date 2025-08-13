import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkAttributeFixer } from '@/utils/linkAttributeFixer';

const LinkDebugger: React.FC = () => {
  const [debugResults, setDebugResults] = useState<any[]>([]);

  const testLinkFixes = () => {
    console.log('🔍 Testing link fixes...');
    
    const testCases = [
      {
        name: 'Go High Level Stars (original malformed)',
        input: `<a hrefhttps="" :="" gohighlevelstars.com="" stylecolor:#2563eb;font-weight:500;"="">Go High Level Stars</a>`,
        expected: 'https://gohighlevelstars.com'
      },
      {
        name: 'General malformed pattern',
        input: `<a hrefhttps="" :="" example.com="" target_blank="" rel="">Example</a>`,
        expected: 'https://example.com'
      }
    ];

    const results = testCases.map(testCase => {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Input: ${testCase.input}`);
      
      // Test our fixer
      let fixed = LinkAttributeFixer.fixMalformedLinks(testCase.input);
      fixed = LinkAttributeFixer.ensureLinkStyling(fixed);
      
      console.log(`Output: ${fixed}`);
      
      // Test if it creates valid HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = fixed;
      const link = tempDiv.querySelector('a');
      
      return {
        ...testCase,
        output: fixed,
        actualHref: link?.getAttribute('href') || 'NOT FOUND',
        hasTarget: link?.getAttribute('target') === '_blank',
        hasRel: link?.getAttribute('rel') === 'noopener',
        hasStyle: link?.hasAttribute('style'),
        success: link?.getAttribute('href') === testCase.expected
      };
    });
    
    setDebugResults(results);
  };

  const checkCurrentPageLinks = () => {
    console.log('🔍 Checking links on current page...');
    
    const allLinks = document.querySelectorAll('a');
    const linkInfo = Array.from(allLinks).map((link, index) => {
      const attrs = Array.from(link.attributes).map(attr => 
        `${attr.name}="${attr.value}"`
      ).join(' ');
      
      return {
        index,
        text: link.textContent || '',
        href: link.getAttribute('href'),
        attributes: attrs,
        isMalformed: link.hasAttribute('hrefhttps') || link.hasAttribute('stylecolor'),
        isClickable: !!link.getAttribute('href')
      };
    });
    
    console.log('All links on page:', linkInfo);
    
    // Focus on malformed links
    const malformedLinks = linkInfo.filter(link => link.isMalformed);
    console.log('Malformed links found:', malformedLinks);
    
    return linkInfo;
  };

  useEffect(() => {
    // Auto-check page links when component mounts
    checkCurrentPageLinks();
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Link Debugger</CardTitle>
        <CardDescription>
          Debug and test malformed link fixing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testLinkFixes}>
            Test Link Fixes
          </Button>
          <Button variant="outline" onClick={checkCurrentPageLinks}>
            Check Page Links
          </Button>
        </div>

        {debugResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Test Results:</h3>
            {debugResults.map((result, index) => (
              <Card key={index} className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-2 py-1 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? '✅ PASS' : '❌ FAIL'}
                      </span>
                      <span className="font-medium">{result.name}</span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div><strong>Expected:</strong> {result.expected}</div>
                      <div><strong>Actual href:</strong> {result.actualHref}</div>
                      <div><strong>Has target="_blank":</strong> {result.hasTarget ? '✅' : '❌'}</div>
                      <div><strong>Has rel="noopener":</strong> {result.hasRel ? '✅' : '❌'}</div>
                      <div><strong>Has style:</strong> {result.hasStyle ? '✅' : '❌'}</div>
                    </div>
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer">View HTML</summary>
                      <div className="mt-2 space-y-1">
                        <div><strong>Input:</strong></div>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto">{result.input}</pre>
                        <div><strong>Output:</strong></div>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto">{result.output}</pre>
                      </div>
                    </details>
                    
                    <div className="mt-2">
                      <div dangerouslySetInnerHTML={{ __html: result.output }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkDebugger;
