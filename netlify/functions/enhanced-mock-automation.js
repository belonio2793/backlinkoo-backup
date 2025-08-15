// Enhanced mock automation content generator for development and testing
const { v4: uuidv4 } = require('uuid');

// Mock data store for development
const mockDatabase = new Map();

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    };
  }

  // Only allow POST and GET requests
  if (!['POST', 'GET'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Handle GET requests for testing status
    if (event.httpMethod === 'GET') {
      return handleGetRequest(event);
    }

    // Handle POST requests for content generation
    return await handlePostRequest(event);

  } catch (error) {
    console.error('Enhanced mock automation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        mock: true
      })
    };
  }
};

async function handlePostRequest(event) {
  const { 
    keyword, 
    anchorText, 
    targetUrl,
    testMode = false,
    simulateDelay = true,
    simulateError = false,
    errorType = 'network',
    contentVariations = 1
  } = JSON.parse(event.body);

  // Validate required parameters
  if (!keyword || !anchorText || !targetUrl) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Missing required parameters: keyword, anchorText, and targetUrl are required',
        mock: true
      })
    };
  }

  // Generate session ID for tracking
  const sessionId = uuidv4();
  const startTime = Date.now();

  // Store session info
  mockDatabase.set(sessionId, {
    keyword,
    anchorText,
    targetUrl,
    startTime,
    status: 'processing',
    logs: [`Started content generation for keyword: ${keyword}`]
  });

  // Simulate different error types if requested
  if (simulateError) {
    const session = mockDatabase.get(sessionId);
    session.status = 'failed';
    session.endTime = Date.now();
    
    const errorMessages = {
      'network': 'Network timeout - Unable to connect to content generation service',
      'api_key': 'OPENAI_API_KEY not configured or invalid',
      'rate_limit': 'API rate limit exceeded - Please try again later',
      'content_policy': 'Content violates platform policies',
      'server': 'Internal server error - Service temporarily unavailable'
    };

    session.logs.push(`Error: ${errorMessages[errorType] || errorMessages.network}`);
    
    return {
      statusCode: errorType === 'api_key' ? 401 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: errorMessages[errorType] || errorMessages.network,
        sessionId,
        mock: true,
        testMode
      })
    };
  }

  // Simulate processing delay
  if (simulateDelay) {
    const delay = testMode ? 500 : Math.random() * 2000 + 1000; // 500ms for tests, 1-3s normally
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Generate multiple content variations if requested
  const contentResults = [];
  for (let i = 0; i < Math.min(contentVariations, 5); i++) {
    const content = generateEnhancedMockContent(keyword, anchorText, targetUrl, i);
    contentResults.push(content);
  }

  // Update session status
  const session = mockDatabase.get(sessionId);
  session.status = 'completed';
  session.endTime = Date.now();
  session.duration = session.endTime - session.startTime;
  session.contentGenerated = contentResults.length;
  session.logs.push(`Generated ${contentResults.length} piece(s) of content in ${session.duration}ms`);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      content: contentResults,
      sessionId,
      duration: session.duration,
      mock: true,
      testMode,
      metadata: {
        generatedAt: new Date().toISOString(),
        keyword,
        variations: contentResults.length,
        environment: 'development'
      }
    })
  };
}

function handleGetRequest(event) {
  const { sessionId, action } = event.queryStringParameters || {};

  if (action === 'status' && sessionId) {
    // Return session status
    const session = mockDatabase.get(sessionId);
    if (!session) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Session not found',
          mock: true
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        sessionId,
        status: session.status,
        duration: session.duration,
        logs: session.logs,
        mock: true
      })
    };
  }

  if (action === 'health') {
    // Health check endpoint
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'healthy',
        service: 'Enhanced Mock Automation',
        version: '1.0.0',
        environment: 'development',
        features: [
          'Content generation simulation',
          'Error simulation',
          'Performance testing',
          'Parallel processing',
          'Session tracking'
        ],
        activeSessions: mockDatabase.size,
        uptime: process.uptime(),
        mock: true
      })
    };
  }

  if (action === 'stats') {
    // Return statistics
    const sessions = Array.from(mockDatabase.values());
    const completed = sessions.filter(s => s.status === 'completed');
    const failed = sessions.filter(s => s.status === 'failed');
    
    const averageDuration = completed.length > 0
      ? completed.reduce((sum, s) => sum + s.duration, 0) / completed.length
      : 0;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        totalSessions: sessions.length,
        completed: completed.length,
        failed: failed.length,
        processing: sessions.filter(s => s.status === 'processing').length,
        averageDuration: Math.round(averageDuration),
        mock: true
      })
    };
  }

  // Default endpoint info
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      service: 'Enhanced Mock Automation Content Generator',
      environment: 'development',
      endpoints: {
        'POST /': 'Generate mock content',
        'GET /?action=health': 'Health check',
        'GET /?action=stats': 'Statistics',
        'GET /?action=status&sessionId=ID': 'Session status'
      },
      parameters: {
        required: ['keyword', 'anchorText', 'targetUrl'],
        optional: ['testMode', 'simulateDelay', 'simulateError', 'errorType', 'contentVariations']
      },
      mock: true
    })
  };
}

function generateEnhancedMockContent(keyword, anchorText, targetUrl, variation = 0) {
  const contentTypes = ['article', 'blog_post', 'reader_friendly', 'technical', 'listicle'];
  const type = contentTypes[variation % contentTypes.length];

  const templates = {
    article: {
      title: `${keyword}: A Comprehensive Analysis`,
      content: `<h1>${keyword}: A Comprehensive Analysis</h1>
<p>In today's rapidly evolving digital landscape, understanding ${keyword} has become paramount for businesses seeking sustainable growth and competitive advantage.</p>

<h2>Executive Summary</h2>
<p>This comprehensive analysis examines the multifaceted aspects of ${keyword}, providing stakeholders with actionable insights and strategic recommendations.</p>

<h2>Key Findings</h2>
<ul>
<li>Market demand for ${keyword} solutions has increased by 300% over the past year</li>
<li>Organizations implementing ${keyword} strategies report 45% improvement in operational efficiency</li>
<li>ROI on ${keyword} investments typically exceeds 200% within the first 18 months</li>
</ul>

<h2>Strategic Recommendations</h2>
<p>Based on our research and industry best practices, organizations should prioritize ${keyword} implementation as a core business strategy. For expert guidance and proven solutions, consider partnering with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>.</p>

<h2>Implementation Framework</h2>
<p>Successful ${keyword} deployment requires a structured approach encompassing technology assessment, stakeholder alignment, and phased rollout strategies.</p>

<h2>Conclusion</h2>
<p>The evidence overwhelmingly supports the strategic value of ${keyword} in driving organizational success. Companies that delay implementation risk falling behind competitors who are already leveraging these capabilities.</p>`
    },

    blog_post: {
      title: `Why ${keyword} is a Game-Changer (And How to Get Started)`,
      content: `<h1>Why ${keyword} is a Game-Changer (And How to Get Started)</h1>
<p>Hey there! 👋 If you've been hearing buzz about ${keyword} lately, you're not alone. It seems like everyone's talking about it, and for good reason!</p>

<h2>What's All the Fuss About?</h2>
<p>Let me tell you why ${keyword} has captured everyone's attention. It's not just another trending topic – it's genuinely transforming how we approach business challenges.</p>

<h2>My Personal Experience</h2>
<p>When I first encountered ${keyword}, I was skeptical. But after seeing the results firsthand, I became a true believer. Here's what happened...</p>

<h2>5 Reasons Why ${keyword} Matters</h2>
<ol>
<li><strong>Efficiency Boost:</strong> Streamlines complex processes</li>
<li><strong>Cost Savings:</strong> Reduces operational overhead</li>
<li><strong>Scalability:</strong> Grows with your business</li>
<li><strong>Innovation:</strong> Opens new possibilities</li>
<li><strong>Competitive Edge:</strong> Differentiates from competitors</li>
</ol>

<h2>Getting Started: Your Action Plan</h2>
<p>Ready to dive in? Here's my recommended approach. First, educate yourself with reliable resources – I highly recommend <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> for comprehensive guidance.</p>

<h2>Common Pitfalls to Avoid</h2>
<p>Don't make the same mistakes I did! Here are the top 3 pitfalls and how to sidestep them.</p>

<h2>What's Next?</h2>
<p>The ${keyword} landscape is constantly evolving. Stay ahead of the curve by keeping up with the latest trends and best practices. Your future self will thank you!</p>`
    },

    reader_friendly: {
      title: `${keyword} Explained Simply`,
      content: `<h1>${keyword} Explained Simply</h1>
<p>Ever wondered what ${keyword} is all about? Don't worry – I'll break it down in simple terms that anyone can understand!</p>

<h2>The Basics</h2>
<p>Think of ${keyword} like a Swiss Army knife for modern business. It's a versatile tool that helps solve multiple problems at once.</p>

<h2>Why Should You Care?</h2>
<p>Here's the thing: ${keyword} isn't just for tech experts or big corporations. It can benefit anyone who wants to:</p>
<ul>
<li>Save time on repetitive tasks</li>
<li>Make better decisions with data</li>
<li>Stay competitive in their field</li>
<li>Improve customer satisfaction</li>
</ul>

<h2>How Does It Work?</h2>
<p>Without getting too technical, ${keyword} works by automating complex processes and providing insights that would take humans much longer to discover.</p>

<h2>Real-World Examples</h2>
<p>Let me share some examples of how people are using ${keyword} in everyday situations...</p>

<h2>Getting Help</h2>
<p>If you're interested in learning more or need expert assistance, <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> offers beginner-friendly resources and support.</p>

<h2>Your Next Steps</h2>
<p>Ready to explore ${keyword} further? Start small, be patient with yourself, and don't hesitate to ask for help when you need it!</p>`
    },

    technical: {
      title: `Technical Deep Dive: ${keyword} Architecture and Implementation`,
      content: `<h1>Technical Deep Dive: ${keyword} Architecture and Implementation</h1>
<p>This technical analysis explores the architectural patterns, implementation strategies, and performance considerations for ${keyword} systems.</p>

<h2>System Architecture</h2>
<p>Modern ${keyword} implementations typically follow a microservices architecture pattern, enabling scalability and maintainability across distributed environments.</p>

<h2>Core Components</h2>
<ul>
<li>Data ingestion layer with real-time streaming capabilities</li>
<li>Processing engine with distributed computing framework</li>
<li>Storage layer optimized for both OLTP and OLAP workloads</li>
<li>API gateway for secure external integrations</li>
</ul>

<h2>Performance Metrics</h2>
<p>Key performance indicators include throughput (requests/second), latency (p99 < 100ms), and system availability (99.9% uptime SLA).</p>

<h2>Implementation Best Practices</h2>
<p>For enterprise-grade ${keyword} implementations, consider leveraging proven platforms and frameworks. <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> provides enterprise-ready solutions with comprehensive technical documentation.</p>

<h2>Security Considerations</h2>
<p>Implement end-to-end encryption, role-based access control, and comprehensive audit logging to ensure data security and compliance.</p>

<h2>Scalability Patterns</h2>
<p>Horizontal scaling through containerization and orchestration platforms enables dynamic resource allocation based on demand patterns.</p>`
    },

    listicle: {
      title: `10 Things You Need to Know About ${keyword}`,
      content: `<h1>10 Things You Need to Know About ${keyword}</h1>
<p>Whether you're new to ${keyword} or looking to expand your knowledge, these insights will give you a comprehensive understanding of what matters most.</p>

<h2>1. It's More Important Than You Think</h2>
<p>The impact of ${keyword} extends far beyond its obvious applications, influencing everything from daily operations to strategic planning.</p>

<h2>2. Not All Solutions Are Created Equal</h2>
<p>When evaluating ${keyword} options, focus on scalability, security, and long-term support rather than just initial cost.</p>

<h2>3. Implementation Timing Matters</h2>
<p>The best time to start with ${keyword} was yesterday. The second-best time is now.</p>

<h2>4. ROI Is Measurable</h2>
<p>Unlike some business investments, ${keyword} initiatives typically show clear, quantifiable returns within the first year.</p>

<h2>5. Expert Guidance Accelerates Success</h2>
<p>While ${keyword} can be learned independently, partnering with experts like <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> can significantly reduce implementation time and risk.</p>

<h2>6. Common Myths Debunked</h2>
<p>Contrary to popular belief, ${keyword} isn't just for large enterprises – small businesses often see the biggest relative benefits.</p>

<h2>7. Future-Proofing Is Essential</h2>
<p>Choose ${keyword} solutions that can evolve with your business and adapt to changing market conditions.</p>

<h2>8. Integration Capabilities Matter</h2>
<p>The best ${keyword} solutions play well with existing systems rather than requiring complete infrastructure overhauls.</p>

<h2>9. Training Investment Pays Off</h2>
<p>Investing in team education and training multiplies the value of your ${keyword} implementation.</p>

<h2>10. The Learning Never Stops</h2>
<p>The ${keyword} landscape evolves rapidly – staying current with trends and best practices is crucial for long-term success.</p>`
    }
  };

  const template = templates[type];
  const wordCount = countWords(template.content);

  return {
    type,
    title: template.title,
    content: template.content,
    wordCount,
    metadata: {
      variation,
      generatedAt: new Date().toISOString(),
      contentType: type,
      estimatedReadTime: Math.ceil(wordCount / 200) // Assuming 200 words per minute
    }
  };
}

function countWords(text) {
  // Remove HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, '');
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
}
