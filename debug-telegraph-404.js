const fetch = require('node-fetch');

/**
 * Telegraph 404 Debugging Script
 * Tests Telegraph API and diagnoses common 404 issues
 */

async function debugTelegraph404() {
  console.log('🔍 Debugging Telegraph 404 Error...\n');
  
  try {
    // 1. Test Telegraph API availability
    console.log('1. Testing Telegraph API availability...');
    const apiTest = await fetch('https://api.telegra.ph/getPageList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: 'test' })
    });
    
    const apiResponse = await apiTest.json();
    console.log('✅ Telegraph API is responding:', apiResponse.ok ? 'Working' : 'Has Issues');
    
    // 2. Test account creation
    console.log('\n2. Testing Telegraph account creation...');
    const accountResponse = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_name: 'Test Bot',
        author_name: 'Debug Test',
        author_url: ''
      })
    });
    
    const accountData = await accountResponse.json();
    
    if (accountData.ok) {
      console.log('✅ Telegraph account creation: Success');
      const accessToken = accountData.result.access_token;
      
      // 3. Test page creation with minimal content
      console.log('\n3. Testing Telegraph page creation...');
      const pageResponse = await fetch('https://api.telegra.ph/createPage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          title: 'Debug Test Page',
          content: [
            {
              tag: 'p',
              children: ['This is a test page to debug 404 issues.']
            }
          ],
          author_name: 'Debug Test'
        })
      });
      
      const pageData = await pageResponse.json();
      
      if (pageData.ok) {
        const testUrl = `https://telegra.ph/${pageData.result.path}`;
        console.log('✅ Telegraph page creation: Success');
        console.log('🔗 Test page URL:', testUrl);
        
        // 4. Verify the page is accessible
        console.log('\n4. Verifying page accessibility...');
        const pageCheck = await fetch(testUrl);
        console.log('📄 Page accessibility:', pageCheck.status === 200 ? '✅ Accessible' : `❌ Error ${pageCheck.status}`);
        
        if (pageCheck.status === 404) {
          console.log('🚨 FOUND THE ISSUE: Telegraph page returns 404 immediately after creation');
          console.log('💡 This suggests Telegraph is rejecting the content or the account is problematic');
        }
        
      } else {
        console.log('❌ Telegraph page creation failed:', pageData.error);
        console.log('💡 Common causes:');
        console.log('   - Invalid content format');
        console.log('   - Content policy violation');
        console.log('   - Account rate limiting');
      }
      
    } else {
      console.log('❌ Telegraph account creation failed:', accountData.error);
      console.log('💡 This suggests Telegraph API issues or rate limiting');
    }
    
    // 5. Check for common Telegraph content issues
    console.log('\n5. Common Telegraph 404 Causes:');
    console.log('   - Content contains prohibited links or keywords');
    console.log('   - Too many posts created from the same IP recently');
    console.log('   - Telegraph detected spam-like behavior');
    console.log('   - Invalid HTML in content format');
    console.log('   - Very long content that exceeds limits');
    
    console.log('\n✅ Telegraph debugging complete');
    
  } catch (error) {
    console.error('💥 Debugging failed:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('💡 Network connectivity issue - check internet connection');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Telegraph API timeout - service may be slow or down');
    }
  }
}

// Additional diagnosis for automation system
async function checkAutomationTelegraphIntegration() {
  console.log('\n📋 Checking automation system Telegraph integration...\n');
  
  try {
    // Test the Netlify function that handles Telegraph publishing
    console.log('Testing Netlify Telegraph function...');
    const testResponse = await fetch('/.netlify/functions/telegraph-publisher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Debug Test Post',
        content: 'This is a test post to debug the automation system.',
        author_name: 'Automation Debug'
      })
    });
    
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ Netlify Telegraph function: Working');
      console.log('🔗 Generated URL:', result.url);
      
      // Verify the generated URL
      if (result.url) {
        const urlCheck = await fetch(result.url);
        console.log('📄 Generated page status:', urlCheck.status === 200 ? '✅ Accessible' : `❌ Error ${urlCheck.status}`);
      }
      
    } else {
      console.log('❌ Netlify Telegraph function failed:', testResponse.status);
      const errorText = await testResponse.text();
      console.log('📄 Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Function test failed:', error.message);
    console.log('💡 This suggests the Netlify function is not deployed or accessible');
  }
}

// Run the debugging
debugTelegraph404().then(() => {
  return checkAutomationTelegraphIntegration();
}).catch(console.error);
