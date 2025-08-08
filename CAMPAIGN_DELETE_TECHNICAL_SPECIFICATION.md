# Campaign Delete Functionality - Technical Specification

## Overview

This document provides comprehensive technical specifications for the campaign deletion functionality implemented in the automation campaigns system. The implementation includes full logic, safety checks, cascade operations, error handling, and audit trail capabilities.

## Architecture Overview

### Components Implemented

1. **Backend API Endpoint** (`netlify/functions/backlink-campaigns.js`)
2. **Queue Manager Integration** (`src/services/automationEngine/CampaignQueueManager.ts`)
3. **Campaign Service Layer** (`src/services/campaignService.ts`)
4. **UI Components** (`src/components/campaigns/DeleteCampaignDialog.tsx`)
5. **Frontend Integration** (`src/pages/BacklinkAutomation.tsx`)
6. **Testing Suite** (`src/components/testing/CampaignDeleteTest.tsx`)

## Technical Implementation Details

### 1. Backend API Endpoint

**File**: `netlify/functions/backlink-campaigns.js`

#### Delete Action Handler

```javascript
case 'delete':
  // Enhanced delete with comprehensive safety checks and cascade operations
  const { forceDelete = false, reason } = requestBody;
```

#### Key Features:

- **Campaign Validation**: Verifies campaign exists and belongs to user
- **Safety Checks**: Prevents deletion of active campaigns unless forced
- **Cascade Operations**: Handles related data cleanup
- **Audit Logging**: Comprehensive deletion tracking
- **Rollback Mechanisms**: Transaction-like operations with failure recovery

#### Safety Mechanisms:

1. **Ownership Verification**
   ```javascript
   const { data: existingCampaign, error: fetchError } = await supabase
     .from('backlink_campaigns')
     .select('*')
     .eq('id', campaignId)
     .eq('user_id', user.id)
     .single();
   ```

2. **Active Campaign Protection**
   ```javascript
   if (existingCampaign.status === 'active' && !forceDelete) {
     return {
       statusCode: 409,
       body: JSON.stringify({ 
         error: 'Cannot delete active campaign',
         requiresConfirmation: true
       })
     };
   }
   ```

3. **Cascade Deletion Steps**:
   - Delete automation campaigns from queue
   - Delete campaign analytics and metrics
   - Archive generated links (preserve data)
   - Delete main campaign record
   - Log completion status

### 2. Queue Manager Integration

**File**: `src/services/automationEngine/CampaignQueueManager.ts`

#### New Methods Added:

```typescript
public async deleteCampaign(campaignId: string, forceDelete: boolean = false): Promise<CampaignDeletionResult>
```

#### Features:

- **Queue State Management**: Removes campaigns from processing queue
- **Node Cleanup**: Stops processing on active nodes
- **Resource Release**: Frees up system capacity
- **Database Synchronization**: Keeps queue and DB in sync

#### Processing Node Methods:

```typescript
public async stopCampaign(campaignId: string): Promise<void> {
  const campaign = this.activeCampaigns.get(campaignId);
  if (campaign) {
    campaign.status = 'failed';
    campaign.errorMessage = 'Campaign stopped by deletion request';
    // Cleanup resources
  }
}
```

### 3. Campaign Service Layer

**File**: `src/services/campaignService.ts`

#### Service Methods:

1. **Delete Campaign**
   ```typescript
   async deleteCampaign(campaignId: string, options: CampaignDeletionOptions): Promise<CampaignDeletionResponse>
   ```

2. **Validation**
   ```typescript
   async validateCampaignForDeletion(campaignId: string): Promise<{
     canDelete: boolean;
     warnings: string[];
     requirements: string[];
   }>
   ```

3. **Audit Trail**
   ```typescript
   async getDeletionLogs(campaignId?: string): Promise<any[]>
   ```

#### Error Handling:

- **API Error Types**: Structured error responses with status codes
- **Retry Mechanisms**: Automatic retry for transient failures
- **Rollback Support**: Partial failure recovery
- **User-Friendly Messages**: Clear error communication

### 4. UI Components

#### Delete Confirmation Dialog

**File**: `src/components/campaigns/DeleteCampaignDialog.tsx`

#### Features:

1. **Campaign Overview Display**
   - Status, progress, links generated
   - Impact assessment

2. **Safety Confirmations**
   - Type campaign name to confirm
   - Mandatory reason field
   - Active campaign warnings

3. **Deletion Options**
   - Archive vs delete links
   - Force delete for active campaigns
   - Stakeholder notifications

4. **Real-time Validation**
   - Confirmation text matching
   - Required field validation
   - Warning acknowledgment

#### UI Integration

**File**: `src/pages/BacklinkAutomation.tsx`

#### Enhanced Error Handling:

```typescript
const handleDeleteConfirm = async (campaignId: string, options: CampaignDeletionOptions) => {
  try {
    // Validate before deletion
    const validation = await campaignService.validateCampaignForDeletion(campaignId);
    
    // Execute deletion with comprehensive error handling
    const result = await campaignService.deleteCampaign(campaignId, options);
    
    // Update UI state and metrics
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    
  } catch (error) {
    // Enhanced error categorization and user feedback
  }
};
```

### 5. Testing Suite

**File**: `src/components/testing/CampaignDeleteTest.tsx`

#### Test Coverage:

1. **API Authentication Test**
2. **Campaign Creation Test**
3. **Delete Validation Test**
4. **Active Campaign Delete Test**
5. **Force Delete Test**
6. **Cascade Operations Test**
7. **Queue Manager Integration Test**
8. **Error Handling Test**
9. **Audit Log Test**
10. **Cleanup Test**

## Data Flow Architecture

### Delete Operation Flow

```
1. User clicks delete button
   ↓
2. DeleteCampaignDialog opens
   ↓
3. User provides confirmation and options
   ↓
4. Frontend validation
   ↓
5. campaignService.validateCampaignForDeletion()
   ↓
6. campaignService.deleteCampaign()
   ↓
7. Backend API validation and safety checks
   ↓
8. Cascade deletion operations
   ↓
9. Queue manager cleanup
   ↓
10. UI state updates and user feedback
```

### Database Schema Considerations

#### Tables Affected:

1. **backlink_campaigns** (main table)
2. **automation_campaigns** (queue records)
3. **campaign_analytics** (metrics data)
4. **generated_links** (archived, not deleted)
5. **campaign_deletion_logs** (audit trail)

#### Cascade Rules:

- **Links**: Archived instead of deleted (data preservation)
- **Analytics**: Deleted (can be regenerated)
- **Queue Records**: Deleted (operational data)
- **Audit Logs**: Permanent (compliance)

## Security Implementation

### Authentication & Authorization

1. **JWT Token Validation**
   ```javascript
   const authHeader = event.headers.authorization;
   const token = authHeader.substring(7);
   const { data: userData } = await supabase.auth.getUser(token);
   ```

2. **Ownership Verification**
   ```javascript
   .eq('user_id', user.id)
   ```

3. **Force Delete Restrictions**
   - Requires explicit confirmation
   - Additional warning acknowledgment
   - Audit trail includes force flag

### Data Protection

1. **Link Archival**: Generated links preserved by default
2. **Audit Trail**: Complete deletion history
3. **Rollback Capability**: Partial failure recovery
4. **Transaction Safety**: Atomic operations where possible

## Error Handling Strategy

### Error Categories

1. **Authentication Errors** (401)
   - Invalid or missing token
   - Session expired

2. **Authorization Errors** (403)
   - Campaign doesn't belong to user
   - Insufficient permissions

3. **Validation Errors** (400, 409)
   - Active campaign without force flag
   - Missing required parameters
   - Invalid confirmation text

4. **Not Found Errors** (404)
   - Campaign doesn't exist
   - Already deleted

5. **System Errors** (500)
   - Database failures
   - Network issues
   - Partial deletion failures

### Error Recovery

1. **Automatic Retry**: For transient failures
2. **Graceful Degradation**: Continue with partial success
3. **User Guidance**: Clear next steps on failure
4. **Support Integration**: Error codes for support tickets

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Multiple related records in single transaction
2. **Async Processing**: Non-blocking UI updates
3. **Selective Deletion**: Archive vs delete strategy
4. **Connection Pooling**: Efficient database usage

### Monitoring

1. **Deletion Metrics**: Success/failure rates
2. **Performance Tracking**: Operation duration
3. **Error Analysis**: Failure pattern identification
4. **Audit Reports**: Compliance and usage tracking

## Compliance & Audit

### Audit Trail Features

1. **Complete Logging**: All deletion attempts recorded
2. **User Attribution**: Who initiated deletion
3. **Reason Tracking**: Why deletion was requested
4. **Timestamp Precision**: Exact timing of operations
5. **Status Tracking**: Success/failure with details

### Data Retention

1. **Audit Logs**: Permanent retention
2. **Archived Links**: Configurable retention period
3. **Error Logs**: Rolling retention policy
4. **Performance Metrics**: Aggregated long-term storage

## API Documentation

### Delete Campaign Endpoint

**URL**: `POST /.netlify/functions/backlink-campaigns`

**Payload**:
```json
{
  "action": "delete",
  "campaignId": "string",
  "forceDelete": "boolean",
  "reason": "string"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Campaign deleted successfully with all related data",
  "deletionSummary": {
    "campaignId": "string",
    "campaignName": "string", 
    "deletedAt": "ISO8601",
    "linksArchived": "number",
    "wasForceDeleted": "boolean",
    "cascadeOperations": {
      "automationCampaigns": "deleted",
      "analytics": "deleted",
      "generatedLinks": "archived", 
      "mainCampaign": "deleted"
    }
  }
}
```

**Response Error (409 - Active Campaign)**:
```json
{
  "error": "Cannot delete active campaign",
  "details": "Please pause the campaign first, or use forceDelete option",
  "campaign": {
    "id": "string",
    "name": "string", 
    "status": "active",
    "links_generated": "number"
  },
  "requiresConfirmation": true
}
```

## Testing Strategy

### Unit Tests

1. **API Endpoint Tests**: All success/failure scenarios
2. **Service Layer Tests**: Business logic validation
3. **Component Tests**: UI behavior and validation
4. **Integration Tests**: End-to-end workflows

### Test Scenarios

1. **Happy Path**: Normal deletion flow
2. **Edge Cases**: Active campaigns, missing data
3. **Error Conditions**: Network failures, auth issues
4. **Performance**: Large campaign deletion
5. **Concurrency**: Multiple simultaneous deletions

### Test Data Management

1. **Mock Campaigns**: Controlled test scenarios
2. **Cleanup Procedures**: Automatic test data removal
3. **Isolation**: Tests don't affect production data
4. **Repeatability**: Consistent test outcomes

## Deployment Considerations

### Database Migrations

1. **New Tables**: campaign_deletion_logs
2. **Schema Updates**: Additional audit fields
3. **Index Creation**: Performance optimization
4. **Data Migration**: Existing campaign compatibility

### Feature Flags

1. **Gradual Rollout**: Controlled feature activation
2. **A/B Testing**: UI variation testing
3. **Emergency Disable**: Quick rollback capability
4. **User Segments**: Selective feature access

### Monitoring & Alerts

1. **Error Rate Monitoring**: Deletion failure tracking
2. **Performance Alerts**: Slow operation detection
3. **Security Monitoring**: Unusual deletion patterns
4. **Compliance Alerts**: Audit trail integrity

## Maintenance & Support

### Operational Procedures

1. **Manual Deletion**: Admin override procedures
2. **Data Recovery**: Archived link restoration
3. **Audit Queries**: Compliance reporting
4. **Performance Tuning**: Optimization procedures

### Support Workflows

1. **Error Investigation**: Debugging procedures
2. **Data Recovery**: User request handling
3. **Escalation Paths**: Complex issue resolution
4. **Documentation**: User guidance materials

## Future Enhancements

### Planned Improvements

1. **Bulk Deletion**: Multiple campaign selection
2. **Scheduled Deletion**: Time-based automation
3. **Advanced Filtering**: Deletion criteria refinement
4. **Recovery Tools**: Undelete functionality

### Scalability Considerations

1. **Queue Optimization**: Improved processing efficiency
2. **Database Sharding**: Large-scale data management
3. **Caching Strategy**: Performance optimization
4. **API Rate Limiting**: System protection

This technical specification provides a comprehensive overview of the implemented campaign deletion functionality, ensuring maintainability, security, and scalability for the automation campaigns system.
