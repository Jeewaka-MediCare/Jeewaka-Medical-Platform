import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { helpers } from '@google-cloud/aiplatform';

/**
 * Generate embeddings using Vertex AI Text Embedding API
 * @param {string} text - Text to generate embeddings for
 * @param {string} project - Google Cloud project ID
 * @param {string} location - Google Cloud location
 * @param {string} model - Model name to use for embeddings
 * @param {string} task - Task type for embedding
 * @returns {Promise<number[]>} Array of embedding values
 * This generates a 768-dimensional vector with the text-embedding-004 model    
 */
export const generateVertexEmbedding = async (
    text, 
    project = process.env.GOOGLE_CLOUD_PROJECT_ID, 
    location = 'us-central1',
    model = 'text-embedding-004', // This model determines the dimensions
    task = 'RETRIEVAL_DOCUMENT'
) => {
    try {
        const apiEndpoint = `${location}-aiplatform.googleapis.com`;
        const clientOptions = {
            apiEndpoint: apiEndpoint,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        };
        
        // Initialize the client
        const client = new PredictionServiceClient(clientOptions);

        // The model endpoint
        const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;

        // Prepare the instance using helpers to construct protobuf.Value objects
        const instance = helpers.toValue({
            content: text,
            task_type: task
        });

        // Make the prediction request
        const request = {
            endpoint,
            instances: [instance],
        };

        const [response] = await client.predict(request);

        // Extract the embedding values using the correct format
        if (response.predictions && response.predictions.length > 0) {
            const predictions = response.predictions;
            const embeddings = predictions.map(p => {
                const embeddingsProto = p.structValue.fields.embeddings;
                const valuesProto = embeddingsProto.structValue.fields.values;
                return valuesProto.listValue.values.map(v => v.numberValue);
            });
            
            return embeddings[0]; // Return the first (and only) embedding
        } else {
            throw new Error('No predictions returned from Vertex AI');
        }

    } catch (error) {
        console.error("Error generating Vertex AI embedding:", error);
        throw new Error(`Failed to generate Vertex AI embedding: ${error.message}`);
    }
}

/**
 * Analyze sentiment using Google Cloud Natural Language API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment analysis result
 */
export const analyzeSentiment = async (text) => {
    const {LanguageServiceClient} = await import('@google-cloud/language');
    
    try {
        const language = new LanguageServiceClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        const [response] = await language.analyzeSentiment({
            document: {
                content: text,
                type: 'PLAIN_TEXT',
            },
        });

        return {
            text: text,
            sentiment: response.documentSentiment.score,
            magnitude: response.documentSentiment.magnitude,
            success: true
        };
    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        throw new Error("Failed to analyze sentiment.");
    }
}

/**
 * Extract entities from text using Google Cloud Natural Language API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Entity analysis result
 */
export const extractEntities = async (text) => {
    const {LanguageServiceClient} = await import('@google-cloud/language');
    
    try {
        const language = new LanguageServiceClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        const [response] = await language.analyzeEntities({
            document: {
                content: text,
                type: 'PLAIN_TEXT',
            },
        });

        return {
            text: text,
            entities: response.entities,
            success: true
        };
    } catch (error) {
        console.error("Error extracting entities:", error);
        throw new Error("Failed to extract entities.");
    }
}

/**
 * Authenticate and test Vertex AI connection
 * @param {string} project - Google Cloud project ID
 * @returns {Promise<boolean>} True if authentication successful
 */
export const testVertexAIAuthentication = async (project = process.env.GOOGLE_CLOUD_PROJECT_ID) => {
    try {
        const testText = "Hello, world! This is a test for Vertex AI authentication.";
        
        // Test sentiment analysis first as it's simpler
        const sentimentResult = await analyzeSentiment(testText);
        console.log(`Sentiment test successful! Sentiment: ${sentimentResult.sentiment}, Magnitude: ${sentimentResult.magnitude}`);
        
        // Test embedding generation
        const embedding = await generateVertexEmbedding(testText, project);
        console.log(`Embedding test successful! Vector length: ${embedding.length}`);
        
        return true;
    } catch (error) {
        console.error("Vertex AI authentication test failed:", error);
        return false;
    }
}