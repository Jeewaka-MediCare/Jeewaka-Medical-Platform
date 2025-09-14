import { basicAITests } from './basic-ai-tests.js';
import { complexMedicalScenarios } from './complex-medical-scenarios.js';
import { edgeCasesTests } from './edge-cases-tests.js';
import { runLoadTest, runStressTest, runMemoryTest } from './performance-tests.js';

// Test suite configuration
const TEST_CONFIG = {
    RUN_BASIC_TESTS: true,
    RUN_COMPLEX_TESTS: true,
    RUN_EDGE_CASE_TESTS: true,
    RUN_PERFORMANCE_TESTS: false, // Set to true for performance testing
    STOP_ON_FIRST_FAILURE: false,
    DETAILED_OUTPUT: true,
    BASE_URL: 'http://localhost:5000'
};

// Test runner statistics
class TestRunner {
    constructor() {
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            startTime: null,
            endTime: null,
            failures: []
        };
    }
    
    start() {
        this.stats.startTime = Date.now();
        console.log('🧪 AI SEARCH TEST SUITE STARTING...');
        console.log('='.repeat(60));
        console.log(`Server: ${TEST_CONFIG.BASE_URL}`);
        console.log(`Stop on failure: ${TEST_CONFIG.STOP_ON_FIRST_FAILURE}`);
        console.log(`Performance tests: ${TEST_CONFIG.RUN_PERFORMANCE_TESTS ? 'ENABLED' : 'DISABLED'}`);
        console.log('='.repeat(60));
    }
    
    async runTestSuite(suiteName, testFunction, enabled = true) {
        if (!enabled) {
            console.log(`\n⏭️  SKIPPING ${suiteName.toUpperCase()}`);
            return { passed: 0, failed: 0, skipped: 1 };
        }
        
        console.log(`\n🔬 RUNNING ${suiteName.toUpperCase()}`);
        console.log('─'.repeat(40));
        
        try {
            const results = await testFunction();
            
            // Count results
            const passed = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            // Update statistics
            this.stats.total += results.length;
            this.stats.passed += passed;
            this.stats.failed += failed;
            
            // Track failures
            results.filter(r => !r.success).forEach(failure => {
                this.stats.failures.push({
                    suite: suiteName,
                    test: failure.testName || 'Unknown',
                    error: failure.error || 'No error details'
                });
            });
            
            // Display results
            console.log(`\n${suiteName} Results:`);
            console.log(`  ✅ Passed: ${passed}`);
            console.log(`  ❌ Failed: ${failed}`);
            console.log(`  📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
            
            if (failed > 0 && TEST_CONFIG.DETAILED_OUTPUT) {
                console.log('\n  Failed Tests:');
                results.filter(r => !r.success).forEach(failure => {
                    console.log(`    • ${failure.testName}: ${failure.error}`);
                });
            }
            
            // Stop on failure if configured
            if (failed > 0 && TEST_CONFIG.STOP_ON_FIRST_FAILURE) {
                throw new Error(`Test suite ${suiteName} failed. Stopping execution.`);
            }
            
            return { passed, failed, skipped: 0 };
            
        } catch (error) {
            console.error(`\n❌ ${suiteName} suite failed to run:`, error.message);
            this.stats.failed += 1;
            this.stats.failures.push({
                suite: suiteName,
                test: 'Suite Execution',
                error: error.message
            });
            
            if (TEST_CONFIG.STOP_ON_FIRST_FAILURE) {
                throw error;
            }
            
            return { passed: 0, failed: 1, skipped: 0 };
        }
    }
    
    async runPerformanceTests() {
        if (!TEST_CONFIG.RUN_PERFORMANCE_TESTS) {
            console.log('\n⏭️  SKIPPING PERFORMANCE TESTS');
            this.stats.skipped += 3;
            return;
        }
        
        console.log('\n⚡ RUNNING PERFORMANCE TESTS');
        console.log('─'.repeat(40));
        
        try {
            console.log('Note: Performance tests take longer to complete...\n');
            
            // Run load test
            console.log('Running Load Test...');
            const loadStats = await runLoadTest();
            const loadPassed = loadStats.successRate >= 95 && loadStats.avgResponseTime <= 2000;
            
            // Run stress test
            console.log('Running Stress Test...');
            const stressStats = await runStressTest();
            const stressPassed = stressStats.successRate >= 90 && stressStats.avgResponseTime <= 3000;
            
            // Run memory test
            console.log('Running Memory Test...');
            const memoryStats = await runMemoryTest();
            const memoryPassed = memoryStats.successRate >= 95 && memoryStats.avgResponseTime <= 5000;
            
            // Update stats
            const perfPassed = [loadPassed, stressPassed, memoryPassed].filter(Boolean).length;
            const perfFailed = 3 - perfPassed;
            
            this.stats.total += 3;
            this.stats.passed += perfPassed;
            this.stats.failed += perfFailed;
            
            console.log('\nPerformance Test Results:');
            console.log(`  Load Test: ${loadPassed ? '✅' : '❌'} (${loadStats.successRate.toFixed(1)}% success, ${loadStats.avgResponseTime.toFixed(0)}ms avg)`);
            console.log(`  Stress Test: ${stressPassed ? '✅' : '❌'} (${stressStats.successRate.toFixed(1)}% success, ${stressStats.avgResponseTime.toFixed(0)}ms avg)`);
            console.log(`  Memory Test: ${memoryPassed ? '✅' : '❌'} (${memoryStats.successRate.toFixed(1)}% success, ${memoryStats.avgResponseTime.toFixed(0)}ms avg)`);
            
        } catch (error) {
            console.error('\n❌ Performance tests failed:', error.message);
            this.stats.failed += 3;
            this.stats.failures.push({
                suite: 'Performance Tests',
                test: 'Suite Execution',
                error: error.message
            });
        }
    }
    
    finish() {
        this.stats.endTime = Date.now();
        const duration = this.stats.endTime - this.stats.startTime;
        
        console.log('\n');
        console.log('='.repeat(60));
        console.log('🏁 TEST SUITE COMPLETED');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.stats.total}`);
        console.log(`✅ Passed: ${this.stats.passed}`);
        console.log(`❌ Failed: ${this.stats.failed}`);
        console.log(`⏭️  Skipped: ${this.stats.skipped}`);
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
        
        if (this.stats.total > 0) {
            const successRate = (this.stats.passed / this.stats.total) * 100;
            console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
            
            const overallResult = this.stats.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
            console.log(`🎯 Overall Result: ${overallResult}`);
        }
        
        if (this.stats.failures.length > 0) {
            console.log('\n📋 FAILURE SUMMARY:');
            this.stats.failures.forEach((failure, index) => {
                console.log(`${index + 1}. [${failure.suite}] ${failure.test}: ${failure.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Exit with appropriate code
        process.exit(this.stats.failed > 0 ? 1 : 0);
    }
}

// Server health check
async function checkServerHealth() {
    console.log('🔍 Checking server health...');
    
    try {
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/doctor/ai-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'test connection' })
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        console.log('✅ Server is healthy and ready for testing\n');
        return true;
        
    } catch (error) {
        console.error('❌ Server health check failed:', error.message);
        console.error('Please ensure the server is running on', TEST_CONFIG.BASE_URL);
        console.error('You can start it with: cd BackEnd && npm start\n');
        return false;
    }
}

// Main test runner function
async function main() {
    const runner = new TestRunner();
    
    try {
        runner.start();
        
        // Check server health before running tests
        const serverHealthy = await checkServerHealth();
        if (!serverHealthy) {
            console.error('Cannot proceed with tests. Server is not accessible.');
            process.exit(1);
        }
        
        // Run all test suites
        await runner.runTestSuite('Basic AI Tests', basicAITests, TEST_CONFIG.RUN_BASIC_TESTS);
        await runner.runTestSuite('Complex Medical Scenarios', complexMedicalScenarios, TEST_CONFIG.RUN_COMPLEX_TESTS);
        await runner.runTestSuite('Edge Cases Tests', edgeCasesTests, TEST_CONFIG.RUN_EDGE_CASE_TESTS);
        await runner.runPerformanceTests();
        
    } catch (error) {
        console.error('\n💥 Test suite execution failed:', error.message);
        runner.stats.failed += 1;
    } finally {
        runner.finish();
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test suite interrupted by user');
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('\n💥 Unhandled promise rejection:', error);
    process.exit(1);
});

// Export for programmatic use
export { TestRunner, checkServerHealth, TEST_CONFIG };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}