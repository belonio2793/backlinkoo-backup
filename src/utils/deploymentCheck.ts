/**
 * Deployment Status Checker
 * Helps diagnose Netlify function deployment issues
 */

interface DeploymentStatus {
  functionsAvailable: boolean;
  testConnectionWorks: boolean;
  generatePostWorks: boolean;
  errors: string[];
  suggestions: string[];
}

export const checkDeploymentStatus = async (): Promise<DeploymentStatus> => {
  const status: DeploymentStatus = {
    functionsAvailable: false,
    testConnectionWorks: false,
    generatePostWorks: false,
    errors: [],
    suggestions: []
  };

  // Test if Netlify functions are available at all
  try {
    const testResponse = await fetch('/.netlify/functions/test-connection', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (testResponse.ok) {
      status.functionsAvailable = true;
      status.testConnectionWorks = true;
      
      const testData = await testResponse.json();
      console.log('✅ Test connection successful:', testData);
    } else {
      status.errors.push(`Test connection failed: ${testResponse.status} ${testResponse.statusText}`);
      
      if (testResponse.status === 404) {
        status.suggestions.push('Netlify functions are not deployed or not accessible');
        status.suggestions.push('Check Netlify dashboard for deployment status');
        status.suggestions.push('Verify function dependencies are installed');
      }
    }
  } catch (error) {
    status.errors.push(`Network error testing functions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    status.suggestions.push('Check internet connection');
    status.suggestions.push('Verify domain configuration');
  }

  // Test the actual generate-post function
  if (status.functionsAvailable) {
    try {
      const generateResponse = await fetch('/.netlify/functions/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: 'https://example.com',
          keyword: 'test',
          test: true // Add test flag to avoid actual generation
        })
      });

      if (generateResponse.ok) {
        status.generatePostWorks = true;
        console.log('✅ Generate post function is accessible');
      } else {
        status.errors.push(`Generate post function failed: ${generateResponse.status}`);
        
        if (generateResponse.status === 500) {
          status.suggestions.push('Function has internal errors - check environment variables');
          status.suggestions.push('Verify Supabase credentials are set');
        }
      }
    } catch (error) {
      status.errors.push(`Error testing generate-post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add general suggestions based on findings
  if (!status.functionsAvailable) {
    status.suggestions.push('Deploy functions with: npm run build && netlify deploy');
    status.suggestions.push('Install function dependencies: cd netlify/functions && npm install');
    status.suggestions.push('Check netlify.toml configuration');
  }

  return status;
};

export const logDeploymentStatus = async (): Promise<void> => {
  console.log('🔍 Checking deployment status...');
  const status = await checkDeploymentStatus();
  
  console.log('📊 Deployment Status:', {
    functionsAvailable: status.functionsAvailable,
    testConnectionWorks: status.testConnectionWorks,
    generatePostWorks: status.generatePostWorks
  });
  
  if (status.errors.length > 0) {
    console.error('❌ Deployment Errors:', status.errors);
  }
  
  if (status.suggestions.length > 0) {
    console.warn('💡 Suggestions:', status.suggestions);
  }
};

export default checkDeploymentStatus;
