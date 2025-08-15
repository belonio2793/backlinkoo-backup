# Automation Mock System Guide

## Overview

The automation mock system provides a comprehensive testing and simulation environment for the automation features without affecting production data or services. This system allows parallel testing, error simulation, and performance benchmarking in a safe development environment.

## Components

### 1. AutomationMockService (`src/services/automationMockService.ts`)
- **Purpose**: Core service that manages mock campaigns and testing scenarios
- **Features**:
  - Environment detection (development, testing, staging)
  - Mock campaign creation and management
  - Parallel test execution
  - Performance monitoring
  - Error simulation
  - Data export and reporting

### 2. Enhanced Mock Endpoint (`netlify/functions/enhanced-mock-automation.js`)
- **Purpose**: Advanced mock API endpoint with testing features
- **Endpoints**:
  - `POST /` - Generate mock content
  - `GET /?action=health` - Health check
  - `GET /?action=stats` - Statistics
  - `GET /?action=status&sessionId=ID` - Session status
- **Features**:
  - Multiple content variations
  - Realistic processing delays
  - Error simulation (network, API, rate limit, etc.)
  - Session tracking
  - Performance metrics

### 3. AutomationTestingDashboard (`src/components/admin/AutomationTestingDashboard.tsx`)
- **Purpose**: Web interface for managing and running automation tests
- **Features**:
  - Test scenario management
  - Environment configuration
  - Real-time test execution
  - Results visualization
  - Performance reporting

### 4. EnvironmentSwitcher (`src/components/shared/EnvironmentSwitcher.tsx`)
- **Purpose**: Quick toggle between mock and real services
- **Features**:
  - One-click mock mode toggle
  - Environment status display
  - Mock data cleanup
  - Quick access to testing dashboard

### 5. Enhanced Content Service (`src/services/automationContentService.ts`)
- **Purpose**: Updated service with fallback support and environment detection
- **Features**:
  - Automatic endpoint selection based on environment
  - Enhanced fallback content generation
  - Mock mode integration
  - Error handling and retries

## How to Use

### Quick Start

1. **Enable Mock Mode**:
   - Look for the "Development Tools" panel in the bottom-right corner (only visible in development)
   - Toggle "Mock Automation" to ON
   - The page will reload and all automation services will use mock data

2. **Access Testing Dashboard**:
   - Navigate to `/admin/automation-testing`
   - Or click "Test Dashboard" in the environment switcher

3. **Run Tests**:
   - Select test scenarios you want to run
   - Configure environment settings (concurrency, delays, error simulation)
   - Click "Run Tests" to execute

### Testing Scenarios

The system includes several pre-configured test scenarios:

1. **Basic SEO Campaign**: Standard single-keyword campaign
2. **Multi-Variation Content**: Campaign with multiple content versions
3. **Error Handling Test**: Tests error recovery mechanisms
4. **High Volume Test**: Stress test with multiple simultaneous campaigns
5. **Performance Benchmark**: Measures system performance under load

### Environment Modes

- **Development**: Full mock mode with all testing features
- **Testing**: Optimized for automated tests (reduced delays)
- **Staging**: Hybrid mode with some real services
- **Production**: Real services only (mock system disabled)

### Configuration Options

#### Mock Service Configuration
```typescript
{
  enabled: boolean;           // Enable/disable mock mode
  mode: 'development' | 'testing' | 'staging';
  database: 'mock' | 'sandbox' | 'real';
  contentGeneration: 'mock' | 'real';
  publishing: 'mock' | 'real';
}
```

#### Campaign Configuration
```typescript
{
  keyword: string;           // Target keyword
  anchorText: string;        // Anchor text for backlinks
  targetUrl: string;         // Target URL for backlinks
  contentVariations?: number; // Number of content variations
  publishingDelay?: number;  // Delay between publishing steps
  simulateErrors?: boolean;  // Enable error simulation
  publishToPlatforms?: string[]; // Target platforms
}
```

### API Endpoints

#### Enhanced Mock Automation (`/enhanced-mock-automation`)

**POST Request**:
```json
{
  "keyword": "SEO optimization",
  "anchorText": "professional SEO services",
  "targetUrl": "https://example.com/seo",
  "testMode": false,
  "simulateDelay": true,
  "simulateError": false,
  "errorType": "network",
  "contentVariations": 1
}
```

**Response**:
```json
{
  "success": true,
  "content": [...],
  "sessionId": "uuid",
  "duration": 1500,
  "mock": true,
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00Z",
    "keyword": "SEO optimization",
    "variations": 1,
    "environment": "development"
  }
}
```

#### Health Check
```bash
GET /enhanced-mock-automation?action=health
```

#### Statistics
```bash
GET /enhanced-mock-automation?action=stats
```

### Error Simulation

The system can simulate various error types:

- **network**: Connection timeouts and network failures
- **api_key**: Missing or invalid API configuration
- **rate_limit**: API rate limiting scenarios
- **content_policy**: Content policy violations
- **server**: Internal server errors

### Performance Testing

Run parallel tests to measure system performance:

```typescript
const configs = [
  { keyword: "test1", anchorText: "link1", targetUrl: "url1" },
  { keyword: "test2", anchorText: "link2", targetUrl: "url2" },
  // ... more configs
];

const results = await mockService.runParallelTests(configs, 3); // max 3 concurrent
```

### Data Management

#### Clear Mock Data
```typescript
mockService.cleanupMockData();
```

#### Export Test Results
```typescript
const data = mockService.exportMockData();
```

#### Generate Performance Report
```typescript
const report = mockService.generatePerformanceReport();
```

## Development Workflow

### 1. Feature Development
- Enable mock mode for immediate feedback
- Test different scenarios without external dependencies
- Validate error handling with simulated failures

### 2. Integration Testing
- Run parallel tests to validate scalability
- Test with realistic delays and error rates
- Verify performance under load

### 3. Staging Testing
- Gradually enable real services
- Compare mock vs real performance
- Validate production readiness

### 4. Production Deployment
- Mock system automatically disabled in production
- All services use real endpoints
- Monitoring and logging continue normally

## Best Practices

### Development
- Always use mock mode during feature development
- Test both success and failure scenarios
- Validate performance with realistic data volumes

### Testing
- Create specific test scenarios for edge cases
- Use parallel testing to validate scalability
- Monitor resource usage during tests

### Deployment
- Verify mock mode is disabled in production
- Maintain separate test data sets
- Document any production configuration differences

## Troubleshooting

### Mock Mode Not Working
1. Check if development mode is enabled
2. Verify localStorage settings
3. Clear browser cache and reload

### Tests Failing
1. Check network connectivity to mock endpoints
2. Verify test configuration parameters
3. Review error logs in browser console

### Performance Issues
1. Reduce concurrency levels
2. Enable test mode to skip delays
3. Check system resources

### Data Inconsistencies
1. Clear mock data and restart
2. Verify configuration matches test requirements
3. Check for conflicting localStorage entries

## Advanced Features

### Custom Test Scenarios
Create custom test scenarios by extending the base configuration:

```typescript
const customScenario: TestScenario = {
  id: 'custom-test',
  name: 'Custom Test Scenario',
  description: 'Test specific edge case',
  config: {
    keyword: 'custom keyword',
    anchorText: 'custom anchor',
    targetUrl: 'custom url',
    contentVariations: 5,
    simulateErrors: true
  },
  enabled: true
};
```

### Session Tracking
Monitor individual test sessions:

```typescript
// Get session status
const session = await fetch('/enhanced-mock-automation?action=status&sessionId=abc123');
const status = await session.json();
```

### Performance Monitoring
Track detailed performance metrics:

```typescript
const metrics = {
  totalCampaigns: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  slowestStep: string;
  fastestStep: string;
};
```

## Integration with CI/CD

The mock system can be integrated into automated testing pipelines:

```bash
# Enable test mode
export NODE_ENV=test

# Run automated tests
npm test

# Generate performance report
npm run test:performance
```

## Security Considerations

- Mock mode only available in development environments
- No real API keys required for testing
- Mock data automatically cleaned up
- No production data exposed in mock responses

This mock system provides a comprehensive testing environment that enables safe, parallel testing of automation features without affecting production systems or consuming real API resources.
