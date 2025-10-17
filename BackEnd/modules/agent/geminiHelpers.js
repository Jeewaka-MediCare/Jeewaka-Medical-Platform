// Gemini Agent utility for Vertex AI generative chat/completion
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// --- Configuration ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


/**
 * Starts a new chat session with a specific system prompt.
 * @param {string} systemPrompt - The system instructions that define the AI's role and rules.
 * @returns {ChatSession} A chat session object from the GoogleGenerativeAI library.
 */
export function startGeminiChat(systemPrompt) {
    // CORRECTED: The systemInstruction must be an object with a `parts` array.
    return model.startChat({
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        history: [],
    });
}

/**
 * Sends a single, non-conversational request to Gemini for content generation.
 * Ideal for tasks like data extraction or summarization from a given text.
 * @param {string} systemPrompt - The instructions for the model.
 * @param {string} userPrompt - The user's content or text to be processed.
 * @returns {Promise<string>} The generated text content from Gemini.
 */
export async function generateContent(systemPrompt, userPrompt) {
    try {
        const result = await model.generateContent({
             contents: [{ role: "user", parts: [{ text: userPrompt }] }],
             systemInstruction: {
                 parts: [{ text: systemPrompt }]
            }
        });
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error('Gemini content generation error:', err);
        throw new Error("Failed to generate content from Gemini.");
    }
}

