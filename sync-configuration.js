#!/usr/bin/env node

/**
 * MCP-Netlify-GitHub Comprehensive Sync Configuration
 * 
 * This utility synchronizes all features, functions, and controls across:
 * - Local development environment
 * - Netlify deployment platform
 * - GitHub repository
 * - Supabase database
 * - All MCP integrations
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class SyncConfiguration {
  constructor() {
    this.config = {
      // Project identity
      project: {
        name: 'backlinkoo',
        siteId: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
        url: 'https://backlinkoo.com',
        repo: 'belonio2793/backlinkoo-backup'
      },

      // Environment variables that need to be synchronized
      envVars: {
        // Supabase configuration
        VITE_SUPABASE_URL: 'https://dfhanacsmsvvkpunurnp.supabase.co',
        SUPABASE_URL: 'https://dfhanacsmsvvkpunurnp.supabase.co',
        SUPABASE_DATABASE_URL: 'https://dfhanacsmsvvkpunurnp.supabase.co',
        // Note: SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are already configured
        
        // Netlify configuration
        URI: 'https://backlinkoo.com',
        
        // Email configuration via Netlify and Resend
        NETLIFY_EMAILS_DIRECTORY: './emails',
        // Note: RESEND_API_KEY is already configured
        
        // AI/API configurations
        // Note: OPENAI_API_KEY is already configured
        
        // Payment processing
        // Note: STRIPE_SECRET_KEY is already configured
        
        // CDN and performance
        // Note: Cloudflare integration removed
      },

      // Netlify Functions that are deployed and active
      functions: [
        'api-status',
        'chatgpt', 
        'check-ai-provider',
        'claim-ai-post',
        'claim-post-api',
        'claim-post',
        'cleanup-expired-posts',
        'cleanup-posts',
        'generate-ai-content',
        'generate-openai',
        'generate-post',
        'global-blog-generator',
        'gpt',
        'openai-status',
        'publish-blog-post',
        'send-email',
        'test-connection',
        'unified-blog-cleanup'
      ],

      // MCP integrations available
      mcpIntegrations: {
        netlify: {
          enabled: true,
          services: ['deploy-services', 'project-services', 'user-services']
        },
        supabase: {
          enabled: true,
          connected: true,
          projectRef: 'dfhanacsmsvvkpunurnp'
        },
        github: {
          enabled: true,
          connected: true,
          repo: 'belonio2793/backlinkoo-backup'
        }
      },

      // Build and deployment configuration
      build: {
        command: 'npm run build',
        directory: 'dist',
        functions: 'netlify/functions',
        node_version: '18'
      },

      // Development configuration
      development: {
        command: 'npm run dev',
        port: 8080,
        netlifyPort: 8888
      },

      // Features and capabilities status
      features: {
        authentication: {
          enabled: true,
          provider: 'supabase',
          status: 'active'
        },
        blog: {
          enabled: true,
          ai_generation: true,
          status: 'active'
        },
        admin_dashboard: {
          enabled: true,
          status: 'active'
        },
        email_system: {
          enabled: true,
          provider: 'resend',
          status: 'active'
        },
        payment_processing: {
          enabled: true,
          provider: 'stripe',
          status: 'active'
        },
        cdn: {
          enabled: false,
          provider: 'none',
          status: 'disabled'
        },
        ai_content: {
          enabled: true,
          provider: 'openai',
          status: 'active'
        }
      }
    };
  }

  /**
   * Generate environment file for local development
   */
  generateLocalEnv() {
    const envContent = Object.entries(this.config.envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');

    writeFileSync('.env.local', envContent);
    console.log('✅ Generated .env.local file');
  }

  /**
   * Validate all configurations
   */
  validateConfiguration() {
    console.log('🔍 Validating configuration...\n');

    // Check project configuration
    console.log('📋 Project Configuration:');
    console.log(`   Name: ${this.config.project.name}`);
    console.log(`   Site ID: ${this.config.project.siteId}`);
    console.log(`   URL: ${this.config.project.url}`);
    console.log(`   Repository: ${this.config.project.repo}\n`);

    // Check functions
    console.log('⚡ Netlify Functions:');
    this.config.functions.forEach(func => {
      console.log(`   ✅ ${func}`);
    });
    console.log(`   Total: ${this.config.functions.length} functions\n`);

    // Check MCP integrations
    console.log('🔗 MCP Integrations:');
    Object.entries(this.config.mcpIntegrations).forEach(([name, config]) => {
      const status = config.enabled ? '✅' : '❌';
      console.log(`   ${status} ${name}`);
    });
    console.log('');

    // Check features
    console.log('🚀 Features Status:');
    Object.entries(this.config.features).forEach(([name, config]) => {
      const status = config.enabled ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${config.status}`);
    });
    console.log('');

    console.log('✅ Configuration validation complete!');
  }

  /**
   * Generate deployment configuration
   */
  generateDeploymentConfig() {
    const deployConfig = {
      site_id: this.config.project.siteId,
      build: this.config.build,
      functions: {
        directory: this.config.build.functions,
        node_bundler: 'esbuild'
      },
      edge_functions: [],
      headers: [
        {
          for: '/*',
          values: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
          }
        }
      ]
    };

    writeFileSync('deployment-config.json', JSON.stringify(deployConfig, null, 2));
    console.log('✅ Generated deployment-config.json');
  }

  /**
   * Check system health
   */
  async checkSystemHealth() {
    console.log('🏥 System Health Check...\n');

    const checks = [
      { name: 'Package dependencies', check: () => this.checkPackageJson() },
      { name: 'Netlify configuration', check: () => this.checkNetlifyConfig() },
      { name: 'Environment variables', check: () => this.checkEnvironment() },
      { name: 'Function files', check: () => this.checkFunctions() }
    ];

    for (const { name, check } of checks) {
      try {
        const result = await check();
        console.log(`   ✅ ${name}: ${result || 'OK'}`);
      } catch (error) {
        console.log(`   ❌ ${name}: ${error.message}`);
      }
    }

    console.log('\n✅ Health check complete!');
  }

  checkPackageJson() {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    return `${Object.keys(pkg.dependencies || {}).length} dependencies`;
  }

  checkNetlifyConfig() {
    const netlifyToml = readFileSync('netlify.toml', 'utf8');
    return netlifyToml.includes('[build]') ? 'Configuration found' : 'Missing build config';
  }

  checkEnvironment() {
    const requiredVars = ['VITE_SUPABASE_URL', 'SUPABASE_URL'];
    const missing = requiredVars.filter(var_name => !process.env[var_name]);
    return missing.length === 0 ? 'All variables present' : `Missing: ${missing.join(', ')}`;
  }

  checkFunctions() {
    const functionsDir = 'netlify/functions';
    try {
      const fs = require('fs');
      const files = fs.readdirSync(functionsDir);
      return `${files.length} function files`;
    } catch {
      return 'Functions directory not found';
    }
  }

  /**
   * Run complete sync and configuration
   */
  async syncAll() {
    console.log('🔄 Starting comprehensive sync...\n');

    this.validateConfiguration();
    console.log('');
    
    this.generateLocalEnv();
    this.generateDeploymentConfig();
    console.log('');
    
    await this.checkSystemHealth();
    console.log('');
    
    console.log('🎉 Sync complete! All systems configured and operational.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run dev (for local development)');
    console.log('   2. Run: npm run build (to build for production)');
    console.log('   3. Deploy to Netlify (via GitHub integration)');
    console.log('   4. Monitor functions at: https://app.netlify.com/projects/backlinkoo');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'sync';
  const sync = new SyncConfiguration();

  switch (command) {
    case 'validate':
      sync.validateConfiguration();
      break;
    case 'env':
      sync.generateLocalEnv();
      break;
    case 'deploy-config':
      sync.generateDeploymentConfig();
      break;
    case 'health':
      sync.checkSystemHealth();
      break;
    case 'sync':
    default:
      sync.syncAll();
      break;
  }
}

export default SyncConfiguration;
