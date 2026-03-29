import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.post("/api/parse", async (req, res) => {
  const { rawInput, subject } = req.body;
  if (!rawInput) return res.status(400).json({ error: "No input provided" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following text into a structured JSON array of questions for a ${subject} practice set. 
      Each question should have: "id" (number), "text" (string), "correctAnswer" (string), and optionally "options" (array of strings if it's multiple choice).
      
      Text to parse:
      ${rawInput}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              text: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "text", "correctAnswer"]
          }
        }
      }
    });

    const parsedQuestions = JSON.parse(response.text || "[]");
    res.json(parsedQuestions);
  } catch (error) {
    console.error("Parsing error:", error);
    res.status(500).json({ error: "Failed to parse questions" });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { questions, results, subject, targetQuestions, score, total, accuracy, averageSpeed } = req.body;

  try {
    const prompt = `Analyze this student's performance in a ${subject} practice set.
    Questions and Answers:
    ${questions.map((q: any, i: number) => {
      const res = results.find((r: any) => r.questionId === q.id);
      return `Q${i+1}: ${q.text}\nCorrect: ${q.correctAnswer}\nUser: ${res?.userAnswer || 'No Answer'}\nCorrect: ${res?.isCorrect}\nTime: ${res?.timeTaken}s`;
    }).join('\n\n')}

    Total Score: ${score}/${total}
    Accuracy: ${accuracy.toFixed(2)}%
    Average Speed: ${averageSpeed.toFixed(2)}s per question
    Target was: ${targetQuestions} questions.

    Provide:
    1. A detailed analysis note (motivational but rigorous).
    2. ${subject === 'English' ? 'A specific analysis of possible mistakes for each incorrect English question.' : 'A general analysis of shortcomings and how to improve.'}
    
    Format the response as a JSON object with keys: "detailedNote" (string) and "mistakesAnalysis" (string, markdown supported).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detailedNote: { type: Type.STRING },
            mistakesAnalysis: { type: Type.STRING }
          },
          required: ["detailedNote", "mistakesAnalysis"]
        }
      }
    });

    const aiAnalysis = JSON.parse(response.text || "{}");
    res.json(aiAnalysis);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze performance" });
  }
});

export default app;
