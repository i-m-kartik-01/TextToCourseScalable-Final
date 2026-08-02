const { getCourseOutlinePrompt } = require("../utils/prompts/course/index");
const { getLessonPrompt } = require("../utils/prompts/lesson/index");
const { getQuizPrompt } = require("../utils/prompts/quiz/index");

let client = null;

// Helper to bridge CommonJS and the modern @google/genai SDK
async function getClient() {
  if (client) return client;
  
  // This dynamic import is the ONLY way to load this package in your current setup
  const { GoogleGenAI } = await import("@google/genai");
  client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const MODEL_NAME = "gemini-flash-latest"; 
console.log("AI MODEL =", MODEL_NAME);
console.log("AI FILE =", __filename);
const cleanAndParseJSON = (aiResponse) => {
  try {
    // 1. If it's already an object (some SDK versions do this automatically)
    if (typeof aiResponse === 'object') return aiResponse;

    // 2. If it's a string, clean the backticks
    if (typeof aiResponse === 'string') {
      const jsonString = aiResponse.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonString);
    }
    
    throw new Error("Unexpected response type from AI");
  } catch (error) {
    console.error("AI Data Processing Error:", error);
    throw new Error("Could not parse AI response into valid course data");
  }
};

async function generateCourseOutline(topic) {
  console.log("========== GENERATE COURSE ==========");
  const aiClient = await getClient();
  const prompt = getCourseOutlinePrompt(topic);

  const result = await aiClient.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });

  // Senior Tip: The new SDK uses result.text or result.response.text() 
  // depending on the exact version. Let's handle both.
  const rawText = result.text || (result.response && result.response.text());
  return cleanAndParseJSON(rawText);
}

async function generateLessonContent({ courseTitle, moduleTitle, lessonTitle }) {
  // CRITICAL SAFETY CHECK
  if (!courseTitle || !moduleTitle || !lessonTitle) {
    throw new Error(`AI Input Error: One or more titles are missing. Received: Course=${courseTitle}, Module=${moduleTitle}, Lesson=${lessonTitle}`);
  }
  // console.log(`Generating lesson content for Course="${courseTitle}", Module="${moduleTitle}", Lesson="${lessonTitle}"`);
  const aiClient = await getClient();
  const prompt = getLessonPrompt({ courseTitle, moduleTitle, lessonTitle });

  const result = await aiClient.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { response_mime_type: "application/json" }
  });

  const parsedData = cleanAndParseJSON(result.text);

  // Take the core lesson blocks
  const contentBlocks = parsedData.content || [];

  // Take the quiz questions
  const quizQuestions = (parsedData.quiz || []).map(q => ({
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation
  }));

  // Return an object that matches our Schema's update requirements
  return {
    content: contentBlocks,
    quiz: quizQuestions
  };
}

async function generateQuizAI({ courseTitle, courseDesc }) {
  const aiClient = await getClient();
  const prompt = getQuizPrompt({ courseTitle, courseDesc });

  const result = await aiClient.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { response_mime_type: "application/json" }
  });

  // This returns a parsed OBJECT, not a string
  return cleanAndParseJSON(result.text); 
}

module.exports = {
  generateCourseOutline,
  generateLessonContent,
  generateQuizAI,
};