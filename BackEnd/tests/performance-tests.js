import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/doctor';

// Performance test configuration
const PERFORMANCE_CONFIG = {
    WARMUP_REQUESTS: 5,
    LOAD_TEST_REQUESTS: 50,
    CONCURRENT_USERS: 10,
    TIMEOUT_MS: 30000,
    ACCEPTABLE_RESPONSE_TIME_MS: 2000,
    ACCEPTABLE_SUCCESS_RATE: 95
};

// Performance metrics tracker
class PerformanceMetrics {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.requests = [];
        this.errors = [];
        this.startTime = null;
        this.endTime = null;
    }
    
    addRequest(duration, success, error = null) {
        this.requests.push({ duration, success, timestamp: Date.now() });
        if (error) this.errors.push(error);
    }
    
    getStats() {
        const successfulRequests = this.requests.filter(r => r.success);
        const durations = successfulRequests.map(r => r.duration);
        
        return {
            total: this.requests.length,
            successful: successfulRequests.length,
            failed: this.requests.length - successfulRequests.length,
            successRate: (successfulRequests.length / this.requests.length) * 100,
            avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
            minResponseTime: Math.min(...durations) || 0,
            maxResponseTime: Math.max(...durations) || 0,
            medianResponseTime: this.getMedian(durations),
            p95ResponseTime: this.getPercentile(durations, 95),
            p99ResponseTime: this.getPercentile(durations, 99),
            totalTestTime: this.endTime - this.startTime,
            requestsPerSecond: this.requests.length / ((this.endTime - this.startTime) / 1000),
            errors: this.errors
        };
    }
    
    getMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    getPercentile(arr, percentile) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
}

// Single request performance test
async function performanceTestSingleRequest(query, timeout = PERFORMANCE_CONFIG.TIMEOUT_MS) {
    const startTime = Date.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`${BASE_URL}/ai-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        return {
            success: response.ok && data.success,
            duration,
            status: response.status,
            data: data,
            error: null
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            success: false,
            duration,
            status: 0,
            data: null,
            error: error.message
        };
    }
}

// Warmup phase to stabilize performance
async function runWarmupPhase() {
    console.log('\n🔥 RUNNING WARMUP PHASE');
    console.log('─'.repeat(60));
    
    const warmupQuery = "heart doctor";
    
    for (let i = 0; i < PERFORMANCE_CONFIG.WARMUP_REQUESTS; i++) {
        process.stdout.write(`Warmup request ${i + 1}/${PERFORMANCE_CONFIG.WARMUP_REQUESTS}... `);
        const result = await performanceTestSingleRequest(warmupQuery);
        console.log(`${result.success ? '✅' : '❌'} (${result.duration}ms)`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Warmup complete. System should now be stabilized.');
}

// Load testing with sequential requests
async function runLoadTest() {
    console.log('\n📈 RUNNING LOAD TEST (Sequential Requests)');
    console.log('─'.repeat(60));
    
    const testQueries = [
        "heart doctor",
        "female skin specialist",
        "Tamil speaking oncologist",
        "experienced pediatrician",
        "cheap consultation under 30 dollars",
        "brain surgeon with 10 years experience",
        "I have chest pain and need help",
        "mental health specialist for teenagers",
        "ENT doctor near me",
        "orthopedic surgeon for joint pain"
    ];
    
    const metrics = new PerformanceMetrics();
    metrics.startTime = Date.now();
    
    console.log(`Testing ${PERFORMANCE_CONFIG.LOAD_TEST_REQUESTS} requests...`);
    
    for (let i = 0; i < PERFORMANCE_CONFIG.LOAD_TEST_REQUESTS; i++) {
        const query = testQueries[i % testQueries.length];
        process.stdout.write(`\rRequest ${i + 1}/${PERFORMANCE_CONFIG.LOAD_TEST_REQUESTS} (${query.substring(0, 20)}...)`);
        
        const result = await performanceTestSingleRequest(query);
        metrics.addRequest(result.duration, result.success, result.error);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    metrics.endTime = Date.now();
    console.log('\n');
    
    return metrics.getStats();
}

// Stress testing with concurrent requests
async function runStressTest() {
    console.log('\n💪 RUNNING STRESS TEST (Concurrent Requests)');
    console.log('─'.repeat(60));
    
    const testQueries = [
        "heart doctor",
        "skin specialist",
        "brain surgeon",
        "pediatrician",
        "oncologist",
        "psychiatrist",
        "orthopedic doctor",
        "ENT specialist",
        "gynecologist",
        "cardiologist"
    ];
    
    const metrics = new PerformanceMetrics();
    metrics.startTime = Date.now();
    
    console.log(`Testing ${PERFORMANCE_CONFIG.CONCURRENT_USERS} concurrent users...`);
    
    // Create concurrent user sessions
    const userPromises = [];
    
    for (let user = 0; user < PERFORMANCE_CONFIG.CONCURRENT_USERS; user++) {
        const userPromise = (async () => {
            const requestsPerUser = Math.ceil(PERFORMANCE_CONFIG.LOAD_TEST_REQUESTS / PERFORMANCE_CONFIG.CONCURRENT_USERS);
            
            for (let i = 0; i < requestsPerUser; i++) {
                const query = testQueries[Math.floor(Math.random() * testQueries.length)];
                const result = await performanceTestSingleRequest(query);
                metrics.addRequest(result.duration, result.success, result.error);
                
                // Random delay between requests (0-100ms)
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            }
        })();
        
        userPromises.push(userPromise);
    }
    
    // Wait for all concurrent users to complete
    await Promise.all(userPromises);
    
    metrics.endTime = Date.now();
    
    return metrics.getStats();
}

// Memory usage estimation test
async function runMemoryTest() {
    console.log('\n🧠 RUNNING MEMORY USAGE TEST');
    console.log('─'.repeat(60));
    
    const largeQueries = [
        "I need a very experienced cardiologist who speaks Tamil and English fluently and has extensive experience with complex heart surgeries and interventional procedures and charges reasonable fees for consultation and is available for emergency procedures and has worked in top hospitals and has published research papers and has good patient reviews and is located in a convenient area with good facilities and modern equipment and offers telemedicine consultations and has trained many junior doctors and is known for excellent patient care and communication skills",
        
        "I am looking for a female oncologist who specializes in rare cancers affecting young adults particularly sarcomas and lymphomas and has experience with latest chemotherapy protocols and immunotherapy treatments and has worked with international cancer research centers and can provide second opinions and has access to clinical trials and experimental treatments and can coordinate with multiple specialists and has experience with genetic counseling and precision medicine approaches and offers comprehensive cancer care including supportive care and palliative care options",
        
        "My child needs a pediatric neurologist who specializes in developmental disorders autism spectrum disorders ADHD learning disabilities and has experience with early intervention programs and can work with speech therapists occupational therapists and behavioral therapists and has experience with complex cases involving multiple diagnoses and can provide family counseling and support and has worked with special needs children and understands educational accommodations and can provide long term care and monitoring"
    ];
    
    const metrics = new PerformanceMetrics();
    metrics.startTime = Date.now();
    
    for (let i = 0; i < largeQueries.length; i++) {
        console.log(`Testing large query ${i + 1}/${largeQueries.length}...`);
        const result = await performanceTestSingleRequest(largeQueries[i]);
        metrics.addRequest(result.duration, result.success, result.error);
        console.log(`  Result: ${result.success ? '✅' : '❌'} (${result.duration}ms)`);
    }
    
    metrics.endTime = Date.now();
    
    return metrics.getStats();
}

// Display performance results
function displayResults(testName, stats) {
    console.log(`\n📊 ${testName.toUpperCase()} RESULTS`);
    console.log('='.repeat(60));
    console.log(`Total Requests: ${stats.total}`);
    console.log(`Successful: ${stats.successful} (${stats.successRate.toFixed(2)}%)`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Total Test Time: ${stats.totalTestTime}ms`);
    console.log(`Requests per Second: ${stats.requestsPerSecond.toFixed(2)}`);
    console.log('');
    console.log('Response Times:');
    console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Minimum: ${stats.minResponseTime.toFixed(2)}ms`);
    console.log(`  Maximum: ${stats.maxResponseTime.toFixed(2)}ms`);
    console.log(`  Median: ${stats.medianResponseTime.toFixed(2)}ms`);
    console.log(`  95th Percentile: ${stats.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  99th Percentile: ${stats.p99ResponseTime.toFixed(2)}ms`);
    
    // Performance evaluation
    console.log('\nPerformance Evaluation:');
    const responseTimeOk = stats.avgResponseTime <= PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS;
    const successRateOk = stats.successRate >= PERFORMANCE_CONFIG.ACCEPTABLE_SUCCESS_RATE;
    
    console.log(`  Response Time: ${responseTimeOk ? '✅' : '❌'} (${stats.avgResponseTime.toFixed(2)}ms avg, target: <${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms)`);
    console.log(`  Success Rate: ${successRateOk ? '✅' : '❌'} (${stats.successRate.toFixed(2)}%, target: >${PERFORMANCE_CONFIG.ACCEPTABLE_SUCCESS_RATE}%)`);
    console.log(`  Overall: ${responseTimeOk && successRateOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (stats.errors.length > 0) {
        console.log(`\nErrors (${stats.errors.length}):`);
        const errorCounts = {};
        stats.errors.forEach(error => {
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        });
        Object.entries(errorCounts).forEach(([error, count]) => {
            console.log(`  ${error}: ${count} times`);
        });
    }
}

// Main performance test function
async function main() {
    console.log('⚡ AI SEARCH PERFORMANCE TESTS STARTING...');
    console.log('Testing system performance under various load conditions');
    console.log('Server must be running on http://localhost:5000\n');
    
    console.log('Performance Test Configuration:');
    console.log(`  Warmup Requests: ${PERFORMANCE_CONFIG.WARMUP_REQUESTS}`);
    console.log(`  Load Test Requests: ${PERFORMANCE_CONFIG.LOAD_TEST_REQUESTS}`);
    console.log(`  Concurrent Users: ${PERFORMANCE_CONFIG.CONCURRENT_USERS}`);
    console.log(`  Request Timeout: ${PERFORMANCE_CONFIG.TIMEOUT_MS}ms`);
    console.log(`  Target Response Time: <${PERFORMANCE_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms`);
    console.log(`  Target Success Rate: >${PERFORMANCE_CONFIG.ACCEPTABLE_SUCCESS_RATE}%`);
    
    try {
        // Warmup phase
        await runWarmupPhase();
        
        // Load testing
        const loadTestStats = await runLoadTest();
        displayResults('Load Test', loadTestStats);
        
        // Stress testing
        const stressTestStats = await runStressTest();
        displayResults('Stress Test', stressTestStats);
        
        // Memory/large query testing
        const memoryTestStats = await runMemoryTest();
        displayResults('Memory Test', memoryTestStats);
        
        console.log('\n✅ ALL PERFORMANCE TESTS COMPLETED');
        console.log('Review the results to assess system performance under load');
        
    } catch (error) {
        console.error('\n❌ Performance test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { 
    performanceTestSingleRequest, 
    runLoadTest, 
    runStressTest, 
    runMemoryTest, 
    PerformanceMetrics 
};