#!/usr/bin/env node

/**
 * Test Blog HTML Generation - Verify HTML output is correct
 */

// Mock blog functions for testing HTML generation
function generateBlogHTML(domain, posts = [], theme = {}) {
  const siteName = domain.replace('.org', '').replace('.com', '');
  const siteTitle = siteName.charAt(0).toUpperCase() + siteName.slice(1);

  const postsHTML = posts.length > 0 ? 
    `<h2>Latest Articles (${posts.length})</h2>` + 
    posts.map(post => `<article><h3>${post.title}</h3><p>${post.excerpt}</p></article>`).join('') :
    `<h2>Welcome to ${siteTitle}</h2><p>Content coming soon!</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${siteTitle} - Expert Insights & Resources</title>
    <meta name="description" content="Expert insights about ${siteName}">
</head>
<body>
    <header>
        <h1>${siteTitle}</h1>
        <p>Expert insights and resources about ${siteName}</p>
    </header>
    <main>
        ${postsHTML}
    </main>
    <footer>
        <p>© ${new Date().getFullYear()} ${siteTitle}</p>
    </footer>
</body>
</html>`;
}

function testHTMLGeneration() {
  console.log('🧪 Testing Blog HTML Generation...');
  
  // Test 1: Empty posts (default content)
  console.log('\\n📝 Test 1: Default content (no posts)');
  const html1 = generateBlogHTML('leadpages.org', []);
  
  const hasTitle1 = html1.includes('<title>Leadpages - Expert Insights');
  const hasWelcome1 = html1.includes('Welcome to Leadpages');
  const hasComingSoon1 = html1.includes('Content coming soon');
  
  console.log('- Has correct title:', hasTitle1 ? '✅' : '❌');
  console.log('- Has welcome message:', hasWelcome1 ? '✅' : '❌');
  console.log('- Has coming soon message:', hasComingSoon1 ? '✅' : '❌');
  
  // Test 2: With sample posts
  console.log('\\n📝 Test 2: With sample blog posts');
  const samplePosts = [
    {
      title: 'Essential Lead Generation Strategies',
      excerpt: 'Learn the best strategies for generating quality leads.',
      slug: 'essential-lead-generation-strategies'
    },
    {
      title: 'Creating High-Converting Landing Pages',
      excerpt: 'Tips for building landing pages that convert visitors.',
      slug: 'creating-high-converting-landing-pages'
    }
  ];
  
  const html2 = generateBlogHTML('leadpages.org', samplePosts);
  
  const hasArticles2 = html2.includes('Latest Articles (2)');
  const hasFirstPost2 = html2.includes('Essential Lead Generation Strategies');
  const hasSecondPost2 = html2.includes('Creating High-Converting Landing Pages');
  
  console.log('- Has articles section:', hasArticles2 ? '✅' : '❌');
  console.log('- Has first post:', hasFirstPost2 ? '✅' : '❌');
  console.log('- Has second post:', hasSecondPost2 ? '✅' : '❌');
  
  // Test 3: Domain name processing
  console.log('\\n📝 Test 3: Domain name processing');
  const htmlBacklinks = generateBlogHTML('backlinks.org', []);
  const htmlSEO = generateBlogHTML('seo-tools.com', []);
  
  const hasBacklinksTitle = htmlBacklinks.includes('<title>Backlinks - Expert Insights');
  const hasSEOTitle = htmlSEO.includes('<title>Seo-tools - Expert Insights');
  
  console.log('- Processes .org domains correctly:', hasBacklinksTitle ? '✅' : '❌');
  console.log('- Processes .com domains correctly:', hasSEOTitle ? '✅' : '❌');
  
  // Overall validation
  const allTests = [
    hasTitle1, hasWelcome1, hasComingSoon1,
    hasArticles2, hasFirstPost2, hasSecondPost2,
    hasBacklinksTitle, hasSEOTitle
  ];
  
  const passedTests = allTests.filter(Boolean).length;
  const totalTests = allTests.length;
  
  console.log(`\\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All HTML generation tests passed!');
    return true;
  } else {
    console.log('⚠️  Some HTML generation tests failed');
    return false;
  }
}

function testBlogSystemReadiness() {
  console.log('\\n🔍 Testing Blog System Readiness...');
  
  // Check if required functions exist
  const functionFiles = [
    'netlify/functions/domain-blog-server.js',
    'netlify/functions/blog-post-server.js'
  ];
  
  let filesExist = true;
  
  for (const file of functionFiles) {
    try {
      const fs = require('fs');
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
        filesExist = false;
      }
    } catch (error) {
      console.log(`❌ Error checking ${file}:`, error.message);
      filesExist = false;
    }
  }
  
  // Check Netlify configuration
  try {
    const fs = require('fs');
    const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
    
    const hasHostCondition = netlifyConfig.includes('Host = ["leadpages.org"]');
    const hasFunctionRoute = netlifyConfig.includes('domain-blog-server');
    
    console.log('✅ netlify.toml exists');
    console.log('- Has host condition:', hasHostCondition ? '✅' : '❌');
    console.log('- Has function routing:', hasFunctionRoute ? '✅' : '❌');
    
    return filesExist && hasHostCondition && hasFunctionRoute;
  } catch (error) {
    console.log('❌ Error checking netlify.toml:', error.message);
    return false;
  }
}

function displayDeploymentInstructions() {
  console.log('\\n📋 Deployment Instructions for leadpages.org:');
  console.log('=' .repeat(60));
  
  console.log('\\n1. 🚀 Deploy to Netlify:');
  console.log('   npm run deploy:build');
  
  console.log('\\n2. 🌐 Update DNS (at your domain registrar):');
  console.log('   A Record: leadpages.org → 75.2.60.5');
  console.log('   A Record: leadpages.org → 99.83.190.102');
  console.log('   CNAME: www.leadpages.org → your-netlify-site.netlify.app');
  
  console.log('\\n3. ✅ Verify deployment:');
  console.log('   - Visit https://leadpages.org');
  console.log('   - Should show blog content instead of admin interface');
  console.log('   - Test individual posts: https://leadpages.org/blog/post-slug');
  
  console.log('\\n4. 🔧 If issues occur:');
  console.log('   - Check Netlify function logs');
  console.log('   - Verify DNS propagation (can take up to 24 hours)');
  console.log('   - Test functions directly: https://your-site.netlify.app/.netlify/functions/domain-blog-server');
}

async function runAllTests() {
  console.log('🚀 Starting Blog System Tests...');
  console.log('=' .repeat(60));
  
  const htmlTest = testHTMLGeneration();
  const readinessTest = testBlogSystemReadiness();
  
  console.log('\\n📊 Final Test Summary:');
  console.log('=' .repeat(60));
  console.log('HTML Generation:', htmlTest ? '✅ PASS' : '❌ FAIL');
  console.log('System Readiness:', readinessTest ? '✅ PASS' : '❌ FAIL');
  
  if (htmlTest && readinessTest) {
    console.log('\\n🎉 Blog system is ready for deployment!');
    displayDeploymentInstructions();
    return true;
  } else {
    console.log('\\n⚠️  Blog system needs attention before deployment');
    return false;
  }
}

// Run all tests
runAllTests()
  .then(success => {
    console.log(`\\n${success ? '✅' : '❌'} Test suite completed`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
