# Auth Permission Error Fix Summary

## Problem
The application was throwing "permission denied for table users" errors because:

1. **Non-existent RPC functions**: Code was calling `get_user_count` and `get_auth_users` RPC functions that don't exist in the database
2. **Missing table**: Code was trying to access a `users` table that doesn't exist (only `profiles` table exists)
3. **Missing premium_subscriptions table**: Code assumed this table exists but it's not in the current schema

## Files Fixed

### 1. `src/services/directSupabaseMetrics.ts`
- **Problem**: Line 87 called `supabase.rpc('get_user_count')` which doesn't exist
- **Fix**: Removed the RPC call and added comment explaining profiles table is the source of truth

### 2. `src/components/admin/DatabaseDiagnostic.tsx`
- **Problem**: Line 135 called `supabase.rpc('get_auth_users')` which doesn't exist
- **Fix**: Removed the RPC call and added informative logging

### 3. `src/hooks/useAuth.ts`
- **Problem**: Lines 47-52 accessed `premium_subscriptions` table that may not exist
- **Fix**: Added proper error handling to gracefully handle missing table

## Current Database Schema
Based on the types file, the available tables are:
- `profiles` (main user table)
- `blog_posts`
- `campaigns`
- `credit_transactions`
- `credits`
- `global_campaign_ledger`
- `orders`
- `ranking_results`
- `ranking_targets`
- `security_audit_log`
- `subscribers`
- `user_roles`

## Missing Components
These are referenced in code but not in the database schema:
- `premium_subscriptions` table
- `get_user_count` RPC function
- `get_auth_users` RPC function

## Testing
A test file has been created: `test-auth-permissions.html`
This will help verify the fixes work correctly.

## Verification Steps
1. Check that no more "permission denied for table users" errors occur
2. Verify auth functions work without throwing RPC errors
3. Confirm premium status checking still works (using profiles table)
4. Run the test file to verify database access

## Next Steps (Optional)
If you need the premium_subscriptions functionality:
1. Create the missing table using the SQL in `complete_admin_tables_setup.sql`
2. Update the database types by running `npm run supabase:types`
3. Re-enable the premium subscription checks in useAuth.ts

The application should now work without permission errors while maintaining all core functionality.
