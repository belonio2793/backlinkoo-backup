#!/usr/bin/env node

/**
 * Simplified Netlify build script
 * Handles the build process without complex database operations
 */

import { execSync } from 'child_process';

console.log('🚀 Starting Netlify build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Build the main application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Install function dependencies
  console.log('⚡ Installing function dependencies...');
  execSync('cd netlify/functions && npm ci', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
