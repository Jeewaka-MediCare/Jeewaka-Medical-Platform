# AI Search Testing Suite

A comprehensive testing framework for the AI-integrated doctor search functionality in the Jeewaka Medical Platform.

## Overview

This testing suite validates the AI search system's ability to interpret natural language queries and return relevant doctor recommendations. It includes multiple test categories to ensure robustness under various conditions.

## Test Categories

### 1. Basic AI Tests (`basic-ai-tests.js`)
- **Purpose**: Validate core AI search functionality
- **Coverage**: Basic queries, simple medical terms, language variations
- **Run Command**: `npm run test:basic`
- **Examples**:
  - "heart doctor"
  - "skin specialist" 
  - "Tamil speaking doctor"
  - "cheap consultation"

### 2. Complex Medical Scenarios (`complex-medical-scenarios.js`)
- **Purpose**: Test AI interpretation of complex medical situations
- **Coverage**: Multi-symptom queries, rare diseases, detailed requirements
- **Run Command**: `npm run test:complex`
- **Examples**:
  - Rare disease specialists
  - Multiple symptom combinations
  - Specific experience requirements
  - Geographic and language preferences

### 3. Edge Cases Tests (`edge-cases-tests.js`)
- **Purpose**: Validate system behavior under unusual conditions
- **Coverage**: Error handling, malformed inputs, boundary conditions
- **Run Command**: `npm run test:edge`
- **Examples**:
  - Empty queries
  - Very long queries
  - Invalid characters
  - Non-medical terms
  - Concurrent requests

### 4. Performance Tests (`performance-tests.js`)
- **Purpose**: Assess system performance under load
- **Coverage**: Response times, throughput, concurrent users, memory usage
- **Run Command**: `npm run test:performance`
- **Metrics**:
  - Load testing (sequential requests)
  - Stress testing (concurrent users)
  - Memory testing (large queries)
  - Response time analysis
  - Success rate monitoring

## Quick Start

### Prerequisites
- Node.js backend server running on `http://localhost:5000`
- AI search endpoints configured and functional
- MongoDB connection established

### Running Tests

1. **Start the server**:
   ```bash
   cd BackEnd
   npm start
   ```

2. **Run all tests**:
   ```bash
   npm run test:ai
   ```

3. **Run specific test suites**:
   ```bash
   # Basic functionality tests
   npm run test:basic
   
   # Complex medical scenarios
   npm run test:complex
   
   # Edge cases and error handling
   npm run test:edge
   
   # Performance and load testing
   npm run test:performance
   ```

## Test Runner (`test-runner.js`)

The main test runner orchestrates all test suites and provides:

- **Comprehensive reporting**: Pass/fail statistics, timing, success rates
- **Health checks**: Server connectivity verification before testing
- **Configurable execution**: Enable/disable specific test suites
- **Error handling**: Graceful failure handling and detailed error reporting
- **Performance metrics**: Response time analysis and throughput measurement

### Configuration Options

Edit `TEST_CONFIG` in `test-runner.js`:

```javascript
const TEST_CONFIG = {
    RUN_BASIC_TESTS: true,         // Enable basic functionality tests
    RUN_COMPLEX_TESTS: true,       // Enable complex scenario tests  
    RUN_EDGE_CASE_TESTS: true,     // Enable edge case tests
    RUN_PERFORMANCE_TESTS: false,  // Enable performance tests (slower)
    STOP_ON_FIRST_FAILURE: false,  // Stop on first test failure
    DETAILED_OUTPUT: true,         // Show detailed test output
    BASE_URL: 'http://localhost:5000' // Backend server URL
};
```

## Expected Test Results

### Successful AI Search Response
```json
{
  "success": true,
  "message": "AI search completed successfully",
  "query": "heart doctor",
  "interpretation": "Looking for cardiologists...",
  "results": [...],
  "aiUsed": true
}
```

### Fallback to Standard Search
```json
{
  "success": true,
  "message": "Search completed using fallback",
  "results": [...],
  "aiUsed": false,
  "fallbackReason": "AI service unavailable"
}
```

### Performance Benchmarks
- **Response Time**: < 2000ms average
- **Success Rate**: > 95% for normal operations
- **Concurrent Users**: Handle 10+ simultaneous requests
- **Large Queries**: Process 500+ character queries effectively

## Troubleshooting

### Common Issues

1. **Server Connection Failed**:
   - Ensure backend server is running on port 5000
   - Check server logs for startup errors
   - Verify MongoDB connection is established

2. **AI Service Errors**:
   - Check Google AI API key configuration
   - Verify internet connectivity
   - Review API quota limits

3. **Test Failures**:
   - Check server health with: `npm run test:basic`
   - Review detailed error output in test results
   - Verify database contains doctor records

## Dependencies

- `node-fetch`: HTTP client for API testing
- `@google/generative-ai`: AI service integration
- Standard Node.js modules for timing and utilities
- Network failures
- AI service unavailability
- Fallback mechanism testing

### Performance Tests
- Response time measurements
- Concurrent request handling
- Large query processing
- Memory usage monitoring