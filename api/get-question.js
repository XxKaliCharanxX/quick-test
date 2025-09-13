// Filepath: api/get-question.js (for Vercel) or netlify/functions/get-question.js (for Netlify)

// The fetch library is not available by default in Node.js, so we need to import it.
// Ensure you have `node-fetch` in your package.json by running `npm install node-fetch`
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable not found.");
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
        }

        const { difficulty, topic } = JSON.parse(event.body);
        
        // --- FIX APPLIED ---
        // Updated the validation to accept all 5 difficulty levels sent by the quiz page.
        const validDifficulties = ["Very Easy", "Easy", "Normal", "Hard", "Very Hard"];
        if (!validDifficulties.includes(difficulty)) {
            return { statusCode: 400, body: JSON.stringify({ error: `Invalid difficulty level provided. Received: ${difficulty}` }) };
        }

        if (!topic || typeof topic !== 'string' || topic.trim() === '') {
            return { statusCode: 400, body: JSON.stringify({ error: 'A valid topic must be provided.' }) };
        }

        const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "question": { "type": "STRING" }, "options": { "type": "ARRAY", "items": { "type": "STRING" } }, "correctAnswer": { "type": "STRING" } }, required: ["question", "options", "correctAnswer"] } };
        const systemPrompt = "You are an expert quiz master. You must generate a complete quiz of 5 unique questions based on the topic and difficulty provided by the user. Your response must be a JSON array of 5 objects, matching the provided schema. Do not wrap the array in any other object.";
        const userQuery = `Generate an array of 5 unique trivia questions on the topic of "${topic}" suitable for a ${difficulty} difficulty level.`;

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json", responseSchema: schema } };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error("Error from Gemini API:", errorData);
            return { statusCode: geminiResponse.status, body: JSON.stringify({ error: 'Failed to fetch data from Gemini API.' }) };
        }
        
        const data = await geminiResponse.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) {
            throw new Error("Invalid response structure from API.");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText // Return the raw JSON string
        };

    } catch (error) {
        console.error('Internal server error in handler:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
    }
};

