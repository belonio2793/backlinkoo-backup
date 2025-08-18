/**
 * Test Write.as Platform
 * API endpoint for testing Write.as publishing capability
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { title, content, testMode = false } = JSON.parse(event.body);

    if (!title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: title, content' 
        }),
      };
    }

    console.log(`🧪 Testing Write.as platform (Test Mode: ${testMode})`);
    console.log(`Title: ${title}`);
    console.log(`Content length: ${content.length}`);

    const fetch = require('node-fetch');

    // Convert content to Write.as format
    const writeasContent = convertToWriteasFormat(content, title);
    console.log(`✅ Content converted to Write.as format`);

    // Step 1: Create Write.as post
    const postResponse = await fetch('https://write.as/api/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': testMode ? 'PlatformTester/1.0' : 'LinkBuilder/1.0'
      },
      body: JSON.stringify({
        body: writeasContent,
        title: title,
        font: 'norm'
      })
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`Write.as API error: HTTP ${postResponse.status} - ${errorText}`);
    }

    const postData = await postResponse.json();
    
    if (!postData.data || !postData.data.url) {
      throw new Error('Write.as response missing URL data');
    }

    const publishedUrl = postData.data.url;
    console.log(`✅ Write.as post created: ${publishedUrl}`);

    // Step 2: Verify the URL is accessible
    const verifyResponse = await fetch(publishedUrl, { method: 'HEAD' });
    
    if (!verifyResponse.ok) {
      throw new Error(`Published URL not accessible: HTTP ${verifyResponse.status}`);
    }

    console.log('✅ Write.as URL verification passed');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: publishedUrl,
        platform: 'Write.as',
        statusCode: verifyResponse.status,
        postId: postData.data.id,
        message: testMode ? 'Write.as test successful' : 'Published successfully to Write.as',
        testMode
      }),
    };

  } catch (error) {
    console.error('❌ Write.as test failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Write.as test failed',
        platform: 'Write.as'
      }),
    };
  }
};

/**
 * Convert content to Write.as format
 */
function convertToWriteasFormat(content, title) {
  let writeasContent = '';
  
  // Add title if not already in content
  if (!content.includes(title)) {
    writeasContent += `# ${title}\n\n`;
  }
  
  // Split content into lines
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine) {
      // Convert markdown-style links to Write.as format
      if (trimmedLine.includes('[') && trimmedLine.includes('](')) {
        // Write.as supports markdown links directly
        writeasContent += trimmedLine + '\n\n';
      } else if (trimmedLine.startsWith('# ')) {
        // H1 heading
        writeasContent += trimmedLine + '\n\n';
      } else if (trimmedLine.startsWith('## ')) {
        // H2 heading
        writeasContent += trimmedLine + '\n\n';
      } else if (trimmedLine.startsWith('- ')) {
        // List item
        writeasContent += trimmedLine + '\n';
      } else {
        // Regular paragraph
        writeasContent += trimmedLine + '\n\n';
      }
    }
  }
  
  return writeasContent.trim();
}
