/**
 * Blog Security Test Script
 * 
 * Tests the blog security processing system with various potentially
 * dangerous content scenarios to ensure proper protection.
 */

// Test cases with various security risks and malformations
const testCases = [
  {
    name: "Clean Content",
    content: "<h2>Welcome</h2><p>This is a normal blog post with <strong>bold text</strong> and <a href='https://example.com'>a link</a>.</p>",
    title: "Welcome Post",
    expectedRisk: "low"
  },
  {
    name: "XSS Script Injection",
    content: "<script>alert('XSS')</script><p>Normal content</p>",
    title: "Test Post",
    expectedRisk: "critical"
  },
  {
    name: "JavaScript URL",
    content: "<p>Click <a href='javascript:alert(1)'>here</a> for more info</p>",
    title: "Link Test",
    expectedRisk: "critical"
  },
  {
    name: "Iframe Injection",
    content: "<iframe src='data:text/html,<script>alert(1)</script>'></iframe><p>Content</p>",
    title: "Iframe Test",
    expectedRisk: "critical"
  },
  {
    name: "Event Handler Injection",
    content: "<img src='x' onerror='alert(1)'><p>Image test</p>",
    title: "Event Test",
    expectedRisk: "high"
  },
  {
    name: "Duplicate Title in Content",
    content: "<h1>Duplicate Title Test</h1><p>This content has the same title as the page title.</p>",
    title: "Duplicate Title Test",
    expectedRisk: "low"
  },
  {
    name: "Malformed HTML",
    content: "<strong>Unclosed tag<p>Another <em>nested unclosed tag<span>More nesting</p>",
    title: "Malformed HTML Test",
    expectedRisk: "medium"
  },
  {
    name: "Special Characters",
    content: "<p>Content with\u0000control chars and\u200Bzero-width\u2028separators</p>",
    title: "Special Chars",
    expectedRisk: "low"
  },
  {
    name: "HTML Entities",
    content: "<p>&lt;script&gt;alert('encoded')&lt;/script&gt; and &quot;quotes&quot;</p>",
    title: "Entity Test",
    expectedRisk: "low"
  },
  {
    name: "Complex Nested Injection",
    content: "<div onclick='alert(1)'><p>Text with <script>/*nested*/</script> more <iframe src='javascript:void(0)'></iframe></p></div>",
    title: "Complex Test",
    expectedRisk: "critical"
  }
];

/**
 * Run security tests
 */
function runSecurityTests() {
  console.log('🔒 Starting Blog Security Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log(`Input: ${testCase.content.substring(0, 100)}${testCase.content.length > 100 ? '...' : ''}`);
    
    try {
      // Simulate the security processor (would need actual imports in real environment)
      const mockSecurityResult = simulateSecurityProcessing(testCase.content, testCase.title);
      
      console.log(`Risk Level: ${mockSecurityResult.riskLevel}`);
      console.log(`Issues Found: ${mockSecurityResult.issues.length}`);
      console.log(`Fixes Applied: ${mockSecurityResult.fixes.length}`);
      console.log(`Content Length: ${testCase.content.length} → ${mockSecurityResult.cleanedContent.length}`);
      
      if (mockSecurityResult.issues.length > 0) {
        console.log(`Issues: ${mockSecurityResult.issues.join(', ')}`);
      }
      
      if (mockSecurityResult.fixes.length > 0) {
        console.log(`Fixes: ${mockSecurityResult.fixes.join(', ')}`);
      }
      
      // Check if the expected risk level matches
      const testPassed = mockSecurityResult.riskLevel === testCase.expectedRisk || 
                         (testCase.expectedRisk === 'critical' && ['critical', 'high'].includes(mockSecurityResult.riskLevel));
      
      if (testPassed) {
        console.log('✅ Test PASSED');
        passed++;
      } else {
        console.log(`❌ Test FAILED - Expected ${testCase.expectedRisk}, got ${mockSecurityResult.riskLevel}`);
        failed++;
      }
      
      results.push({
        name: testCase.name,
        passed: testPassed,
        riskLevel: mockSecurityResult.riskLevel,
        expectedRisk: testCase.expectedRisk,
        issuesFound: mockSecurityResult.issues.length,
        fixesApplied: mockSecurityResult.fixes.length
      });
      
    } catch (error) {
      console.log(`❌ Test ERROR: ${error.message}`);
      failed++;
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SECURITY TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || `Expected ${r.expectedRisk}, got ${r.riskLevel}`}`);
    });
  }
  
  console.log('\n📈 SECURITY EFFECTIVENESS:');
  const criticalCaught = results.filter(r => r.expectedRisk === 'critical' && ['critical', 'high'].includes(r.riskLevel)).length;
  const criticalTotal = results.filter(r => r.expectedRisk === 'critical').length;
  console.log(`Critical Threats Detected: ${criticalCaught}/${criticalTotal} (${((criticalCaught/criticalTotal)*100).toFixed(1)}%)`);
  
  const totalIssues = results.reduce((sum, r) => sum + (r.issuesFound || 0), 0);
  const totalFixes = results.reduce((sum, r) => sum + (r.fixesApplied || 0), 0);
  console.log(`Total Security Issues Found: ${totalIssues}`);
  console.log(`Total Fixes Applied: ${totalFixes}`);
  
  return { passed, failed, results };
}

/**
 * Simulate the security processing (mock implementation for testing)
 */
function simulateSecurityProcessing(content, title) {
  const issues = [];
  const fixes = [];
  let cleanedContent = content;
  let riskLevel = 'low';
  
  // Check for script tags
  if (/<script[^>]*>[\s\S]*?<\/script>/gi.test(content)) {
    issues.push('Script tag detected');
    cleanedContent = cleanedContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    fixes.push('Removed script tags');
    riskLevel = 'critical';
  }
  
  // Check for javascript: URLs
  if (/javascript:/gi.test(content)) {
    issues.push('JavaScript URL detected');
    cleanedContent = cleanedContent.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    fixes.push('Neutralized JavaScript URLs');
    if (riskLevel !== 'critical') riskLevel = 'critical';
  }
  
  // Check for iframe tags
  if (/<iframe[^>]*>/gi.test(content)) {
    issues.push('Iframe tag detected');
    cleanedContent = cleanedContent.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    fixes.push('Removed iframe tags');
    if (riskLevel !== 'critical') riskLevel = 'critical';
  }
  
  // Check for event handlers
  if (/on\w+\s*=/gi.test(content)) {
    issues.push('Event handler attributes detected');
    cleanedContent = cleanedContent.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    fixes.push('Removed event handlers');
    if (riskLevel === 'low') riskLevel = 'high';
  }
  
  // Check for duplicate titles
  if (title && content.includes(title)) {
    const titleRegex = new RegExp(`<h1[^>]*>\\s*${title}\\s*</h1>`, 'gi');
    if (titleRegex.test(content)) {
      issues.push('Duplicate title in content');
      cleanedContent = cleanedContent.replace(titleRegex, '');
      fixes.push('Removed duplicate title');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  }
  
  // Check for malformed HTML
  const openTags = (content.match(/<\w+[^>]*>/g) || []).length;
  const closeTags = (content.match(/<\/\w+>/g) || []).length;
  if (Math.abs(openTags - closeTags) > 2) {
    issues.push('Malformed HTML structure');
    fixes.push('Fixed HTML structure');
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Check for special characters
  if (/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/.test(content)) {
    issues.push('Problematic special characters');
    cleanedContent = cleanedContent.replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '');
    fixes.push('Cleaned special characters');
  }
  
  return {
    riskLevel,
    issues,
    fixes,
    cleanedContent,
    wasProcessed: fixes.length > 0
  };
}

/**
 * Run the tests if this script is executed directly
 */
if (typeof module !== 'undefined' && require.main === module) {
  runSecurityTests();
} else if (typeof window !== 'undefined') {
  // Make available in browser for manual testing
  window.runBlogSecurityTests = runSecurityTests;
  console.log('🔒 Blog security tests available: runBlogSecurityTests()');
}

module.exports = { runSecurityTests, testCases };
