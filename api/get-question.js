// Filepath: api/get-question.js (Corrected for Vercel)

export default async function handler(request, response) {
    // Vercel uses `request.method` instead of `event.httpMethod`
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable not found.");
            return response.status(500).json({ error: 'API key is not configured on the server.' });
        }

        // Vercel automatically parses the JSON body, so we use `request.body` directly
        const { difficulty, topic } = request.body;
        
        const validDifficulties = ["Very Easy", "Easy", "Normal", "Hard", "Very Hard"];
        if (!validDifficulties.includes(difficulty)) {
            return response.status(400).json({ error: `Invalid difficulty level provided. Received: ${difficulty}` });
        }

        if (!topic || typeof topic !== 'string' || topic.trim() === '') {
            return response.status(400).json({ error: 'A valid topic must be provided.' });
        }

        const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "question": { "type": "STRING" }, "options": { "type": "ARRAY", "items": { "type": "STRING" } }, "correctAnswer": { "type": "STRING" } }, required: ["question", "options", "correctAnswer"] } };
        const systemPrompt = "You are an expert quiz master. You must generate a complete quiz of 5 unique questions based on the topic and difficulty provided by the user. Your response must be a JSON array of 5 objects, matching the provided schema. Do not wrap the array in any other object.";
        const userQuery = `Generate an array of 5 unique trivia questions on the topic of "${topic}" suitable for a ${difficulty} difficulty level.`;

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json", responseSchema: schema } };

        // The 'fetch' API is globally available in Vercel's modern Node.js runtime
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error("Error from Gemini API:", errorData);
            return response.status(geminiResponse.status).json({ error: 'Failed to fetch data from Gemini API.' });
        }
        
        const data = await geminiResponse.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) {
            throw new Error("Invalid response structure from API.");
        }

        // Vercel uses `response.status().json()` to send back a JSON response
        const questionsArray = JSON.parse(jsonText);
        return response.status(200).json(questionsArray);

    } catch (error) {
        console.error('Internal server error in handler:', error);
        return response.status(500).json({ error: 'An internal server error occurred.' });
    }
}

