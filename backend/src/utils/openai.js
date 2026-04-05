import OpenAI from "openai";

const ai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 30000,
});

// Retry helper
const withRetry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (err) {
        if (retries <= 0) throw err;
        await new Promise(res => setTimeout(res, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
};

// Extract JSON safely
const extractJSON = (text) => {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                throw new Error("Invalid JSON from AI");
            }
        }
        throw new Error("Invalid JSON from AI");
    }
};

// Shared helper to call Groq chat completions
const callGroq = async (systemPrompt, userPrompt) => {
    const response = await withRetry(() =>
        ai.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }, // forces JSON output
        })
    );

    const raw = response?.choices?.[0]?.message?.content || "";
    console.log("RAW AI RESPONSE:\n", raw);
    return raw;
};

// ----------------------
// Recipe Generator
// ----------------------
export const generateRecipe = async ({
    ingredients,
    dietaryRestrictions = [],
    cuisineType = "any",
    servings = 4,
    cookingTime = "medium"
}) => {

    const timeGuide = {
        quick: "under 30 minutes",
        medium: "30-60 minutes",
        long: "over 60 minutes"
    };

    const systemPrompt = `You are a professional chef AI. Return ONLY valid JSON with no explanation, markdown, or extra text.`;

    const userPrompt = `Generate a recipe using these details:

Ingredients: ${ingredients.join(", ")}
Dietary restrictions: ${dietaryRestrictions.join(", ") || "none"}
Cuisine: ${cuisineType}
Servings: ${servings}
Cooking time: ${timeGuide[cookingTime] || "any"}

Return this exact JSON structure:
{
  "name": "string",
  "description": "string",
  "cuisineType": "string",
  "difficulty": "easy|medium|hard",
  "prepTime": number,
  "cookTime": number,
  "servings": number,
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "string" }
  ],
  "instructions": ["string"],
  "dietaryTags": ["string"],
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number,
    "fiber": number
  },
  "cookingTips": ["string"]
}`;

    try {
        const raw = await callGroq(systemPrompt, userPrompt);
        return extractJSON(raw);
    } catch (error) {
        console.error("Groq API error (recipe):", error);
        throw new Error("Failed to generate recipe");
    }
};

// ----------------------
// Pantry Suggestions
// ----------------------
export const generatePantrySuggestions = async (pantryItems, expiringItems = []) => {

    const ingredients = pantryItems.map(i => i.name).join(", ");

    const systemPrompt = `You are a helpful cooking assistant. Return ONLY valid JSON.`;

    const userPrompt = `Given these ingredients: ${ingredients}
Priority (expiring soon): ${expiringItems.join(", ") || "none"}

Return a JSON object with a "suggestions" array of 5 meal ideas:
{ "suggestions": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"] }`;

    try {
        const raw = await callGroq(systemPrompt, userPrompt);
        const parsed = extractJSON(raw);
        // Support both { suggestions: [...] } and plain array
        return Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    } catch (error) {
        console.error("Groq API error (suggestions):", error);
        throw new Error("Failed to generate suggestions");
    }
};

// ----------------------
// Cooking Tips
// ----------------------
export const generateCookingTips = async (recipe) => {

    const systemPrompt = `You are a professional chef. Return ONLY valid JSON.`;

    const userPrompt = `Give 3 practical cooking tips for this recipe:
Recipe: ${recipe.name}
Ingredients: ${recipe.ingredients?.map(i => i.name).join(", ") || "N/A"}

Return a JSON object:
{ "tips": ["Tip 1", "Tip 2", "Tip 3"] }`;

    try {
        const raw = await callGroq(systemPrompt, userPrompt);
        const parsed = extractJSON(raw);
        return Array.isArray(parsed) ? parsed : (parsed.tips || []);
    } catch (error) {
        console.error("Groq API error (tips):", error);
        return [
            "Taste as you cook and adjust seasoning",
            "Prep all ingredients before you start cooking",
            "Keep the heat consistent throughout"
        ];
    }
};
