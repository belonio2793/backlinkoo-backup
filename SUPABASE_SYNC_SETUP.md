# 🔗 Supabase Database Sync Setup Guide

This guide will help you connect your local development environment to your Supabase database so that I can make database changes, create migrations, and manage your database schema.

## 📋 Prerequisites

- ✅ Supabase CLI is installed (already done)
- ✅ Your Supabase project ID: `dfhanacsmsvvkpunurnp`
- ✅ Your Supabase credentials are configured

## 🚀 Quick Setup (4 Steps)

### Step 1: Get Your Supabase Access Token

1. Go to [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Give it a name like "CLI Access"
4. Copy the generated token

### Step 2: Login to Supabase CLI

Choose one of these options:

**Option A: Interactive Login**
```bash
npm run supabase:link
```

**Option B: Using Token Directly**
```bash
npx supabase login --token YOUR_ACCESS_TOKEN_HERE
```

**Option C: Using Environment Variable**
```bash
export SUPABASE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
npx supabase login
```

### Step 3: Link Your Project

```bash
npm run supabase:link
```

This connects your local project to your remote Supabase database.

### Step 4: Pull Current Schema

```bash
npm run supabase:pull
npm run supabase:types
```

This downloads your current database schema and generates TypeScript types.

## ✅ Verification

Run this to verify everything is working:

```bash
npm run supabase:status
```

You should see your project linked and connected.

## 🎯 What This Enables

Once set up, I'll be able to:

### 🗃️ Database Management
- Create and modify tables
- Add/remove columns
- Create indexes for performance
- Set up foreign key relationships
- Manage database constraints

### 🔄 Migration System
- Create database migrations for schema changes
- Version control your database structure
- Deploy schema changes safely
- Rollback changes if needed

### 🏗️ Schema Development
- Generate TypeScript types automatically
- Keep frontend types in sync with database
- Ensure type safety across your application

### 📊 Examples of What I Can Help With
- Adding new tables for features
- Optimizing database performance
- Setting up proper relationships
- Creating indexes for faster queries
- Database refactoring and cleanup

## 📝 Available Scripts

After setup, you can use these npm scripts:

```bash
# Link to your Supabase project
npm run supabase:link

# Pull latest schema from remote
npm run supabase:pull

# Generate TypeScript types
npm run supabase:types

# Check connection status
npm run supabase:status

# Run setup guide
npm run supabase:setup
```

## 🆘 Troubleshooting

### "Cannot use automatic login flow"
You're in a non-interactive environment. Use the token method:
```bash
npx supabase login --token YOUR_TOKEN
```

### "Project not linked"
Make sure you ran the link command:
```bash
npm run supabase:link
```

### "Permission denied"
Make sure your access token has the right permissions for your project.

## 🔐 Security Notes

- Keep your access token secure
- Don't commit tokens to version control
- Use environment variables for automation
- Tokens can be regenerated if compromised

## 🎉 Next Steps

Once you complete this setup:

1. **Let me know it's done** - I can then help with database changes
2. **Share any specific needs** - What database changes do you need?
3. **Review current schema** - I can optimize your existing structure

## 💡 Benefits

With this setup, we can:
- Make database changes through code
- Keep everything version controlled
- Deploy changes safely
- Maintain type safety
- Collaborate more effectively on database design

---

**Need help?** Just let me know if you run into any issues during setup!
