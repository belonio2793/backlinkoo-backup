# Campaign Creation Error - Debug Steps

## 🚨 Current Status
**Error:** `Failed to create campaign: [object Object]` with "expected JSON array" at line 207  
**Schema Fix:** Applied (columns are present in database)  
**Next Step:** Debug the actual error cause

## 🔧 Enhanced Debugging Added

### 1. **Detailed Console Logging**
- ✅ Added detailed logging in `AutomationLive.tsx` 
- ✅ Added Supabase error logging in `liveCampaignManager.ts`
- ✅ Shows exact data being inserted and full error details

### 2. **Debug Components Added**
- ✅ `CampaignCreationTest.tsx` - Direct database insert testing
- ✅ `CampaignSchemaCheck.tsx` - Schema validation
- Both available in AutomationLive → Debug tab

### 3. **SQL Test Script**
- ✅ `TEST_CAMPAIGN_INSERT.sql` - Manual database testing
- Tests exact data structure that's failing
- Identifies constraint/type issues

## 🔍 How to Debug This Now

### Step 1: Check Browser Console
1. Open AutomationLive page
2. Open browser DevTools → Console
3. Try creating a campaign
4. Look for detailed logging messages starting with "🔧"

**Expected Output:**
```
🔧 Creating campaign with data: {name, keywords, anchor_texts, target_url, user_id, auto_start}
🔧 Attempting to insert campaign data: {... all fields including JSON columns}
🔧 Supabase insert result: {data, error}
🔧 Supabase error details: {message, details, hint, code, fullError}
```

### Step 2: Use Debug Components
1. Go to AutomationLive → Debug tab
2. Use **"Campaign Creation Debug Test"** component:
   - Click "Test Direct Insert" 
   - Click "Test RLS Policies"
3. Check results for specific error types

### Step 3: Run SQL Test (Manual)
1. Copy contents of `TEST_CAMPAIGN_INSERT.sql`
2. Run in Supabase SQL Editor
3. Check NOTICE messages for success/failure

## 🎯 Expected Error Patterns

### Pattern 1: JSON Type Mismatch
```
ERROR: expected JSON array
CAUSE: Column published_articles has wrong constraints or type
FIX: Check column definition and constraints
```

### Pattern 2: RLS Permission Error
```
ERROR: permission denied / policy violation
CAUSE: User doesn't have INSERT permissions
FIX: Check auth.uid() = user_id in policies
```

### Pattern 3: Array Format Error
```
ERROR: array format / TEXT[] conversion
CAUSE: JavaScript array not converting to PostgreSQL array
FIX: Explicit type casting in query
```

### Pattern 4: Trigger/Constraint Error
```
ERROR: constraint violation / trigger failure
CAUSE: Database triggers or constraints blocking insert
FIX: Check table constraints and triggers
```

## 🔧 Quick Fixes to Try

### Fix 1: Force JSON Conversion
```typescript
// In liveCampaignManager.ts, line ~200
published_articles: JSON.stringify([]), // Force string conversion
target_sites_used: [], // Let Supabase handle array conversion
```

### Fix 2: Explicit Type Casting
```sql
-- In database, check if this works:
INSERT INTO automation_campaigns (published_articles) 
VALUES ('[]'::jsonb);
```

### Fix 3: RLS Bypass Test
```sql
-- Temporarily disable RLS to test if that's the issue:
ALTER TABLE automation_campaigns DISABLE ROW LEVEL SECURITY;
-- Test campaign creation
-- Then re-enable:
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
```

## 📋 Information to Collect

When debugging, collect this information:

1. **Browser Console Output** (complete 🔧 messages)
2. **Debug Component Results** (error details from test)
3. **User Authentication Status** (user.id value)
4. **Supabase Error Object** (full error with code/details)

## 🎯 Next Actions

1. **Immediate:** Check browser console for detailed error
2. **If JSON error:** Check column constraints and data format
3. **If RLS error:** Check user authentication and policies  
4. **If still unclear:** Run SQL test script manually

## 📞 Escalation Path

If the above doesn't resolve it:
1. Share complete browser console output
2. Share debug component test results
3. Share SQL test script results
4. Check Supabase dashboard logs for server-side errors

The enhanced logging should reveal the exact cause of the "expected JSON array" error.
