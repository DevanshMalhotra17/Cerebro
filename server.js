const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/extract-concepts', async (req, res) => {
    const { text } = req.body;
    
    console.log('Received request to extract concepts');
    console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Cerebro Learning Platform'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{
                    role: 'user',
                    content: `Extract key learning concepts from this text. For each concept, provide a clear name and detailed educational description.

Return ONLY valid JSON in this exact format with NO other text or markdown:
{"concepts": [{"name": "Concept Name", "description": "Detailed educational description"}]}

Text to analyze: ${text}`
                }]
            })
        });

        console.log('OpenRouter response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully received response');
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, concepts } = req.body;
    
    console.log('Received chat request');
    
    try {
        const systemPrompt = `You are an AI Study Buddy helping students learn. The student has learned these concepts:

${concepts}

Be friendly, encouraging, and educational. Help them understand their concepts better, answer questions, provide study tips, and quiz them when appropriate. Keep responses concise and clear.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Cerebro Learning Platform'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully received chat response');
        res.json(data);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API Key loaded:', !!process.env.OPENROUTER_API_KEY);
});