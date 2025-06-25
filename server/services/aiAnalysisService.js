const OpenAI = require("openai");
const https = require('https');
// Note: dotenv is loaded in app.js, no need to load it again here

// Configuration constants
const HOSTILITY_THRESHOLD = 0.0002;
const HOSTILE_CATEGORIES = [
    'hate',
    'hate/threatening',
    'harassment',
    'harassment/threatening',
    'violence',
    'violence/graphic'
];

// Initialize OpenAI client
let openai;

function initializeOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }
    
    if (!openai) {
        openai = new OpenAI({ 
            apiKey: process.env.OPENAI_API_KEY 
        });
    }
    
    return openai;
}

async function analyzeImage(imageUrl) {
    try {
        console.log(`Starting AI analysis for image: ${imageUrl}`);
        
        // Initialize OpenAI if not already done
        const client = initializeOpenAI();
        
        // 1. Get image analysis from GPT-4o Vision
        const imageAnalysis = await getImageAnalysis(imageUrl, client);
        
        if (!imageAnalysis) {
            throw new Error("Failed to get image analysis from GPT-4o");
        }
        
        // 2. Run moderation analysis on the description
        const moderationResults = await getModerationAnalysis(imageAnalysis, client);
        
        // 3. Determine if content is hostile
        const hostilityAssessment = assessHostility(moderationResults);
        
        // 4. Return simple result
        return {
            success: true,
            isHostile: hostilityAssessment.isHostile
        };
        
    } catch (error) {
        console.error("Error in AI analysis:", error);
        return {
            success: false,
            isHostile: false // Default to not hostile on error
        };
    }
}

async function getImageAnalysis(imageUrl, client) {
    const userPrompt = `Analyze this image in detail. Focus on:
    1. What people are doing in the image
    2. Any text visible in the image
    3. Emotions or expressions shown
    4. Any threatening, hostile, or inappropriate behavior
    5. Context and setting
    
    Provide a thorough, objective description.`;

    const visionResponse = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                        },
                    },
                ],
            },
        ],
        max_tokens: 500,
        temperature: 0.2,
    });

    if (!visionResponse?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response from GPT-4o Vision API");
    }

    return visionResponse.choices[0].message.content;
}

async function getModerationAnalysis(content, client) {
    const moderationResponse = await client.moderations.create({
        input: content,
    });

    if (!moderationResponse?.results?.[0]) {
        throw new Error("Invalid response from OpenAI Moderation API");
    }

    return moderationResponse.results[0];
}

function assessHostility(moderationResults) {
    const categoryScores = moderationResults.category_scores;
    
    // Check each hostile category against threshold
    let maxScore = 0;
    for (const category of HOSTILE_CATEGORIES) {
        const score = categoryScores[category] || 0;
        console.log(`Category: ${category}, Score: ${score}`);
        console.log(`Hostility Threshold: ${HOSTILITY_THRESHOLD}`);
        console.log(`Max Score: ${maxScore}`);
        maxScore = Math.max(maxScore, score);
        if (score > HOSTILITY_THRESHOLD) {
            console.log(`Hostile category detected: ${category}, Score: ${score}`);
            return { isHostile: true };
        }
    }

    return { isHostile: false };
}

async function downloadImageAsBase64(imageUrl) {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
            const chunks = [];
            
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                resolve(base64);
            });
            
            response.on('error', (error) => {
                reject(error);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = {
    analyzeImage,
    getImageAnalysis,
    getModerationAnalysis,
    assessHostility,
    downloadImageAsBase64,
    initializeOpenAI,
    HOSTILITY_THRESHOLD,
    HOSTILE_CATEGORIES
}; 