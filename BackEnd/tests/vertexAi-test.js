import { 
    generateVertexEmbedding, 
    analyzeSentiment, 
    extractEntities, 
    testVertexAIAuthentication 
} from '../utils/vertexAI.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

/**
 * Comprehensive test suite for all vertexAI.js functions
 */

async function testAllFunctions() {
    console.log('🧪 Testing all functions in vertexAI.js...\n');
    console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Credentials:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('='.repeat(80) + '\n');

    const results = {
        generateVertexEmbedding: { tested: false, success: false, error: null, data: null },
        analyzeSentiment: { tested: false, success: false, error: null, data: null },
        extractEntities: { tested: false, success: false, error: null, data: null },
        testVertexAIAuthentication: { tested: false, success: false, error: null, data: null }
    };

    // Test data
    const testText = "Dr. Sarah Johnson is an excellent pediatric cardiologist with 15 years of experience at Children's Medical Center in New York. She specializes in congenital heart defects and minimally invasive cardiac surgery for children.";

    // Test 1: generateVertexEmbedding
    console.log('🔍 Test 1: generateVertexEmbedding()');
    console.log('-'.repeat(50));
    try {
        const startTime = Date.now();
        
        console.log('Testing with default parameters...');
        const embedding1 = await generateVertexEmbedding(testText);
        
        console.log('Testing with RETRIEVAL_QUERY task...');
        const embedding2 = await generateVertexEmbedding(testText, undefined, undefined, undefined, 'RETRIEVAL_QUERY');
        
        const endTime = Date.now();
        
        results.generateVertexEmbedding = {
            tested: true,
            success: true,
            error: null,
            data: {
                dimensions: embedding1.length,
                timeTaken: endTime - startTime,
                sampleValues: embedding1.slice(0, 5),
                queryEmbeddingDims: embedding2.length,
                defaultModel: 'text-embedding-001'
            }
        };
        
        console.log('✅ generateVertexEmbedding() - SUCCESS');
        console.log(`   Dimensions: ${embedding1.length}`);
        console.log(`   Time taken: ${endTime - startTime}ms`);
        console.log(`   Sample values: [${embedding1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        console.log(`   Query embedding dims: ${embedding2.length}`);
        
    } catch (error) {
        results.generateVertexEmbedding = {
            tested: true,
            success: false,
            error: error.message,
            data: null
        };
        console.log('❌ generateVertexEmbedding() - FAILED');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: analyzeSentiment
    console.log('🔍 Test 2: analyzeSentiment()');
    console.log('-'.repeat(50));
    try {
        const startTime = Date.now();
        const sentimentResult = await analyzeSentiment(testText);
        const endTime = Date.now();
        
        results.analyzeSentiment = {
            tested: true,
            success: true,
            error: null,
            data: {
                sentiment: sentimentResult.sentiment,
                magnitude: sentimentResult.magnitude,
                timeTaken: endTime - startTime,
                textLength: testText.length
            }
        };
        
        console.log('✅ analyzeSentiment() - SUCCESS');
        console.log(`   Sentiment score: ${sentimentResult.sentiment.toFixed(4)} (-1 to 1 scale)`);
        console.log(`   Magnitude: ${sentimentResult.magnitude.toFixed(4)} (0 to 1+ scale)`);
        console.log(`   Time taken: ${endTime - startTime}ms`);
        console.log(`   Text analyzed: ${testText.length} characters`);
        
    } catch (error) {
        results.analyzeSentiment = {
            tested: true,
            success: false,
            error: error.message,
            data: null
        };
        console.log('❌ analyzeSentiment() - FAILED');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test 3: extractEntities
    console.log('🔍 Test 3: extractEntities()');
    console.log('-'.repeat(50));
    try {
        const startTime = Date.now();
        const entitiesResult = await extractEntities(testText);
        const endTime = Date.now();
        
        results.extractEntities = {
            tested: true,
            success: true,
            error: null,
            data: {
                entityCount: entitiesResult.entities.length,
                timeTaken: endTime - startTime,
                entityTypes: entitiesResult.entities.map(e => e.type),
                entityNames: entitiesResult.entities.map(e => e.name)
            }
        };
        
        console.log('✅ extractEntities() - SUCCESS');
        console.log(`   Entities found: ${entitiesResult.entities.length}`);
        console.log(`   Time taken: ${endTime - startTime}ms`);
        
        if (entitiesResult.entities.length > 0) {
            console.log('   Detected entities:');
            entitiesResult.entities.forEach((entity, index) => {
                console.log(`     ${index + 1}. "${entity.name}" (${entity.type}) - Salience: ${entity.salience.toFixed(3)}`);
            });
        }
        
    } catch (error) {
        results.extractEntities = {
            tested: true,
            success: false,
            error: error.message,
            data: null
        };
        console.log('❌ extractEntities() - FAILED');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test 4: testVertexAIAuthentication
    console.log('🔍 Test 4: testVertexAIAuthentication()');
    console.log('-'.repeat(50));
    try {
        const startTime = Date.now();
        const authResult = await testVertexAIAuthentication();
        const endTime = Date.now();
        
        results.testVertexAIAuthentication = {
            tested: true,
            success: authResult,
            error: authResult ? null : 'Authentication test returned false',
            data: {
                timeTaken: endTime - startTime,
                authenticationWorking: authResult
            }
        };
        
        if (authResult) {
            console.log('✅ testVertexAIAuthentication() - SUCCESS');
            console.log(`   Authentication: Working correctly`);
            console.log(`   Time taken: ${endTime - startTime}ms`);
        } else {
            console.log('❌ testVertexAIAuthentication() - FAILED');
            console.log(`   Authentication: Not working`);
        }
        
    } catch (error) {
        results.testVertexAIAuthentication = {
            tested: true,
            success: false,
            error: error.message,
            data: null
        };
        console.log('❌ testVertexAIAuthentication() - FAILED');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Summary Report
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(80));

    const totalTests = Object.keys(results).length;
    const successfulTests = Object.values(results).filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`\nTotal Functions Tested: ${totalTests}`);
    console.log(`Successful: ${successfulTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%\n`);

    // Detailed results
    for (const [functionName, result] of Object.entries(results)) {
        console.log(`${result.success ? '✅' : '❌'} ${functionName}()`);
        if (result.success && result.data) {
            if (functionName === 'generateVertexEmbedding') {
                console.log(`   → ${result.data.dimensions} dimensions, ${result.data.timeTaken}ms`);
            } else if (functionName === 'analyzeSentiment') {
                console.log(`   → Sentiment: ${result.data.sentiment.toFixed(3)}, Magnitude: ${result.data.magnitude.toFixed(3)}`);
            } else if (functionName === 'extractEntities') {
                console.log(`   → ${result.data.entityCount} entities found`);
            } else if (functionName === 'testVertexAIAuthentication') {
                console.log(`   → Authentication working: ${result.data.authenticationWorking}`);
            }
        }
        if (!result.success && result.error) {
            console.log(`   → Error: ${result.error}`);
        }
    }

    console.log('\n' + '='.repeat(80));

    // Final status
    if (successfulTests === totalTests) {
        console.log('🎉 ALL FUNCTIONS WORKING PERFECTLY!');
        console.log('Your Vertex AI integration is ready for production use! 🚀');
    } else {
        console.log(`⚠️  ${failedTests} function(s) need attention.`);
        console.log('Check the errors above and ensure proper API access and credentials.');
    }

    return results;
}

// Run the comprehensive test
testAllFunctions().catch(error => {
    console.error('❌ Test suite failed:', error);
});