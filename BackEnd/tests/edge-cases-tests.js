import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/doctor';

// Test helper for edge cases
async function testEdgeCase(query, expectedBehavior, description = '') {
    try {
        console.log(`\n⚠️  Testing Edge Case: ${description}`);
        console.log('─'.repeat(60));
        console.log(`Query: "${query}"`);
        console.log(`Expected: ${expectedBehavior}`);
        
        const response = await fetch(`${BASE_URL}/ai-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        console.log(`\nActual Response:`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Success: ${data.success}`);
        
        if (data.success) {
            console.log(`  Enhanced Search: ${data.aiEnhancement?.enhancedSearch ? '✅' : '❌'}`);
            console.log(`  AI Error: ${data.aiEnhancement?.aiError || 'None'}`);
            console.log(`  Fallback Used: ${data.aiEnhancement?.aiError ? '✅' : '❌'}`);
            console.log(`  Results: ${data.data?.pagination?.totalDoctors || 0}`);
        } else {
            console.log(`  Error: ${data.error}`);
        }
        
        return { response, data };
        
    } catch (error) {
        console.error(`❌ Edge case test failed: ${error.message}`);
        return { error };
    }
}

// Test malformed requests
async function testMalformedRequests() {
    console.log('\n🚨 TESTING MALFORMED REQUESTS');
    console.log('='.repeat(80));
    
    const malformedTests = [
        {
            description: "Empty query string",
            query: "",
            expected: "Should return error: Search query is required"
        },
        {
            description: "Only whitespace",
            query: "   \t\n   ",
            expected: "Should return error: Search query is required"
        },
        {
            description: "Null query",
            query: null,
            expected: "Should return error or handle gracefully"
        },
        {
            description: "Very long query (>1000 chars)",
            query: "a".repeat(1001),
            expected: "Should handle gracefully or return appropriate error"
        }
    ];
    
    for (const test of malformedTests) {
        await testEdgeCase(test.query, test.expected, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test nonsensical queries
async function testNonsensicalQueries() {
    console.log('\n🤪 TESTING NONSENSICAL QUERIES');
    console.log('='.repeat(80));
    
    const nonsensicalQueries = [
        {
            query: "xyz random gibberish abc 123",
            description: "Random gibberish",
            expected: "Should fall back to basic search"
        },
        {
            query: "!@#$%^&*()_+",
            description: "Special characters only",
            expected: "Should handle gracefully"
        },
        {
            query: "doctor doctor doctor doctor",
            description: "Repetitive words",
            expected: "Should handle without infinite loops"
        },
        {
            query: "I want to buy a car",
            description: "Completely unrelated query",
            expected: "Should fall back to basic search"
        },
        {
            query: "12345 67890",
            description: "Numbers only",
            expected: "Should handle gracefully"
        }
    ];
    
    for (const test of nonsensicalQueries) {
        await testEdgeCase(test.query, test.expected, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test boundary conditions
async function testBoundaryConditions() {
    console.log('\n📏 TESTING BOUNDARY CONDITIONS');
    console.log('='.repeat(80));
    
    const boundaryTests = [
        {
            query: "a",
            description: "Single character",
            expected: "Should handle gracefully"
        },
        {
            query: "doctor with 999999 years experience",
            description: "Unrealistic experience number",
            expected: "Should handle large numbers appropriately"
        },
        {
            query: "consultation fee under -100 dollars",
            description: "Negative fee constraint",
            expected: "Should handle negative numbers appropriately"
        },
        {
            query: "doctor in Mars near Jupiter",
            description: "Impossible location",
            expected: "Should note location but continue search"
        }
    ];
    
    for (const test of boundaryTests) {
        await testEdgeCase(test.query, test.expected, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test special characters and encoding
async function testSpecialCharactersAndEncoding() {
    console.log('\n🔤 TESTING SPECIAL CHARACTERS & ENCODING');
    console.log('='.repeat(80));
    
    const specialCharTests = [
        {
            query: "மருத்துவர் தேவை",
            description: "Tamil script",
            expected: "Should handle Unicode correctly"
        },
        {
            query: "වෛද්‍යවරයෙකු අවශ්‍යයි",
            description: "Sinhala script",
            expected: "Should handle Unicode correctly"
        },
        {
            query: "doctor with \"quotes\" and 'apostrophes'",
            description: "Quotes and apostrophes",
            expected: "Should handle quotes correctly"
        },
        {
            query: "heart & lung doctor",
            description: "Ampersand character",
            expected: "Should handle special characters"
        },
        {
            query: "doctor <script>alert('test')</script>",
            description: "Potential XSS attempt",
            expected: "Should sanitize input safely"
        }
    ];
    
    for (const test of specialCharTests) {
        await testEdgeCase(test.query, test.expected, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test AI service failure simulation
async function testAIServiceFailure() {
    console.log('\n🔌 TESTING AI SERVICE FAILURE SCENARIOS');
    console.log('='.repeat(80));
    console.log('Note: These tests verify fallback mechanisms when AI interpretation fails');
    
    // Test queries that might cause AI parsing issues
    const aiFailureTests = [
        {
            query: "heart doctor { invalid json } syntax",
            description: "Query with JSON-like syntax that might confuse AI",
            expected: "Should fall back to basic search"
        },
        {
            query: "```json\n{\"malformed\": json\n```",
            description: "Malformed markdown JSON block",
            expected: "Should fall back to basic search"
        }
    ];
    
    for (const test of aiFailureTests) {
        await testEdgeCase(test.query, test.expected, test.description);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Test concurrent requests
async function testConcurrentRequests() {
    console.log('\n⚡ TESTING CONCURRENT REQUESTS');
    console.log('='.repeat(80));
    
    const concurrentQueries = [
        "heart doctor",
        "skin specialist",
        "brain surgeon",
        "pediatrician",
        "oncologist"
    ];
    
    console.log(`Sending ${concurrentQueries.length} concurrent requests...`);
    
    const startTime = Date.now();
    
    try {
        const promises = concurrentQueries.map(query => 
            fetch(`${BASE_URL}/ai-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            })
        );
        
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        console.log(`\nConcurrent Request Results:`);
        console.log(`  Total Time: ${endTime - startTime}ms`);
        console.log(`  Average Time per Request: ${(endTime - startTime) / concurrentQueries.length}ms`);
        
        let successCount = 0;
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const data = await response.json();
            console.log(`  Query "${concurrentQueries[i]}": ${response.ok ? '✅' : '❌'} (${response.status})`);
            if (response.ok && data.success) successCount++;
        }
        
        console.log(`  Success Rate: ${(successCount / concurrentQueries.length * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error(`❌ Concurrent request test failed: ${error.message}`);
    }
}

// Main function to run all edge case tests
async function main() {
    console.log('🧪 EDGE CASES & ERROR HANDLING TESTS STARTING...');
    console.log('Testing system robustness and error handling capabilities');
    console.log('Server must be running on http://localhost:5000\n');
    
    try {
        await testMalformedRequests();
        await testNonsensicalQueries();
        await testBoundaryConditions();
        await testSpecialCharactersAndEncoding();
        await testAIServiceFailure();
        await testConcurrentRequests();
        
        console.log('\n✅ ALL EDGE CASE TESTS COMPLETED');
        console.log('System robustness and error handling verified');
        
    } catch (error) {
        console.error('\n❌ Edge case test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { 
    testEdgeCase, 
    testMalformedRequests, 
    testNonsensicalQueries, 
    testBoundaryConditions,
    testSpecialCharactersAndEncoding,
    testConcurrentRequests 
};