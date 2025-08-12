// Form Validator Function - Tests form structure and validates posting capability
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { formId } = JSON.parse(event.body || '{}');
    console.log('Form validation request:', { formId });

    if (!formId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'formId parameter required' })
      };
    }

    // Get form data from database
    const { data: formData, error } = await supabase
      .from('form_mappings')
      .select('*')
      .eq('id', formId)
      .single();

    if (error || !formData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Form not found' })
      };
    }

    // Validate the form structure
    const validationResult = await validateFormStructure(formData);

    // Update form status in database
    await supabase
      .from('form_mappings')
      .update({
        status: validationResult.valid ? 'validated' : 'validation_failed',
        validation_result: validationResult,
        last_validated: new Date().toISOString()
      })
      .eq('id', formId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        valid: validationResult.valid,
        confidence: validationResult.confidence,
        issues: validationResult.issues,
        recommendations: validationResult.recommendations,
        formData: {
          url: formData.url,
          domain: formData.domain,
          platform: formData.platform,
          fieldsDetected: Object.keys(formData.fields_mapping || {}).length,
          hiddenFields: Object.keys(formData.hidden_fields || {}).length
        }
      })
    };

  } catch (error) {
    console.error('Form validation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        success: false
      })
    };
  }
};

async function validateFormStructure(formData) {
  const issues = [];
  const recommendations = [];
  const fields = formData.fields_mapping || {};
  const hidden = formData.hidden_fields || {};
  
  let confidence = formData.confidence_score || 0;

  // Validate required fields
  if (!fields.comment) {
    issues.push('No comment field detected');
    confidence -= 20;
  } else {
    confidence += 10;
  }

  if (!fields.name && !fields.email) {
    issues.push('Neither name nor email field detected');
    confidence -= 15;
  } else {
    if (fields.name) confidence += 5;
    if (fields.email) confidence += 8;
  }

  // Validate form method
  if (formData.method?.toUpperCase() !== 'POST') {
    issues.push('Form uses GET method instead of POST');
    recommendations.push('POST method is preferred for comment submissions');
    confidence -= 10;
  }

  // Check for submit selector
  if (!formData.submit_selector) {
    issues.push('No submit button detected');
    recommendations.push('Manual form submission may be required');
    confidence -= 10;
  }

  // Validate action URL
  if (!formData.action_url) {
    recommendations.push('Form submits to same page (no action URL)');
  } else if (!isValidUrl(formData.action_url)) {
    issues.push('Invalid action URL format');
    confidence -= 5;
  }

  // Check for CSRF protection
  const hasCsrfTokens = Object.keys(hidden).some(key => 
    key.toLowerCase().includes('token') || 
    key.toLowerCase().includes('csrf') || 
    key.toLowerCase().includes('_wp_unfiltered')
  );

  if (hasCsrfTokens) {
    recommendations.push('CSRF tokens detected - form has security measures');
    confidence += 5;
  } else {
    recommendations.push('No CSRF tokens detected - may be simpler to automate');
  }

  // Platform-specific validation
  if (formData.platform === 'wordpress') {
    if (!hidden.comment_post_ID) {
      issues.push('WordPress form missing comment_post_ID');
      confidence -= 5;
    }
    if (fields.website) {
      confidence += 3; // WordPress typically has website field
    }
  }

  if (formData.platform === 'substack') {
    recommendations.push('Substack requires account authentication');
    if (!hasCsrfTokens) {
      issues.push('Substack form missing expected security tokens');
      confidence -= 10;
    }
  }

  // Final confidence calculation
  confidence = Math.max(0, Math.min(100, confidence));

  // Overall validation
  const valid = issues.length === 0 && confidence >= 60;

  // Add general recommendations
  if (confidence < 70) {
    recommendations.push('Consider manual testing before automation');
  }
  
  if (fields.website) {
    recommendations.push('Website field available for backlink placement');
  }

  return {
    valid,
    confidence,
    issues,
    recommendations,
    fieldAnalysis: {
      requiredFields: ['comment', fields.name ? 'name' : null, fields.email ? 'email' : null].filter(Boolean),
      optionalFields: [fields.website ? 'website' : null].filter(Boolean),
      hiddenFieldCount: Object.keys(hidden).length,
      securityMeasures: hasCsrfTokens ? ['CSRF tokens'] : []
    },
    automationComplexity: calculateAutomationComplexity(formData, issues.length),
    testingPriority: confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'
  };
}

function calculateAutomationComplexity(formData, issuesCount) {
  let complexity = 'low';
  
  if (issuesCount > 2) {
    complexity = 'high';
  } else if (formData.platform === 'substack' || formData.platform === 'medium') {
    complexity = 'medium'; // Requires authentication
  } else if (Object.keys(formData.hidden_fields || {}).length > 3) {
    complexity = 'medium'; // Many hidden fields
  }
  
  return complexity;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    // Check if it's a relative URL
    return string.startsWith('/') || string.startsWith('./') || string.startsWith('../');
  }
}
