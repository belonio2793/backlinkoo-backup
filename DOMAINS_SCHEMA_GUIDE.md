# Domains Page Database Schema Guide

## Overview
This SQL schema provides complete database support for the `/domains` page functionality including domain management, validation tracking, DNS configuration, theme selection, and blog functionality.

## Key Features Supported

### 🔹 **Core Domain Management**
- Add/remove domains for users
- Track domain validation status
- Store Netlify integration data
- DNS verification tracking
- Error message logging

### 🔹 **Domain Status Workflow**
```
pending → validating → dns_ready → validated → theme_selection → active
                    ↓
                   error (with error_message)
```

### 🔹 **Security & Access Control**
- Row Level Security (RLS) policies
- Users can only access their own domains
- Protected functions with proper authentication
- Secure data isolation

### 🔹 **Advanced Features**
- Validation history tracking
- Theme management system
- DNS record storage (JSONB)
- Utility functions for common operations
- Performance optimized with indexes

## Database Tables

### 1. `domains` (Main Table)
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- domain: TEXT (Domain name)
- status: ENUM (pending|validating|validated|error|dns_ready|theme_selection|active)
- netlify_verified: BOOLEAN
- dns_verified: BOOLEAN
- error_message: TEXT (Optional)
- dns_records: JSONB (Array of DNS records)
- selected_theme: TEXT
- theme_name: TEXT
- blog_enabled: BOOLEAN
- netlify_site_id: TEXT
- ssl_enabled: BOOLEAN
- last_validation_at: TIMESTAMP
- created_at/updated_at: TIMESTAMP
```

### 2. `domain_validations` (History Tracking)
```sql
- id: UUID (Primary Key)
- domain_id: UUID (Foreign Key to domains)
- validation_type: TEXT
- status: TEXT
- result: JSONB
- error_message: TEXT
- validated_at: TIMESTAMP
```

### 3. `domain_themes` (Available Themes)
```sql
- id: TEXT (Primary Key: 'minimal', 'modern', etc.)
- name: TEXT (Display name)
- description: TEXT
- preview_image_url: TEXT
- is_premium: BOOLEAN
```

## Utility Functions

### `update_domain_status()`
Updates domain status and logs validation attempt:
```sql
SELECT update_domain_status(
  'domain-uuid'::UUID,
  'validated'::domain_status,
  '{"netlify_verified": true}'::jsonb,
  NULL -- error message
);
```

### `get_domain_with_validations()`
Retrieves domain with complete validation history:
```sql
SELECT get_domain_with_validations('domain-uuid'::UUID);
```

### `clean_domain_name()`
Cleans domain input (removes protocol, www, trailing slash):
```sql
SELECT clean_domain_name('https://www.example.com/');
-- Returns: 'example.com'
```

### `is_valid_domain()`
Validates domain format:
```sql
SELECT is_valid_domain('example.com'); -- Returns: true
SELECT is_valid_domain('invalid..domain'); -- Returns: false
```

### `get_user_domain_count()`
Gets total domain count for current user:
```sql
SELECT get_user_domain_count(); -- Returns: 5
```

## How to Deploy

### 1. **Run the Schema**
Execute the `domains-schema.sql` file in your Supabase SQL editor:
```bash
# Copy the content of domains-schema.sql and run it in Supabase Dashboard > SQL Editor
```

### 2. **Verify Installation**
The schema includes verification queries that will raise notices:
```
NOTICE: Domains schema created successfully!
```

### 3. **Test Basic Operations**
```sql
-- Insert test domain
INSERT INTO public.domains (user_id, domain) 
VALUES (auth.uid(), 'test-example.com');

-- Check themes are loaded
SELECT * FROM public.domain_themes;

-- Test utility functions
SELECT is_valid_domain('example.com');
SELECT clean_domain_name('https://www.test.com/');
```

## Integration with DomainsPage.tsx

The schema directly supports all operations in your React component:

### ✅ **Supported Operations**
- `loadDomains()` - SELECT with RLS
- `addDomain()` - INSERT with validation
- `validateDomain()` - Status updates via `update_domain_status()`
- `deleteDomain()` - DELETE with RLS protection
- Theme selection and blog enabling
- DNS record storage and retrieval

### ✅ **Status Flow Support**
All status transitions in your UI are supported:
- Adding domains (pending)
- Netlify validation (validating)
- DNS configuration (dns_ready)
- Theme selection (theme_selection)
- Active blogs (active)
- Error handling (error)

## Performance Optimizations

- **Indexes** on user_id, domain, status for fast queries
- **Unique constraint** on (user_id, domain) prevents duplicates
- **JSONB** for flexible DNS record storage
- **Partial indexes** for common query patterns

## Security Features

- **RLS Policies** ensure users only see their domains
- **Function security** with `SECURITY DEFINER`
- **Input validation** via utility functions
- **Audit trail** via validation history

## Maintenance Functions

### Cleanup Test Data
```sql
-- Admin only - removes test domains
SELECT cleanup_test_domains();
```

### Get Domains by Status
```sql
-- Get all pending domains for current user
SELECT * FROM get_domains_by_status('pending'::domain_status);
```

This schema provides a production-ready foundation for your domains management system with proper security, performance, and maintainability features.
