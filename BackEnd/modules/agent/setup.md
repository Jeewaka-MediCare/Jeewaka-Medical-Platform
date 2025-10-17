Project Context to Provide
1. Project Overview

Building a healthcare platform with an AI agent
Agent collects patient medical information via conversation
Three implementation stages (chatbot → structured output → JSON integration)
Currently at Stage 1: Basic backend chatbot agent (no frontend)

2. Medical Record Template
---
Provide your initial record template (the one you shared earlier)
      const initialContent = `# Medical History - ${patient.name}

## Personal Information
- **Name:** ${patient.name}
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

*Record created on: ${new Date().toLocaleDateString()}*
*This is an initial medical record. Healthcare providers will update this during consultations.*`;

---

Explain that agent can only update this medical record. It cannot edit medical records created by other doctors, but read them.
Agent cannot modify doctor-written sections

3. Technology Stack

Gemini 2.5 Flash API
JavaScript/Node.js environment
JSON for data storage via medical records in MongoDB databas

4. User Context (Patient Info)

Agent interacts with one patient at a time
Should ask questions to gather medical history
Maintain conversation context across multiple turns

Stage 1 Specific Steps
Step 1: Initialize Agent

Set up Gemini 2.5 Flash API client
Create system prompt that defines agent role as clinical assistant
Instructions: Ask one question at a time, max 20 questions, collect medical history
System prompt should guide toward gathering: medications, allergies, past conditions, family history, emergency contact

Step 2: Conversation Loop

Agent asks initial question to start interview
Accept user input from console/stdin
Pass user input to agent with conversation history
Agent responds with next question or provides summary if done
Continue until agent signals end of interview (after ~20 questions)

Step 3: Maintain Conversation History

Store all messages in an array with role (user/assistant)
Pass full history to each Gemini API call
This provides context for natural conversation flow

Step 4: Handle Interview Completion

Agent should recognize when enough information is collected
Provide summary of what was gathered
Signal end of interview

Step 5: Output for Testing

Log entire conversation to console
Save conversation transcript to file for review
Display what information was captured

Key Constraints for Claude Code
System Prompt Requirements:

Clear role: "You are a clinical assistant conducting a pre-visit interview"
Critical rules: Ask ONE question at a time, max 20 words per question, max 20 questions total
No medical advice or diagnosis
Focus on factual information gathering
Use patient's existing context if available

API Integration:

Initialize Gemini client with proper credentials
Handle rate limits and errors gracefully
Set appropriate temperature (0.1-0.3 for consistency)
Configure max_tokens for responses

Conversation Management:

Build messages array with system prompt + conversation history
Send to API on each turn
Parse response and add to history
Validate response isn't empty or malformed

Input/Output Specification
Input:

Patient name (for context)
Patient basic info if available (age, gender, existing conditions for context)
User responses typed in console

Output:

Formatted conversation (Q: ... A: ...)
Interview transcript saved to file
Confirmation of interview completion

Success Criteria for Stage 1

 Agent asks coherent medical history questions
 Conversation maintains context (agent remembers previous answers)
 Interview completes naturally (doesn't loop or repeat)
 Can handle at least 10-15 turns before completion
 Transcript is readable and shows progression through medical history sections