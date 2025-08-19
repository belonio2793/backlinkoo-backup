import { supabase } from '@/integrations/supabase/client';

export const testDomainDatabase = async (): Promise<{
  tableExists: boolean;
  functionsExist: boolean;
  error?: string;
}> => {
  try {
    // Test if table exists by trying a simple query
    const { error: tableError } = await supabase
      .from('domain_blog_themes')
      .select('id')
      .limit(1);

    const tableExists = !tableError || !tableError.message?.includes('does not exist');

    // Test if functions exist
    let functionsExist = false;
    try {
      const { error: funcError } = await supabase.rpc('update_domain_blog_theme', {
        p_domain_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_theme_id: 'test',
        p_theme_name: 'test'
      });
      
      // Function exists if we get a different error (not "function not found")
      functionsExist = !funcError?.message?.includes('Could not find the function');
    } catch (e) {
      functionsExist = false;
    }

    return {
      tableExists,
      functionsExist,
      error: tableError?.message
    };

  } catch (error) {
    return {
      tableExists: false,
      functionsExist: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Export as window function for easy testing
if (typeof window !== 'undefined') {
  (window as any).testDomainDatabase = testDomainDatabase;
}
