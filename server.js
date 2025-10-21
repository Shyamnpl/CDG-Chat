// server.js

// Libraries import karna
require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const app = express();
const port = 3000; // Hum port 3000 use karenge

// API Keys ko .env file se load karna
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// --- AI Clients ko Initialize Karna ---

// OpenAI Client (ChatGPT ke liye)
const openai_client = new OpenAI({ apiKey: OPENAI_API_KEY });

// DeepSeek Client (OpenAI library ka hi use karta hai)
const deepseek_client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1"
});

// Google Gemini Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const gemini_model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });


// --- Middleware ---
app.use(express.json()); // JSON requests ko samajhne ke liye
 app.use(express.static('public')); // 'public' folder se static files serve karne ke liye

// --- API Route ---
app.post('/ask-all', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is missing" });
    }

    // Har AI se response lene ke liye functions
    const askChatGPT = async () => {
        try {
            const response = await openai_client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            });
            return response.choices[0].message.content.trim();
        } catch (e) { return `Error calling ChatGPT: ${e.message}`; }
    };

    const askGemini = async () => {
        try {
            const result = await gemini_model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e) { return `Error calling Gemini: ${e.message}`; }
    };

    const askDeepSeek = async () => {
        try {
            const response = await deepseek_client.chat.completions.create({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            });
            return response.choices[0].message.content.trim();
        } catch (e) { return `Error calling DeepSeek: ${e.message}`; }
    };
    
    // Teeno ko ek saath (concurrently) call karna taaki time bache
    try {
        const [chatgpt, gemini, deepseek] = await Promise.all([
            askChatGPT(),
            askGemini(),
            askDeepSeek()
        ]);
        res.json({ chatgpt, gemini, deepseek });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong on the server." });
    }
});

// --- Server ko Start Karna ---
app.listen(port, () => {
    console.log(`Server chal raha hai http://localhost:${port} par`);
});
