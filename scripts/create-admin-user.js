#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Creates an admin user with the specified email and sets up admin privileges
 */

import { createClient } from '@supabase/supabase-js';
import { SecureConfig } from './secure-config.js';

class AdminUserCreator {
  constructor() {
    this.supabaseUrl = SecureConfig.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SecureConfig.SUPABASE_ACCESS_TOKEN;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }

    // Create admin client with service role key
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Create admin user with email support@backlinkoo.com
   */
  async createAdminUser(email = 'support@backlinkoo.com', password = 'Admin123!@#') {
    console.log('🔧 Creating admin user...');
    console.log(`   Email: ${email}`);

    try {
      // Step 1: Create the auth user
      console.log('📝 Creating authentication user...');
      
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Support Admin',
          display_name: 'Support Team'
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log('👤 User already exists, updating to admin...');
          
          // Get the existing user
          const { data: users, error: listError } = await this.supabase.auth.admin.listUsers();
          if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
          }
          
          const existingUser = users.users.find(u => u.email === email);
          if (!existingUser) {
            throw new Error('User exists but could not be found');
          }

          authData.user = existingUser;
        } else {
          throw new Error(`Failed to create user: ${authError.message}`);
        }
      }

      const user = authData.user;
      console.log(`✅ User created/found: ${user.id}`);

      // Step 2: Create or update the profile with admin role
      console.log('👑 Setting admin role in profile...');
      
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: email,
          full_name: 'Support Admin',
          display_name: 'Support Team',
          role: 'admin',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('✅ Profile created/updated:', profileData);

      // Step 3: Verify admin access
      console.log('🔍 Verifying admin access...');
      
      const { data: verifyData, error: verifyError } = await this.supabase
        .from('profiles')
        .select('role, email, full_name')
        .eq('user_id', user.id)
        .single();

      if (verifyError) {
        throw new Error(`Failed to verify admin: ${verifyError.message}`);
      }

      if (verifyData.role !== 'admin') {
        throw new Error('User was created but admin role was not set properly');
      }

      console.log('✅ Admin verification successful:', verifyData);

      // Step 4: Test admin permissions
      console.log('🧪 Testing admin permissions...');
      
      try {
        const { data: testData, error: testError } = await this.supabase
          .from('profiles')
          .select('count(*)')
          .single();

        if (testError) {
          console.warn('⚠️ Admin permissions test failed:', testError.message);
        } else {
          console.log('✅ Admin permissions verified');
        }
      } catch (error) {
        console.warn('⚠️ Could not test admin permissions:', error.message);
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: email,
          role: 'admin'
        },
        credentials: {
          email: email,
          password: password
        }
      };

    } catch (error) {
      console.error('❌ Admin user creation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all admin users
   */
  async listAdminUsers() {
    console.log('📋 Listing admin users...');

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('user_id, email, full_name, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list admins: ${error.message}`);
      }

      if (data.length === 0) {
        console.log('👤 No admin users found');
        return { admins: [] };
      }

      console.log(`👑 Found ${data.length} admin user(s):`);
      data.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.full_name || 'No name'}) - Created: ${admin.created_at}`);
      });

      return { admins: data };

    } catch (error) {
      console.error('❌ Failed to list admin users:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Verify database connection
   */
  async testConnection() {
    console.log('🔌 Testing Supabase connection...');

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count(*)')
        .single();

      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'create';
  const email = process.argv[3] || 'support@backlinkoo.com';
  const password = process.argv[4] || 'Admin123!@#';

  const creator = new AdminUserCreator();

  switch (command) {
    case 'create':
      creator.createAdminUser(email, password).then(result => {
        if (result.success) {
          console.log('');
          console.log('🎉 Admin user creation completed!');
          console.log('');
          console.log('📋 Login Credentials:');
          console.log(`   Email: ${result.credentials.email}`);
          console.log(`   Password: ${result.credentials.password}`);
          console.log('');
          console.log('🔗 Access URLs:');
          console.log('   Local: http://localhost:8080/admin');
          console.log('   Production: https://backlinkoo.com/admin');
          console.log('');
          console.log('⚠️  Important: Change the password after first login!');
        } else {
          console.error('❌ Admin user creation failed:', result.error);
          process.exit(1);
        }
      });
      break;

    case 'list':
      creator.listAdminUsers();
      break;

    case 'test':
      creator.testConnection();
      break;

    default:
      console.log(`
🔐 Admin User Management Commands:

  create [email] [password]  - Create admin user (default: support@backlinkoo.com)
  list                      - List all admin users
  test                      - Test database connection

Examples:
  node scripts/create-admin-user.js create
  node scripts/create-admin-user.js create admin@example.com MyPassword123
  node scripts/create-admin-user.js list
  node scripts/create-admin-user.js test
      `);
  }
}

export default AdminUserCreator;
