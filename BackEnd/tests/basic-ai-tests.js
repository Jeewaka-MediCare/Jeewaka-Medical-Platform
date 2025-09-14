import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/doctor';

// Test helper function
async function testAISearch(query, description = '') {
    try {
        console.log(`\n🧪 Testing: ${description || query}`);
        console.log('─'.repeat(60));
        
        const response = await fetch(`${BASE_URL}/ai-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log(`Query: "${query}"`);
        console.log(`AI Interpretation: ${data.aiEnhancement.interpretedQuery || 'None'}`);
        console.log(`Enhanced Search: ${data.aiEnhancement.enhancedSearch ? '✅' : '❌'}`);
        
        if (data.aiEnhancement.aiError) {
            console.log(`AI Error: ${data.aiEnhancement.aiError}`);
        }
        
        console.log(`Search Parameters:`, JSON.stringify(data.aiEnhancement.searchParameters, null, 2));
        console.log(`Results Found: ${data.data.pagination.totalDoctors}`);
        
        if (data.data.doctors.length > 0) {
            console.log(`Top Result: ${data.data.doctors[0].name} - ${data.data.doctors[0].specialization}`);
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return null;
    }
}

// Test AI suggestions
async function testAISuggestions(partialQuery) {
    try {
        console.log(`\n💡 Testing AI Suggestions for: "${partialQuery}"`);
        console.log('─'.repeat(60));
        
        const response = await fetch(`${BASE_URL}/ai-suggestions?partialQuery=${encodeURIComponent(partialQuery)}`);
        const data = await response.json();
        
        console.log(`Suggestions (${data.data.suggestions.length}):`);
        data.data.suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion}`);
        });
        
        return data;
        
    } catch (error) {
        console.error(`❌ Suggestions test failed: ${error.message}`);
        return null;
    }
}

// Basic AI Search Tests
async function runBasicTests() {
    console.log('\n🚀 RUNNING BASIC AI SEARCH TESTS');
    console.log('='.repeat(80));
    
    const basicTests = [
        { query: "I need a heart doctor", description: "Simple heart condition" },
        { query: "female skin doctor", description: "Gender + specialization" },
        { query: "Tamil speaking oncologist", description: "Language + specialization" },
        { query: "experienced cardiologist", description: "Experience requirement" },
        { query: "cheap consultation under 25 dollars", description: "Fee constraint" },
        { query: "brain doctor with 10 years experience", description: "Experience + specialization" },
        { query: "I have chest pain", description: "Symptom-based query" },
        { query: "pediatric doctor for my child", description: "Pediatric specialization" },
        { query: "mental health specialist", description: "Mental health query" },
        { query: "ENT doctor near me", description: "Specialization with location" }
    ];
    
    for (const test of basicTests) {
        await testAISearch(test.query, test.description);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
}

// Test AI suggestions
async function runSuggestionTests() {
    console.log('\n\n🚀 RUNNING AI SUGGESTIONS TESTS');
    console.log('='.repeat(80));
    
    const suggestionQueries = [
        "heart",
        "skin",
        "brain",
        "cancer",
        "child",
        "female",
        "tamil",
        "cheap"
    ];
    
    for (const query of suggestionQueries) {
        await testAISuggestions(query);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Run all basic tests
async function main() {
    console.log('🏥 AI SEARCH BASIC TESTS STARTING...');
    console.log('Server must be running on http://localhost:5000');
    
    try {
        await runBasicTests();
        await runSuggestionTests();
        
        console.log('\n✅ ALL BASIC TESTS COMPLETED');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { testAISearch, testAISuggestions, runBasicTests, runSuggestionTests };