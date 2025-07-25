#!/bin/bash

# Supabase Database Sync Setup Script
# This script helps set up the connection between your local project and Supabase remote database

echo "🔗 Supabase Database Sync Setup"
echo "================================"
echo ""

# Check if Supabase CLI is available
if ! npx supabase --version > /dev/null 2>&1; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install --save-dev supabase
fi

echo "✅ Supabase CLI is available"
echo ""

# Step 1: Login to Supabase
echo "📝 Step 1: Login to Supabase"
echo "You need to generate an access token from:"
echo "👉 https://supabase.com/dashboard/account/tokens"
echo ""
echo "Then run one of these commands:"
echo "Option A (interactive): npx supabase login"
echo "Option B (with token): npx supabase login --token YOUR_ACCESS_TOKEN"
echo "Option C (env var): export SUPABASE_ACCESS_TOKEN=YOUR_TOKEN && npx supabase login"
echo ""

# Step 2: Link to remote project
echo "🔗 Step 2: Link to your remote project"
echo "npx supabase link --project-ref dfhanacsmsvvkpunurnp"
echo ""

# Step 3: Pull database schema
echo "📥 Step 3: Pull current database schema"
echo "npx supabase db pull"
echo ""

# Step 4: Generate TypeScript types
echo "🔧 Step 4: Generate TypeScript types"
echo "npx supabase gen types typescript --linked > src/integrations/supabase/types.ts"
echo ""

# Step 5: Verify setup
echo "✅ Step 5: Verify setup"
echo "npx supabase status"
echo ""

echo "📋 Summary of what this setup enables:"
echo "• Ability to create and run database migrations"
echo "• Automatic TypeScript type generation from your database schema"
echo "• Schema version control and deployment"
echo "• Local development database that matches production"
echo "• Ability to modify database structure through code"
echo ""

echo "🚀 After setup, I'll be able to:"
echo "• Create database migrations for you"
echo "• Update table schemas"
echo "• Add new tables, columns, indexes"
echo "• Manage database relationships"
echo "• Keep your database schema in sync with your codebase"
