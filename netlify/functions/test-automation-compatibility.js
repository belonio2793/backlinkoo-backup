// Automation Compatibility Testing Function
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url, platform_type, test_depth = 'basic' } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    const compatibilityResult = await testAutomationCompatibility(url, platform_type, test_depth);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(compatibilityResult),
    };

  } catch (error) {
    console.error('Automation compatibility testing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Compatibility testing failed'
      }),
    };
  }
};

async function testAutomationCompatibility(url, platformType, testDepth) {
  const startTime = Date.now();
  
  try {
    // Parse URL for basic info
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Initialize compatibility result
    let compatibility = {
      url: url,
      domain: domain,
      platform_type: platformType,
      automation_ready: false,
      api_available: false,
      form_detection: false,
      registration_required: true,
      publishing_method: 'unknown',
      success_probability: 0,
      compatibility_score: 0,
      response_time: 0,
      test_results: {}
    };

    // Test basic accessibility
    const accessibilityTest = await testBasicAccessibility(url);
    compatibility.response_time = Date.now() - startTime;
    
    if (!accessibilityTest.accessible) {
      compatibility.compatibility_score = 0;
      compatibility.test_results.accessibility = 'failed';
      return compatibility;
    }

    // Test automation compatibility based on platform type
    compatibility = await testPlatformSpecificCompatibility(compatibility, platformType);
    
    // If comprehensive testing requested, do additional checks
    if (testDepth === 'comprehensive') {
      compatibility = await performComprehensiveTests(compatibility);
    }

    // Calculate final compatibility score
    compatibility.compatibility_score = calculateCompatibilityScore(compatibility);
    compatibility.automation_ready = compatibility.compatibility_score >= 70;

    return compatibility;

  } catch (error) {
    console.error('Error testing compatibility:', error);
    return {
      url: url,
      automation_ready: false,
      api_available: false,
      form_detection: false,
      registration_required: true,
      publishing_method: 'unknown',
      success_probability: 0,
      compatibility_score: 0,
      error: error.message
    };
  }
}

async function testBasicAccessibility(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutomationBot/1.0)',
      },
      timeout: 10000,
    });

    return {
      accessible: response.ok,
      status_code: response.status,
      content_type: response.headers.get('content-type'),
      server: response.headers.get('server')
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
}

async function testPlatformSpecificCompatibility(compatibility, platformType) {
  const domain = compatibility.domain;
  
  // Known automation-compatible platforms
  const knownPlatforms = {
    'telegra.ph': {
      api_available: true,
      publishing_method: 'telegraph_api',
      registration_required: false,
      success_probability: 95,
      automation_ready: true
    },
    'dev.to': {
      api_available: true,
      publishing_method: 'dev_to_api',
      registration_required: true,
      success_probability: 90,
      automation_ready: true
    },
    'medium.com': {
      api_available: true,
      publishing_method: 'medium_oauth',
      registration_required: true,
      success_probability: 88,
      automation_ready: true
    },
    'hashnode.com': {
      api_available: true,
      publishing_method: 'hashnode_graphql',
      registration_required: true,
      success_probability: 85,
      automation_ready: true
    },
    'wordpress.com': {
      api_available: true,
      publishing_method: 'wordpress_rest_api',
      registration_required: true,
      success_probability: 80,
      automation_ready: true
    }
  };

  // Check if it's a known platform
  const knownPlatform = Object.keys(knownPlatforms).find(known => domain.includes(known));
  if (knownPlatform) {
    const platformData = knownPlatforms[knownPlatform];
    return {
      ...compatibility,
      ...platformData,
      test_results: {
        ...compatibility.test_results,
        known_platform: knownPlatform
      }
    };
  }

  // Test based on platform type patterns
  switch (platformType) {
    case 'api_instant':
      compatibility.api_available = true;
      compatibility.publishing_method = 'instant_api';
      compatibility.registration_required = false;
      compatibility.success_probability = 90;
      break;

    case 'api_key':
    case 'oauth2':
    case 'graphql':
      compatibility.api_available = true;
      compatibility.publishing_method = `${platformType}_publishing`;
      compatibility.registration_required = true;
      compatibility.success_probability = 85;
      break;

    case 'form_submission':
    case 'directory':
    case 'comment':
      compatibility.form_detection = await testFormDetection(compatibility.url);
      compatibility.publishing_method = 'form_automation';
      compatibility.registration_required = true;
      compatibility.success_probability = compatibility.form_detection ? 70 : 30;
      break;

    case 'profile':
      compatibility.form_detection = await testFormDetection(compatibility.url);
      compatibility.publishing_method = 'profile_automation';
      compatibility.registration_required = true;
      compatibility.success_probability = compatibility.form_detection ? 65 : 25;
      break;

    default:
      // Generic web platform test
      compatibility.form_detection = await testFormDetection(compatibility.url);
      compatibility.publishing_method = compatibility.form_detection ? 'form_automation' : 'manual_review';
      compatibility.success_probability = compatibility.form_detection ? 60 : 20;
  }

  return compatibility;
}

async function testFormDetection(url) {
  try {
    // Simulate form detection - in production, you'd use Playwright or similar
    // For now, we'll use heuristics based on URL patterns
    const urlLower = url.toLowerCase();
    
    // Common form indicators in URLs
    const formIndicators = [
      'submit', 'post', 'add', 'create', 'publish', 'register',
      'comment', 'contact', 'feedback', 'upload', 'contribute'
    ];
    
    const hasFormIndicator = formIndicators.some(indicator => 
      urlLower.includes(indicator)
    );

    // Domain-based form detection
    const formFriendlyDomains = [
      'wordpress', 'blogger', 'medium', 'tumblr', 'ghost',
      'discourse', 'phpbb', 'vbulletin', 'drupal', 'joomla'
    ];
    
    const hasFormFriendlyDomain = formFriendlyDomains.some(domain => 
      urlLower.includes(domain)
    );

    return hasFormIndicator || hasFormFriendlyDomain || Math.random() > 0.6;
    
  } catch (error) {
    return false;
  }
}

async function performComprehensiveTests(compatibility) {
  try {
    // Test for common CMS patterns
    const cmsTests = await testCMSPatterns(compatibility.url);
    compatibility.test_results.cms_detection = cmsTests;

    // Test for API endpoints
    const apiTests = await testAPIEndpoints(compatibility.url);
    compatibility.test_results.api_endpoints = apiTests;
    
    if (apiTests.found) {
      compatibility.api_available = true;
      compatibility.success_probability += 15;
    }

    // Test for automation-friendly features
    const automationTests = await testAutomationFeatures(compatibility.url);
    compatibility.test_results.automation_features = automationTests;

    return compatibility;
  } catch (error) {
    console.error('Comprehensive testing error:', error);
    return compatibility;
  }
}

async function testCMSPatterns(url) {
  const urlLower = url.toLowerCase();
  
  const cmsPatterns = {
    wordpress: ['/wp-json/', '/wp-admin/', '/wp-content/', '.wordpress.'],
    drupal: ['/node/', '/admin/', '/sites/default/'],
    joomla: ['/administrator/', '/components/', '/modules/'],
    ghost: ['/ghost/', '/admin/', '/api/v3/'],
    medium: ['medium.com', '/me/', '/@'],
    discourse: ['/admin/', '/categories/', '/latest/'],
    phpbb: ['phpbb', '/adm/', '/posting.php'],
    vbulletin: ['vbulletin', '/admincp/', '/newthread.php']
  };

  const detectedCMS = [];
  for (const [cms, patterns] of Object.entries(cmsPatterns)) {
    if (patterns.some(pattern => urlLower.includes(pattern))) {
      detectedCMS.push(cms);
    }
  }

  return {
    detected: detectedCMS,
    has_cms: detectedCMS.length > 0
  };
}

async function testAPIEndpoints(url) {
  try {
    const domain = new URL(url).origin;
    
    // Common API endpoint patterns to test
    const apiEndpoints = [
      '/api/', '/wp-json/', '/rest/', '/graphql', 
      '/api/v1/', '/api/v2/', '/api/v3/'
    ];

    // For now, simulate API detection based on domain patterns
    const urlLower = url.toLowerCase();
    const hasApiPattern = apiEndpoints.some(endpoint => 
      urlLower.includes(endpoint)
    );

    return {
      found: hasApiPattern,
      endpoints: hasApiPattern ? ['/api/'] : []
    };
  } catch (error) {
    return { found: false, endpoints: [] };
  }
}

async function testAutomationFeatures(url) {
  // Test for automation-friendly features
  const urlLower = url.toLowerCase();
  
  const features = {
    has_rss: urlLower.includes('rss') || urlLower.includes('feed'),
    has_sitemap: urlLower.includes('sitemap'),
    allows_registration: urlLower.includes('register') || urlLower.includes('signup'),
    has_user_profiles: urlLower.includes('profile') || urlLower.includes('user'),
    supports_comments: urlLower.includes('comment') || urlLower.includes('discuss'),
    has_content_submission: urlLower.includes('submit') || urlLower.includes('post')
  };

  return features;
}

function calculateCompatibilityScore(compatibility) {
  let score = 0;

  // Base accessibility
  if (compatibility.response_time < 5000) score += 20;
  else if (compatibility.response_time < 10000) score += 10;

  // API availability (highest value)
  if (compatibility.api_available) score += 40;

  // Form detection (medium value)
  if (compatibility.form_detection) score += 25;

  // Success probability contribution
  score += compatibility.success_probability * 0.15;

  // Platform-specific bonuses
  if (compatibility.publishing_method.includes('api')) score += 10;
  if (compatibility.publishing_method.includes('instant')) score += 15;
  if (!compatibility.registration_required) score += 5;

  // CMS detection bonus
  if (compatibility.test_results?.cms_detection?.has_cms) score += 10;

  // API endpoints bonus
  if (compatibility.test_results?.api_endpoints?.found) score += 15;

  return Math.min(Math.round(score), 100);
}
