/**
 * Comprehensive Domain Status Checker
 *
 * Orchestrates validation across multiple systems:
 * - Netlify configuration and routing
 * - Cloudflare DNS validation
 * - SSL certificate status
 * - Overall domain health assessment
 *
 * Provides a single endpoint for complete domain status information.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      }),
    };
  }

  try {
    console.log('Starting comprehensive domain status check...');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('Status check request:', { 
          domain: requestData.domain,
          checks: requestData.checks || ['all'],
          priority: requestData.priority || 'standard'
        });
      } catch (error) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body'
          }),
        };
      }
    }

    const { 
      domain,
      checks = ['all'],
      priority = 'standard',
      includeHistory = false,
      includeSuggestions = true
    } = requestData;

    if (!domain) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Domain is required'
        }),
      };
    }

    // Clean the domain name
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    console.log(`Comprehensive status check for: ${cleanDomain}`);

    // Determine which checks to run
    const checkConfiguration = determineChecksToRun(checks, priority);
    console.log('Running checks:', checkConfiguration.enabled);

    // Initialize status tracking
    const statusTracker = {
      domain: cleanDomain,
      started_at: new Date().toISOString(),
      checks_requested: checks,
      priority: priority,
      results: {},
      overall_status: 'checking'
    };

    // Run parallel validations based on configuration
    const validationPromises = [];

    if (checkConfiguration.netlify) {
      validationPromises.push(
        performNetlifyValidation(cleanDomain).catch(error => ({
          service: 'netlify',
          error: error.message,
          success: false
        }))
      );
    }

    if (checkConfiguration.dns) {
      validationPromises.push(
        performDnsValidation(cleanDomain).catch(error => ({
          service: 'dns',
          error: error.message,
          success: false
        }))
      );
    }

    if (checkConfiguration.ssl) {
      validationPromises.push(
        performSslValidation(cleanDomain).catch(error => ({
          service: 'ssl',
          error: error.message,
          success: false
        }))
      );
    }

    if (checkConfiguration.connectivity) {
      validationPromises.push(
        performConnectivityCheck(cleanDomain).catch(error => ({
          service: 'connectivity',
          error: error.message,
          success: false
        }))
      );
    }

    // Wait for all validations to complete
    console.log(`⏳ Running ${validationPromises.length} validation checks...`);
    const validationResults = await Promise.allSettled(validationPromises);

    // Process validation results
    const processedResults = processValidationResults(validationResults, statusTracker);

    // Calculate comprehensive status
    const comprehensiveStatus = calculateComprehensiveStatus(processedResults);

    // Generate actionable recommendations
    const recommendations = includeSuggestions 
      ? generateActionableRecommendations(cleanDomain, processedResults, comprehensiveStatus)
      : [];

    // Generate deployment and routing information
    const deploymentInfo = generateComprehensiveDeploymentInfo(cleanDomain, processedResults);

    // Build final response
    const finalResponse = {
      success: true,
      domain: cleanDomain,
      status: comprehensiveStatus,
      validations: processedResults,
      deployment: deploymentInfo,
      recommendations: recommendations,
      timing: {
        started_at: statusTracker.started_at,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(statusTracker.started_at).getTime()
      },
      metadata: {
        checks_run: checkConfiguration.enabled,
        priority_level: priority,
        validation_id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    console.log('Comprehensive validation complete:', {
      domain: cleanDomain,
      overall_status: comprehensiveStatus.overall,
      checks_completed: Object.keys(processedResults).length,
      issues_found: comprehensiveStatus.issues.length,
      duration_ms: finalResponse.timing.duration_ms
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(finalResponse),
    };

  } catch (error) {
    console.error('Error in comprehensive domain status check:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Comprehensive status check failed',
        details: 'Check server logs for more information'
      }),
    };
  }
};

/**
 * Determine which checks to run based on configuration
 */
function determineChecksToRun(checks, priority) {
  const allChecks = ['netlify', 'dns', 'ssl', 'connectivity'];
  let enabled = [];

  if (checks.includes('all')) {
    enabled = [...allChecks];
  } else {
    enabled = checks.filter(check => allChecks.includes(check));
  }

  // Adjust based on priority
  if (priority === 'fast') {
    // Fast mode: skip heavy checks
    enabled = enabled.filter(check => !['connectivity'].includes(check));
  } else if (priority === 'critical') {
    // Critical mode: only essential checks
    enabled = enabled.filter(check => ['netlify', 'dns'].includes(check));
  }

  return {
    enabled,
    netlify: enabled.includes('netlify'),
    dns: enabled.includes('dns'),
    ssl: enabled.includes('ssl'),
    connectivity: enabled.includes('connectivity')
  };
}

/**
 * Perform Netlify validation using enhanced validation function
 */
async function performNetlifyValidation(domain) {
  try {
    console.log(`Running Netlify validation for ${domain}...`);

    const response = await fetch('/.netlify/functions/netlify-enhanced-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        action: 'comprehensive',
        includeDns: false, // We'll do DNS separately
        includeRouting: true,
        includeSsl: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        service: 'netlify',
        success: result.success,
        ...result
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Netlify validation failed: ${errorText}`);
    }

  } catch (error) {
    console.error(`Netlify validation failed for ${domain}:`, error);
    return {
      service: 'netlify',
      success: false,
      error: error.message
    };
  }
}

/**
 * Perform DNS validation using Cloudflare function
 */
async function performDnsValidation(domain) {
  try {
    console.log(`Running DNS validation for ${domain}...`);

    const response = await fetch('/.netlify/functions/cloudflare-dns-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        action: 'validate'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        service: 'dns',
        success: result.success,
        ...result
      };
    } else {
      const errorText = await response.text();
      throw new Error(`DNS validation failed: ${errorText}`);
    }

  } catch (error) {
    console.error(`DNS validation failed for ${domain}:`, error);
    return {
      service: 'dns',
      success: false,
      error: error.message
    };
  }
}

/**
 * Perform SSL certificate validation
 */
async function performSslValidation(domain) {
  try {
    console.log(`Running SSL validation for ${domain}...`);

    const response = await fetch('/.netlify/functions/netlify-enhanced-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        action: 'ssl'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        service: 'ssl',
        success: result.success,
        ssl_info: result.ssl,
        domain: domain
      };
    } else {
      // Fallback SSL check
      return await performFallbackSslCheck(domain);
    }

  } catch (error) {
    console.error(`SSL validation failed for ${domain}:`, error);
    return await performFallbackSslCheck(domain);
  }
}

/**
 * Fallback SSL check using simple HTTPS request
 */
async function performFallbackSslCheck(domain) {
  try {
    // Simple HTTPS connectivity test
    const httpsUrl = `https://${domain}`;
    const startTime = Date.now();
    
    const response = await fetch(httpsUrl, {
      method: 'HEAD',
      timeout: 10000
    });

    const responseTime = Date.now() - startTime;

    return {
      service: 'ssl',
      success: true,
      ssl_info: {
        https_accessible: response.ok,
        response_time_ms: responseTime,
        status_code: response.status,
        fallback_check: true
      },
      domain: domain
    };

  } catch (error) {
    return {
      service: 'ssl',
      success: false,
      ssl_info: {
        https_accessible: false,
        error: error.message,
        fallback_check: true
      },
      domain: domain
    };
  }
}

/**
 * Perform connectivity and performance check
 */
async function performConnectivityCheck(domain) {
  try {
    console.log(`🌍 Running connectivity check for ${domain}...`);

    const checks = await Promise.allSettled([
      checkHttpConnectivity(domain),
      checkHttpsConnectivity(domain),
      checkResponseHeaders(domain)
    ]);

    return {
      service: 'connectivity',
      success: true,
      connectivity: {
        http: checks[0].status === 'fulfilled' ? checks[0].value : { error: checks[0].reason?.message },
        https: checks[1].status === 'fulfilled' ? checks[1].value : { error: checks[1].reason?.message },
        headers: checks[2].status === 'fulfilled' ? checks[2].value : { error: checks[2].reason?.message }
      },
      domain: domain
    };

  } catch (error) {
    console.error(`❌ Connectivity check failed for ${domain}:`, error);
    return {
      service: 'connectivity',
      success: false,
      error: error.message,
      domain: domain
    };
  }
}

/**
 * Check HTTP connectivity
 */
async function checkHttpConnectivity(domain) {
  const startTime = Date.now();
  try {
    const response = await fetch(`http://${domain}`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    return {
      accessible: true,
      status_code: response.status,
      response_time_ms: Date.now() - startTime,
      redirects_to_https: response.status >= 300 && response.status < 400
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      response_time_ms: Date.now() - startTime
    };
  }
}

/**
 * Check HTTPS connectivity
 */
async function checkHttpsConnectivity(domain) {
  const startTime = Date.now();
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    return {
      accessible: true,
      status_code: response.status,
      response_time_ms: Date.now() - startTime,
      ssl_valid: true
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      response_time_ms: Date.now() - startTime,
      ssl_valid: false
    };
  }
}

/**
 * Check response headers for additional information
 */
async function checkResponseHeaders(domain) {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      server: headers.server || 'unknown',
      powered_by: headers['x-powered-by'] || 'unknown',
      netlify_detected: !!(headers['x-nf-request-id'] || headers.server?.includes('Netlify')),
      cache_control: headers['cache-control'] || 'none',
      security_headers: {
        hsts: !!headers['strict-transport-security'],
        csp: !!headers['content-security-policy'],
        x_frame_options: !!headers['x-frame-options']
      }
    };
  } catch (error) {
    return {
      error: error.message,
      netlify_detected: false
    };
  }
}

/**
 * Process validation results from all services
 */
function processValidationResults(validationResults, statusTracker) {
  const processed = {};

  validationResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      processed[data.service] = data;
    } else {
      // Handle rejected promises
      const serviceName = `unknown_${index}`;
      processed[serviceName] = {
        service: serviceName,
        success: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });

  return processed;
}

/**
 * Calculate comprehensive status from all validation results
 */
function calculateComprehensiveStatus(results) {
  const issues = [];
  const warnings = [];
  const successes = [];
  let overall = 'healthy';

  // Analyze each service result
  Object.values(results).forEach(result => {
    if (!result.success) {
      issues.push(`${result.service}: ${result.error || 'Validation failed'}`);
      overall = 'error';
    } else {
      successes.push(`${result.service}: Validation passed`);
      
      // Check for warnings in successful results
      if (result.validation?.issues?.length > 0) {
        warnings.push(...result.validation.issues.map(issue => `${result.service}: ${issue}`));
        if (overall === 'healthy') overall = 'warning';
      }
    }
  });

  // Special case: if Netlify is working but DNS has issues, it's a warning not error
  if (results.netlify?.success && !results.dns?.success && overall === 'error') {
    overall = 'warning';
  }

  return {
    overall,
    issues,
    warnings,
    successes,
    services_checked: Object.keys(results).length,
    services_healthy: successes.length,
    services_with_issues: issues.length,
    services_with_warnings: warnings.length
  };
}

/**
 * Generate actionable recommendations based on validation results
 */
function generateActionableRecommendations(domain, results, status) {
  const recommendations = [];

  // Critical issues first
  if (!results.netlify?.success) {
    recommendations.push({
      priority: 'critical',
      action: 'Add domain to Netlify',
      description: `Domain ${domain} is not configured in Netlify site. Add it as an alias or custom domain.`,
      instructions: [
        'Go to Netlify dashboard → Site settings → Domain management',
        `Add ${domain} as domain alias`,
        'Follow DNS configuration instructions'
      ],
      estimated_time: '5-10 minutes'
    });
  }

  if (results.dns && !results.dns.success) {
    recommendations.push({
      priority: 'high',
      action: 'Configure DNS records',
      description: 'DNS records need to be updated to point to Netlify.',
      instructions: [
        'Log into your DNS provider (Cloudflare)',
        'Add CNAME record pointing to backlinkoo.netlify.app',
        'Wait for DNS propagation (5-30 minutes)'
      ],
      estimated_time: '5-30 minutes'
    });
  }

  if (results.ssl && !results.ssl.ssl_info?.https_accessible) {
    recommendations.push({
      priority: 'medium',
      action: 'Enable HTTPS',
      description: 'SSL certificate needs to be provisioned or configured.',
      instructions: [
        'Ensure DNS is properly configured first',
        'Wait for Netlify to automatically provision SSL certificate',
        'Check domain SSL settings in Netlify dashboard'
      ],
      estimated_time: '10-60 minutes'
    });
  }

  // Optimization recommendations
  if (status.overall === 'healthy') {
    recommendations.push({
      priority: 'low',
      action: 'Optimize performance',
      description: 'Domain is working well. Consider performance optimizations.',
      instructions: [
        'Enable Netlify CDN if not already active',
        'Configure caching headers',
        'Review security headers configuration'
      ],
      estimated_time: '15-30 minutes'
    });
  }

  return recommendations;
}

/**
 * Generate comprehensive deployment information
 */
function generateComprehensiveDeploymentInfo(domain, results) {
  const deploymentInfo = {
    domain: domain,
    status: 'unknown',
    urls: {},
    configuration: {},
    next_steps: []
  };

  if (results.netlify?.success) {
    const netlifyData = results.netlify;
    
    deploymentInfo.status = 'configured';
    deploymentInfo.urls = {
      production: `https://${domain}`,
      netlify_subdomain: netlifyData.deployment?.deployment_urls?.netlify_subdomain,
      admin_dashboard: netlifyData.deployment?.configuration_urls?.domain_management
    };
    
    deploymentInfo.configuration = {
      site_id: netlifyData.netlify?.site_info?.id,
      site_name: netlifyData.netlify?.site_info?.name,
      primary_domain: netlifyData.netlify?.site_info?.primary_domain,
      ssl_enabled: netlifyData.netlify?.configuration?.ssl_enabled
    };
  }

  // Add next steps based on current status
  if (!results.netlify?.success) {
    deploymentInfo.next_steps.push('Add domain to Netlify site configuration');
  }
  
  if (results.dns && !results.dns.success) {
    deploymentInfo.next_steps.push('Configure DNS records to point to Netlify');
  }
  
  if (deploymentInfo.next_steps.length === 0) {
    deploymentInfo.next_steps.push('Domain is fully configured and ready to serve traffic');
  }

  return deploymentInfo;
}
