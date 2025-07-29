/**
 * Test Content Migration Script
 * Quick test to verify the content formatting works correctly
 */

import { ContentFormatter } from './contentFormatter';

export function testContentMigration() {
  console.log('🧪 Testing Content Migration...');

  // Sample problematic content with multiple H1s
  const problemContent = `
    <h1>First Title</h1>
    <p>Some content here.</p>
    <h1>Another Title (this should become H2)</h1>
    <p>More content without proper structure.</p>
    <h1>Third Title (this should also become H2)</h1>
    <p>Content continues here with some issues.</p>
    <h4>Subheading that's too deep</h4>
    <p>Final paragraph without strong formatting.</p>
  `;

  const options = {
    keyword: 'digital marketing',
    anchorText: 'marketing tools',
    targetUrl: 'https://example.com/tools',
    enforceStructure: true,
    maxH1Count: 1
  };

  console.log('📝 Original content issues:');
  console.log('- Multiple H1 tags');
  console.log('- Missing anchor text');
  console.log('- Poor HTML structure');
  console.log('- H4 without proper hierarchy');

  const result = ContentFormatter.formatContent(problemContent, options);

  console.log('\n✅ Formatting results:');
  console.log(`SEO Score: ${result.seoScore}/100`);
  console.log(`Word Count: ${result.wordCount}`);
  console.log(`Issues Found: ${result.issues.length}`);
  console.log(`Fixes Applied: ${result.fixes.length}`);

  console.log('\n🔍 Issues detected:');
  result.issues.forEach(issue => console.log(`  - ${issue}`));

  console.log('\n🔧 Fixes applied:');
  result.fixes.forEach(fix => console.log(`  - ${fix}`));

  console.log('\n📄 Formatted content preview:');
  console.log(result.content.substring(0, 500) + '...');

  // Test template generation
  console.log('\n🎨 Testing template generation...');
  const template = ContentFormatter.generateContentTemplate(options);
  const templateResult = ContentFormatter.formatContent(template, options);
  
  console.log(`Template SEO Score: ${templateResult.seoScore}/100`);
  console.log(`Template Issues: ${templateResult.issues.length}`);

  return {
    originalContent: problemContent,
    formattedContent: result.content,
    metrics: {
      seoScore: result.seoScore,
      wordCount: result.wordCount,
      issues: result.issues,
      fixes: result.fixes
    },
    templateMetrics: {
      seoScore: templateResult.seoScore,
      issues: templateResult.issues.length
    }
  };
}

// Make available for console testing
if (typeof window !== 'undefined') {
  (window as any).testContentMigration = testContentMigration;
  console.log('💡 Content migration test available! Run testContentMigration() in console');
}

export default testContentMigration;
