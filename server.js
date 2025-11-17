const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Helper function to call Google Gemini API
async function callGeminiAPI(prompt, systemInstruction = '') {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error('No response from Gemini');
    }
    
    return text;
}

app.post('/api/extract-concepts', async (req, res) => {
    const { text } = req.body;
    
    console.log('Received request to extract concepts');
    
    try {
        const prompt = `Extract key learning concepts from this text. For each concept, provide a clear name and detailed educational description.

Return ONLY valid JSON in this exact format with NO other text or markdown:
{"concepts": [{"name": "Concept Name", "description": "Detailed educational description"}]}

Text to analyze: ${text}`;

        const response = await callGeminiAPI(prompt);
        
        // Return in OpenRouter-like format for compatibility
        res.json({
            choices: [{
                message: {
                    content: response
                }
            }]
        });
    } catch (error) {
        console.error('Concept extraction error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, concepts, educationLevel } = req.body;
    
    console.log('Received chat request');
    
    const educationLevels = {
        'elementary': 'elementary school',
        'middle': 'middle school',
        'high': 'high school',
        'undergraduate': 'undergraduate/college',
        'graduate': 'graduate school',
        'professional': 'professional/advanced'
    };
    
    try {
        const systemPrompt = `You are an AI Study Buddy for a ${educationLevels[educationLevel] || 'high school'} student. The student has learned these concepts:

${concepts}

Be friendly, encouraging, and educational at a ${educationLevels[educationLevel] || 'high school'} level. Help them understand their concepts better, answer questions, provide study tips, and quiz them when appropriate. Keep responses concise and clear.`;

        const response = await callGeminiAPI(message, systemPrompt);
        
        res.json({
            choices: [{
                message: {
                    content: response
                }
            }]
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate-flashcards', async (req, res) => {
    const { concept, educationLevel } = req.body;
    
    const educationLevels = {
        'elementary': 'elementary school',
        'middle': 'middle school',
        'high': 'high school',
        'undergraduate': 'undergraduate/college',
        'graduate': 'graduate school',
        'professional': 'professional/advanced'
    };
    
    try {
        const prompt = `Generate 5-10 flashcards for studying "${concept}" at ${educationLevels[educationLevel] || 'high school'} level.

For each flashcard:
- Front: A question, term, or equation
- Back: The answer, definition, or explanation

Return ONLY valid JSON with NO markdown or extra text:
{"flashcards": [{"front": "question/term/equation", "back": "answer/definition/explanation"}]}`;

        const response = await callGeminiAPI(prompt);
        
        res.json({
            choices: [{
                message: {
                    content: response
                }
            }]
        });
    } catch (error) {
        console.error('Flashcard generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate-quiz', async (req, res) => {
    const { concepts, educationLevel, numQuestions } = req.body;
    
    const educationLevels = {
        'elementary': 'elementary school',
        'middle': 'middle school',
        'high': 'high school',
        'undergraduate': 'undergraduate/college',
        'graduate': 'graduate school',
        'professional': 'professional/advanced'
    };
    
    try {
        const prompt = `Generate ${numQuestions || 10} multiple choice quiz questions for these concepts: ${concepts}
Level: ${educationLevels[educationLevel] || 'high school'}

Each question should have:
- A clear question
- 4 options
- The correct answer text

Return ONLY valid JSON with NO markdown:
{"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "correct option text"}]}`;

        const response = await callGeminiAPI(prompt);
        
        res.json({
            choices: [{
                message: {
                    content: response
                }
            }]
        });
    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/study-buddy', async (req, res) => {
    const { message, educationLevel } = req.body;
    
    const educationLevels = {
        'elementary': 'elementary school',
        'middle': 'middle school',
        'high': 'high school',
        'undergraduate': 'undergraduate/college',
        'graduate': 'graduate school',
        'professional': 'professional/advanced'
    };
    
    try {
        const systemPrompt = `You are a helpful study buddy AI for a ${educationLevels[educationLevel] || 'high school'} student. You ONLY answer questions related to academic subjects, homework, studying, and learning. If the user asks anything unrelated to studies (like personal questions, entertainment, general chat), politely remind them to focus on their studies with a message like "Let's stay focused on your studies! 📚 Do you have any questions about your coursework or topics you're learning?"`;

        const response = await callGeminiAPI(message, systemPrompt);
        
        res.json({
            choices: [{
                message: {
                    content: response
                }
            }]
        });
    } catch (error) {
        console.error('Study buddy error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Gemini API Key loaded:', !!process.env.GEMINI_API_KEY);
});