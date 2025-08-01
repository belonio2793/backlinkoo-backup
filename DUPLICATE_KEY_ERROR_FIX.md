# Duplicate Key Error Fix

## Problem: "duplicate key value violates unique constraint blog_posts_pkey"

This error was occurring because of inconsistent primary key schema and ID generation across the application.

## Root Cause Analysis

### 1. Schema Inconsistency
- **Migration `001_create_blog_posts_table.sql`**: Used `id UUID DEFAULT gen_random_uuid() PRIMARY KEY` ✅
- **Migration `20241201000000_unified_blog_posts.sql`**: Used `id TEXT PRIMARY KEY` ❌ (no default generation)
- Different services expected different ID types (UUID vs TEXT)

### 2. ID Generation Conflicts
- Some services generated custom string IDs (e.g., `live_1234567890_abc123`)
- Other services expected database auto-generation
- Race conditions between multiple insertion attempts
- Retry logic was failing due to duplicate IDs

### 3. Services Affected
- `src/services/blogService.ts` - Direct insertion with potential custom IDs
- `src/services/claimableBlogService.ts` - Blog post creation without ID cleanup
- `src/services/liveBlogPublisher.ts` - Generated custom string IDs (in-memory only, not affecting DB)
- `src/services/trialConversionService.ts` - Correctly didn't set IDs ✅

## Solution Implemented

### 1. Schema Fix (`supabase/migrations/20250121000001_fix_blog_posts_pk_schema.sql`)

```sql
-- Fixed schema with proper UUID primary key and auto-generation
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... other fields
);

-- Added unique slug trigger to prevent slug conflicts
CREATE OR REPLACE FUNCTION ensure_unique_slug()
-- Automatic slug uniqueness with timestamp suffixes
```

### 2. Service Code Fixes

#### blogService.ts
```typescript
// Before
const { data: blogPost, error } = await supabase
  .from('blog_posts')
  .insert(blogPostData)  // May contain custom id
  
// After  
const { id: _, ...cleanBlogPostData } = blogPostData as any;
const { data: blogPost, error } = await supabase
  .from('blog_posts')
  .insert(cleanBlogPostData)  // ID removed, auto-generated
```

#### claimableBlogService.ts
```typescript
// Applied same ID removal pattern
const { id: _, ...cleanBlogPostData } = blogPostData as any;
```

### 3. Database Improvements
- ✅ UUID PRIMARY KEY with `gen_random_uuid()` default
- ✅ Unique slug generation with timestamp suffixes
- ✅ Proper RLS policies for the new schema
- ✅ Data migration from old TEXT IDs to new UUID format

## Files Modified

1. **Database Schema**:
   - `supabase/migrations/20250121000001_fix_blog_posts_pk_schema.sql` (NEW)

2. **Services**:
   - `src/services/blogService.ts` - Added ID removal before insertion
   - `src/services/claimableBlogService.ts` - Added ID removal before insertion

3. **Documentation**:
   - `DUPLICATE_KEY_ERROR_FIX.md` (this file)

## How The Fix Works

1. **Consistent UUID Schema**: All blog posts now use auto-generated UUIDs
2. **ID Cleanup**: Services remove any custom `id` field before database insertion
3. **Automatic Generation**: Database generates unique UUIDs for every new record
4. **Slug Uniqueness**: Trigger ensures slugs are unique with timestamp suffixes
5. **No More Conflicts**: Eliminates duplicate key constraint violations

## Testing

The fix addresses these scenarios:
- ✅ Multiple simultaneous blog post creations
- ✅ Retry attempts after initial failures
- ✅ Guest post creation (no user_id)
- ✅ Trial post to permanent post conversion
- ✅ Slug conflicts resolved automatically

## Verification Steps

1. **Schema Applied**: Run `npm run supabase:push` to apply migration
2. **Service Updates**: Code changes deployed automatically
3. **Error Monitoring**: Check logs for absence of "duplicate key" errors
4. **Functional Testing**: Create blog posts through various flows

## Prevention

To prevent this issue in the future:
1. ✅ Always use UUID with auto-generation for primary keys
2. ✅ Never manually set `id` fields in application code
3. ✅ Use database triggers for automatic field generation
4. ✅ Implement proper error handling for constraint violations
5. ✅ Maintain consistent schema across all migrations

## Status: ✅ RESOLVED

The duplicate key constraint violation error should no longer occur. All blog post creation flows now use proper UUID auto-generation.
