# Database Setup Required

## New Table: user_saved_posts

To enable the new "Save to Dashboard" functionality, you need to create the `user_saved_posts` table in your Supabase database.

### Method 1: Run SQL in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `scripts/create-user-saved-posts-table.sql`

### Method 2: Run Migration

```bash
# Copy the migration file if not already done
cp scripts/create-user-saved-posts-table.sql supabase/migrations/20241201000000_create_user_saved_posts_table.sql

# Link your project and run migrations
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### What This Enables

After creating this table, users will be able to:

- Save up to 3 blog posts to their dashboard (free users)
- Save unlimited blog posts (monthly subscribers)
- View their saved posts in a dedicated dashboard section
- Remove posts from their dashboard
- Posts saved by any user will be protected from auto-deletion

### Key Changes Made

1. **UnifiedClaimService**: Updated to save posts to user dashboard instead of claiming them permanently
2. **Dashboard.tsx**: Now shows "Saved Posts" instead of "Claimed Posts"
3. **Blog.tsx & BlogPost.tsx**: "Claim Now" buttons changed to "Save to Dashboard"
4. **Subscription Support**: Checks user's subscription_tier in profiles table to allow unlimited saves for subscribers

The system now works as follows:
- All blog posts are available for saving
- Saving adds them to user's personal dashboard
- Posts saved by any user won't be auto-deleted
- Free users: 3 saved posts maximum
- Subscribers: Unlimited saved posts
