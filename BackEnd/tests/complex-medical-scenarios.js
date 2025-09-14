import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/doctor';

// Test helper function for complex scenarios
async function testComplexScenario(query, expectedSpecialization = null, description = '') {
    try {
        console.log(`\n🔬 Testing Complex Scenario: ${description}`);
        console.log('─'.repeat(80));
        console.log(`Query: "${query}"`);
        
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
        
        console.log(`\n📋 AI Analysis:`);
        console.log(`  Interpretation: ${data.aiEnhancement.interpretedQuery || 'None provided'}`);
        console.log(`  Enhanced Search: ${data.aiEnhancement.enhancedSearch ? '✅ YES' : '❌ NO'}`);
        console.log(`  AI Error: ${data.aiEnhancement.aiError || 'None'}`);
        
        console.log(`\n🔍 Search Parameters:`);
        console.log(JSON.stringify(data.aiEnhancement.searchParameters, null, 2));
        
        console.log(`\n📊 Results:`);
        console.log(`  Doctors Found: ${data.data.pagination.totalDoctors}`);
        
        if (data.data.doctors.length > 0) {
            console.log(`  Top Results:`);
            data.data.doctors.slice(0, 3).forEach((doctor, index) => {
                console.log(`    ${index + 1}. ${doctor.name} - ${doctor.specialization} (${doctor.yearsOfExperience} years)`);
            });
        }
        
        // Validate expected specialization if provided
        if (expectedSpecialization && data.aiEnhancement.searchParameters.specialization) {
            const match = data.aiEnhancement.searchParameters.specialization.toLowerCase().includes(expectedSpecialization.toLowerCase());
            console.log(`\n✓ Expected Specialization (${expectedSpecialization}): ${match ? '✅ MATCHED' : '❌ NOT MATCHED'}`);
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ Complex scenario test failed: ${error.message}`);
        return null;
    }
}

// Hard-to-find medical scenarios
async function runComplexMedicalScenarios() {
    console.log('\n🧬 RUNNING COMPLEX MEDICAL SCENARIOS');
    console.log('='.repeat(80));
    console.log('Testing AI ability to handle sophisticated medical queries...');
    
    const complexScenarios = [
        {
            query: "I have chronic fatigue, brain fog, and joint pain after a viral infection - what specialist should I see?",
            expected: "Neurology",
            description: "Post-viral syndrome with neurological symptoms"
        },
        {
            query: "My child has developmental delays, speech problems, and repetitive behaviors - which doctor can help?",
            expected: "Pediatrics",
            description: "Pediatric developmental disorders (possible autism spectrum)"
        },
        {
            query: "I need a doctor who specializes in rare autoimmune disorders affecting the nervous system",
            expected: "Neurology",
            description: "Rare neurological autoimmune conditions"
        },
        {
            query: "I have unexplained weight loss, night sweats, and swollen lymph nodes - what type of oncologist should I consult?",
            expected: "Oncology",
            description: "Potential hematological malignancy symptoms"
        },
        {
            query: "I need a specialist for complex congenital heart defects in adults",
            expected: "Cardiology",
            description: "Adult congenital heart disease specialist"
        },
        {
            query: "My elderly parent has memory loss, confusion, and difficulty swallowing - what neurologist subspecialty?",
            expected: "Neurology",
            description: "Neurodegenerative conditions with dysphagia"
        },
        {
            query: "I have chronic pain in multiple joints, morning stiffness, and family history of autoimmune disease",
            expected: "Orthopedics",
            description: "Inflammatory arthritis/rheumatological condition"
        },
        {
            query: "I need a doctor who treats hormone-related cancers in women under 40",
            expected: "Oncology",
            description: "Young women's hormone-sensitive cancers"
        },
        {
            query: "I have recurrent seizures that don't respond to standard medications - what epilepsy specialist?",
            expected: "Neurology",
            description: "Treatment-resistant epilepsy"
        },
        {
            query: "My teenager has eating disorders, self-harm, and mood swings - what psychiatric subspecialist?",
            expected: "Psychiatry",
            description: "Adolescent psychiatric complex presentation"
        },
        {
            query: "I need help with chronic inflammatory bowel disease and joint complications",
            expected: "Gastroenterology",
            description: "IBD with extraintestinal manifestations"
        },
        {
            query: "I have severe sleep apnea, daytime fatigue, and heart rhythm problems",
            expected: "Cardiology",
            description: "Sleep-related cardiovascular complications"
        },
        {
            query: "My baby has feeding difficulties, failure to thrive, and developmental concerns",
            expected: "Pediatrics",
            description: "Pediatric feeding and development issues"
        },
        {
            query: "I need treatment for medication-resistant depression with psychotic features",
            expected: "Psychiatry",
            description: "Treatment-resistant psychotic depression"
        },
        {
            query: "I have multiple endocrine disorders affecting thyroid, adrenals, and reproductive hormones",
            expected: "Endocrinology",
            description: "Multiple endocrine neoplasia or complex hormonal disorders"
        }
    ];
    
    let successCount = 0;
    let totalTests = complexScenarios.length;
    
    for (const scenario of complexScenarios) {
        const result = await testComplexScenario(
            scenario.query, 
            scenario.expected, 
            scenario.description
        );
        
        if (result && result.success) {
            successCount++;
        }
        
        // Rate limiting to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n' + '='.repeat(80));
    }
    
    console.log(`\n📈 COMPLEX SCENARIOS SUMMARY:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
}

// Rare disease and specialty queries
async function runRareDiseaseScenarios() {
    console.log('\n🔬 RUNNING RARE DISEASE SCENARIOS');
    console.log('='.repeat(80));
    
    const rareDiseaseQueries = [
        {
            query: "I need a specialist for Wilson's disease with neurological symptoms",
            description: "Rare genetic copper metabolism disorder"
        },
        {
            query: "I have Ehlers-Danlos syndrome and need pain management",
            description: "Connective tissue disorder requiring specialized care"
        },
        {
            query: "My child may have Prader-Willi syndrome and needs specialized care",
            description: "Rare genetic syndrome affecting development"
        },
        {
            query: "I need treatment for primary immunodeficiency disorders",
            description: "Rare immune system disorders"
        },
        {
            query: "I have suspected Marfan syndrome affecting my heart and eyes",
            description: "Connective tissue disorder with multi-system involvement"
        }
    ];
    
    for (const scenario of rareDiseaseQueries) {
        await testComplexScenario(scenario.query, null, scenario.description);
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('\n' + '─'.repeat(60));
    }
}

// Main function to run all complex tests
async function main() {
    console.log('🏥 COMPLEX MEDICAL SCENARIOS TESTING STARTING...');
    console.log('This tests the AI\'s ability to handle sophisticated medical queries');
    console.log('Server must be running on http://localhost:5000\n');
    
    try {
        await runComplexMedicalScenarios();
        await runRareDiseaseScenarios();
        
        console.log('\n✅ ALL COMPLEX SCENARIO TESTS COMPLETED');
        console.log('Review the results to assess AI interpretation accuracy');
        
    } catch (error) {
        console.error('\n❌ Complex scenario test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { testComplexScenario, runComplexMedicalScenarios, runRareDiseaseScenarios };