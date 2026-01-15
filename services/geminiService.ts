
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, ExamResult, Subject } from "../types";

// Correctly initialize GoogleGenAI with named parameter and direct process.env.API_KEY usage
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJson = (text: string) => {
  // Remove markdown code blocks if present
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const getStudyInsights = async (state: AppState): Promise<string[]> => {
  // Basic fallback insights
  const fallbacks = [
    "Stay consistent with your Pomodoro sessions!",
    "Remember to revise chapters within 7 days of completion.",
    "Focus on subjects where your marks are currently lower."
  ];

  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    console.warn("Gemini API Key is missing. Using fallback insights.");
    return fallbacks;
  }

  try {
    const prompt = `
      Analyze this student's data and provide brief, actionable study insights. 
      Data: 
      - Subjects: ${JSON.stringify(state.subjects.map(s => ({ name: s.name, progress: s.chapters.filter(c => c.isCompleted).length / (s.chapters.length || 1) })))}
      - Recent Pomodoro sessions: ${JSON.stringify(state.pomodoroLogs.slice(-10))}
      - Recent Results: ${JSON.stringify(state.results.slice(-5))}
      
      Output exactly 3 bullet points of advice in JSON format like: {"insights": ["...", "...", "..."]}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["insights"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const json = JSON.parse(cleanJson(text)) as { insights: string[] };
    return json.insights?.length ? json.insights : fallbacks;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return fallbacks;
  }
};

export const getResultPerformanceAnalysis = async (results: ExamResult[], subjects: Subject[]): Promise<string[]> => {
  const fallbacks = [
    "Review subjects where your score is below 60%.",
    "Look for patterns in the types of exams where you struggle.",
    "Consistency is key to academic success!"
  ];

  if (results.length === 0) return ["Start logging your exam results to get personalized performance analysis."];
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const resultsSummary = results.map(r => ({
      subject: subjects.find(s => s.id === r.subjectId)?.name || 'Unknown',
      type: r.type,
      score: `${r.obtainedMarks}/${r.totalMarks}`,
      percentage: (r.obtainedMarks / r.totalMarks) * 100,
      date: r.date
    }));

    const prompt = `
      As an expert academic advisor, analyze these exam results: ${JSON.stringify(resultsSummary)}.
      Identify performance trends. Provide 3 specific tips.
      Output exactly 3 observations/tips in JSON format: {"analysis": ["...", "...", "..."]}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["analysis"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const json = JSON.parse(cleanJson(text)) as { analysis: string[] };
    return json.analysis?.length ? json.analysis : fallbacks;
  } catch (error) {
    console.error("Gemini Result Analysis Error:", error);
    return fallbacks;
  }
};

export const generateSubjectChapters = async (subjectName: string): Promise<string[]> => {
  const fallbacks = ["Introduction", "Core Concepts", "Advanced Application", "Review"];
  
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const prompt = `Provide a list of 5-8 common core chapters/topics for the subject: ${subjectName}. Keep it brief.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["chapters"]
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Empty response");

    const json = JSON.parse(cleanJson(text)) as { chapters: string[] };
    return json.chapters?.length ? json.chapters : fallbacks;
  } catch (error) {
    console.error("Gemini Chapter Gen Error:", error);
    return fallbacks;
  }
};
