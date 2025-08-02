import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Get Supabase configuration
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing Supabase configuration',
          available_env: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceRoleKey
          }
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Creating Supabase admin client...');

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test basic connectivity
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database connection failed',
          details: connectionError.message
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Database connection successful');

    // Get auth users using admin API
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Failed to get auth users:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve auth users',
          details: authError.message
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Retrieved ${authUsers.users.length} auth users`);

    // Get profiles data
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        user_id,
        email,
        display_name,
        role,
        created_at,
        is_premium,
        subscription_status
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (profilesError) {
      console.warn('⚠️ Failed to get profiles:', profilesError);
    } else {
      console.log(`✅ Retrieved ${profiles?.length || 0} profiles`);
    }

    // Get table information
    const tables = ['profiles', 'subscribers', 'blog_posts', 'campaigns', 'orders'];
    const tableInfo = [];

    for (const tableName of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        tableInfo.push({
          name: tableName,
          accessible: !error,
          rowCount: count || 0,
          error: error?.message
        });
      } catch (err: any) {
        tableInfo.push({
          name: tableName,
          accessible: false,
          error: err.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        auth_users: authUsers.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          role: user.role
        })),
        profiles: profiles || [],
        table_info: tableInfo,
        stats: {
          total_auth_users: authUsers.users.length,
          total_profiles: profiles?.length || 0,
          accessible_tables: tableInfo.filter(t => t.accessible).length
        }
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const config: Config = {
  path: "/api/get-auth-users"
};
