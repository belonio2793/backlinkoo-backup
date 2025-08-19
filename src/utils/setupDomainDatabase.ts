export const setupDomainDatabase = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('🚀 Setting up domain blog themes database...');
    
    const response = await fetch('/.netlify/functions/setup-domain-blog-themes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (result.success) {
      console.log('✅ Database setup completed successfully');
      return {
        success: true,
        message: result.message
      };
    } else {
      throw new Error(result.error || 'Unknown setup error');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Database setup failed:', errorMessage);
    return {
      success: false,
      message: `Database setup failed: ${errorMessage}`
    };
  }
};

// Export as window function for easy access
if (typeof window !== 'undefined') {
  (window as any).setupDomainDatabase = setupDomainDatabase;
}
