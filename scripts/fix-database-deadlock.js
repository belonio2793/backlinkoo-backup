#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Check for active database connections and potential deadlocks
 */
async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...');
  
  try {
    // Simple connectivity test
    const { data, error } = await supabase
      .from('auth.users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Database connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Database status check failed:', error.message);
    return false;
  }
}

/**
 * Retry database operation with exponential backoff
 */
async function retryOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
      const result = await operation();
      console.log('✅ Operation completed successfully');
      return result;
    } catch (error) {
      const isDeadlock = error.message.includes('deadlock detected') || 
                        error.message.includes('40P01');
      
      if (isDeadlock && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⚠️  Deadlock detected. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error(`❌ Operation failed (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

/**
 * Create domains table with deadlock protection
 */
async function createDomainsTableSafely() {
  console.log('🚀 Creating domains table with deadlock protection...');
  
  const createTableOperation = async () => {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create domains table
        CREATE TABLE IF NOT EXISTS domains (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          domain text NOT NULL,
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'active', 'failed', 'expired')),
          
          -- DNS Configuration
          verification_token text NOT NULL DEFAULT 'blo-' || substr(gen_random_uuid()::text, 1, 12),
          required_a_record inet,
          required_cname text,
          hosting_provider text DEFAULT 'backlinkoo',
          
          -- Validation tracking
          dns_validated boolean DEFAULT false,
          txt_record_validated boolean DEFAULT false,
          a_record_validated boolean DEFAULT false,
          cname_validated boolean DEFAULT false,
          ssl_enabled boolean DEFAULT false,
          
          -- Metadata
          last_validation_attempt timestamptz,
          validation_error text,
          auto_retry_count integer DEFAULT 0,
          max_retries integer DEFAULT 10,
          
          -- Blog integration
          blog_enabled boolean DEFAULT false,
          blog_subdirectory text DEFAULT 'blog',
          pages_published integer DEFAULT 0,
          
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          
          UNIQUE(user_id, domain)
        );
      `
    });
    
    if (error) throw error;
  };
  
  await retryOperation(createTableOperation);
}

/**
 * Setup RLS policies with deadlock protection
 */
async function setupRLSPolicies() {
  console.log('🔒 Setting up RLS policies...');
  
  const rlsOperation = async () => {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own domains" ON domains;
        DROP POLICY IF EXISTS "Users can insert own domains" ON domains;
        DROP POLICY IF EXISTS "Users can update own domains" ON domains;
        DROP POLICY IF EXISTS "Users can delete own domains" ON domains;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own domains" ON domains
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own domains" ON domains
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own domains" ON domains
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own domains" ON domains
          FOR DELETE USING (auth.uid() = user_id);
      `
    });
    
    if (error) throw error;
  };
  
  await retryOperation(rlsOperation);
}

/**
 * Create indexes with deadlock protection
 */
async function createIndexes() {
  console.log('📊 Creating indexes...');
  
  const indexOperation = async () => {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
        CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
        CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
        CREATE INDEX IF NOT EXISTS idx_domains_validation ON domains(dns_validated, status);
      `
    });
    
    if (error) throw error;
  };
  
  await retryOperation(indexOperation);
}

/**
 * Kill any long-running queries that might cause deadlocks
 */
async function killLongRunningQueries() {
  console.log('🔪 Checking for long-running queries...');
  
  try {
    const { data: queries, error } = await supabase.rpc('get_long_running_queries');
    
    if (error) {
      console.log('ℹ️  Cannot check long-running queries (requires admin privileges)');
      return;
    }
    
    if (queries && queries.length > 0) {
      console.log(`⚠️  Found ${queries.length} long-running queries`);
      // In production, you might want to terminate these
      // This requires admin privileges
    } else {
      console.log('✅ No long-running queries found');
    }
  } catch (error) {
    console.log('ℹ️  Could not check queries:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🛠️  Database Deadlock Fix & Setup Tool');
  console.log('=====================================\n');
  
  try {
    // Check database status
    const isHealthy = await checkDatabaseStatus();
    if (!isHealthy) {
      console.log('❌ Database connection issues detected. Please check your Supabase configuration.');
      process.exit(1);
    }
    
    // Kill long-running queries
    await killLongRunningQueries();
    
    // Wait a moment to ensure any deadlocks have resolved
    console.log('⏳ Waiting for any active deadlocks to resolve...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create domains table
    await createDomainsTableSafely();
    
    // Setup RLS policies
    await setupRLSPolicies();
    
    // Create indexes
    await createIndexes();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ The domains table is now ready to use.');
    console.log('🔄 You can now refresh the /domains page to access the full interface.');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.message.includes('deadlock')) {
      console.log('\n💡 Deadlock Prevention Tips:');
      console.log('  1. Avoid running multiple database scripts simultaneously');
      console.log('  2. Close other database connections during setup');
      console.log('  3. Try running this script again in a few minutes');
    }
    
    if (error.message.includes('permission') || error.message.includes('privilege')) {
      console.log('\n💡 Permission Tips:');
      console.log('  1. Make sure your Supabase service role key is configured');
      console.log('  2. Run the SQL script manually in Supabase dashboard instead');
    }
    
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'check':
    checkDatabaseStatus().then(healthy => {
      process.exit(healthy ? 0 : 1);
    });
    break;
  case 'create':
    createDomainsTableSafely().then(() => {
      console.log('✅ Domains table created');
    }).catch(error => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
    break;
  default:
    main();
}
