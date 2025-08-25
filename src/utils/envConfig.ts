/**
 * Environment configuration for domain management
 */

export const ENV_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Netlify Configuration  
  NETLIFY_SITE_ID: import.meta.env.VITE_NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
  
  // Note: NETLIFY_ACCESS_TOKEN should only be set in Supabase Edge Functions environment
  // Never expose it to the frontend
} as const;

export const validateEnvConfig = (): { isValid: boolean; missingVars: string[] } => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = import.meta.env[varName];
    return !value || value.trim() === '';
  });
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
};

export const getSupabaseConfig = () => ({
  url: ENV_CONFIG.SUPABASE_URL,
  anonKey: ENV_CONFIG.SUPABASE_ANON_KEY
});

export const getNetlifyConfig = () => ({
  siteId: ENV_CONFIG.NETLIFY_SITE_ID
});

/**
 * Instructions for setting up environment variables
 */
export const ENV_SETUP_INSTRUCTIONS = {
  supabase: {
    url: 'Get from Supabase Dashboard > Settings > API > Project URL',
    anonKey: 'Get from Supabase Dashboard > Settings > API > Project API keys > anon public'
  },
  netlify: {
    siteId: 'Get from Netlify Dashboard > Site Settings > General > Site Information > App ID',
    accessToken: 'Get from Netlify Dashboard > User Settings > Applications > Personal access tokens (FOR EDGE FUNCTIONS ONLY)'
  }
};
