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
                model: 'google/gemini-2.5flash-lite',
                messages: [{
                    role: 'user',
                    content: `Extract key learning concepts from this text. Return ONLY valid JSON in this exact format with NO other text:
{"concepts": [{"name": "concept name", "description": "brief description"}]}

Text: ${text.substring(0, 3000)}`
                }]
            })
        });

        console.log('OpenRouter response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Successfully received response');
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('API Key loaded:', !!process.env.OPENROUTER_API_KEY);
});