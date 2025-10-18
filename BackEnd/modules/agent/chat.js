import { startGeminiChat, generateContent } from './geminiHelpers.js';
import readline from 'readline';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// --- System Prompts ---
const interviewerSystemPrompt = `
Your name is Kai, a friendly and professional clinical assistant.
Your objective is to interview a new patient to gather their basic information.

### CRITICAL RULES ###
1.  **Be Conversational:** Do not just list questions. Ask them one by one in a natural, flowing conversation.
2.  **One Question at a Time:** You MUST ask only ONE question per turn.
3.  **Keep it Brief:** Your questions should be short and easy to understand.
4.  **Goal-Oriented:** Your primary goal is to collect all the information needed for the patient record. The fields you need to fill are: Full Name, Date of Birth, Gender, Blood Type, Phone Number, Email Address, Known Allergies, and an Emergency Contact (Name and Phone Number).
5.  **Be Adaptable:** If the user provides multiple pieces of information at once, acknowledge them and ask for the next piece of missing information. For example, if they give their name and DOB, you might say, "Got it, thank you. And what is your gender?"
6.  **Concluding the Interview:** Once you are confident you have gathered all the required information, you MUST end your final message with the exact phrase: "[END_INTERVIEW]". Do not use this phrase until you have all the data.
`;

const dataExtractorSystemPrompt = `
You are a highly accurate data extraction agent. You will be given a conversation transcript between a clinical assistant and a patient.
Your sole task is to extract the required information and format it as a valid JSON object.

### INSTRUCTIONS ###
1.  Analyze the provided transcript.
2.  Extract the values for the following keys: "name", "dateOfBirth", "gender", "bloodType", "phone", "email", "allergies", "emergencyContact".
3.  The "allergies" value must be an array of strings. If the patient reports no allergies, return an empty array [].
4.  If any piece of information is not mentioned in the transcript, the value for its key should be null.
5.  Your output MUST be ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.
`;

// Helper to ask questions in the terminal
function askQuestion(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}


async function main() {
    console.log("\nClinical Assistant (Kai): Hello! I'm Kai, a clinical assistant.");
    console.log("I just need to ask a few questions to set up your patient record.");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const chat = startGeminiChat(interviewerSystemPrompt);
    let fullTranscriptForExtraction = "";

    // Manually start the conversation
    const initialResponse = await chat.sendMessage("Start the interview now.");
    const firstQuestion = initialResponse.response.text();
    console.log(`Clinical Assistant (Kai): ${firstQuestion}`);
    fullTranscriptForExtraction += `Kai: ${firstQuestion}\n`;

    // --- Interview Loop ---
    while (true) {
        const userInput = await askQuestion(rl, "You: ");
        fullTranscriptForExtraction += `Patient: ${userInput}\n`;

        if (userInput.toLowerCase() === 'exit') {
            console.log("Exiting interview.");
            break;
        }

        const response = await chat.sendMessage(userInput);
        const assistantResponse = response.response.text().trim();

        if (assistantResponse.includes("[END_INTERVIEW]")) {
            const finalMessage = assistantResponse.replace("[END_INTERVIEW]", "").trim();
            console.log(`Clinical Assistant (Kai): ${finalMessage}`);
            console.log("\nThank you. I have all the information I need. Generating your record now...");
            break;
        }

        console.log(`Clinical Assistant (Kai): ${assistantResponse}`);
        fullTranscriptForExtraction += `Kai: ${assistantResponse}\n`;
    }
    rl.close();

    // --- Data Extraction and Report Generation ---
    try {
        console.log("\nExtracting data from transcript...");
        // CORRECTED: Call generateContent with the system prompt and user prompt as separate arguments.
        const userPromptForExtraction = `<transcript>\n${fullTranscriptForExtraction}</transcript>`;
        const extractionResult = await generateContent(dataExtractorSystemPrompt, userPromptForExtraction);
        
        // Clean the response to ensure it's valid JSON
        const jsonText = extractionResult.replace(/```json/g, "").replace(/```/g, "").trim();
        const patient = JSON.parse(jsonText);

        // --- Format the Final Report ---
        const report = `
## Personal Information
- **Name:** ${patient.name || 'Not provided'}
- **Date of Birth:** ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'}
- **Gender:** ${patient.gender || 'Not provided'}
- **Blood Type:** ${patient.bloodType || 'Not provided'}
- **Phone:** ${patient.phone || 'Not provided'}
- **Email:** ${patient.email || 'Not provided'}

## Medical History
*This section will be updated by healthcare providers during consultations*

### Current Medications
- None reported

### Known Allergies
- ${patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None reported'}

### Previous Medical Conditions
- None reported

### Family Medical History
- Not documented

### Emergency Contact
- ${patient.emergencyContact || 'Not provided'}
`;
        console.log("\n--- Patient Record Summary ---");
        console.log(report);

        fs.writeFileSync("patient_record.json", JSON.stringify(patient, null, 4));
        console.log("\nSuccessfully saved detailed record to patient_record.json");

    } catch (e) {
        console.error("\nAn error occurred while generating the report:", e);
        console.log("Could not finalize the patient record. Full transcript saved for manual review.");
        fs.writeFileSync("interview_transcript.txt", fullTranscriptForExtraction);
    }
}

main();

