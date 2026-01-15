
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, ExamResult, Subject } from "../types";

// Correctly initialize GoogleGenAI with named parameter and direct process.env.API_KEY usage
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStudyInsights = async (state: AppState): Promise<string[]> => {
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

    const text = response.text || '{"insights": []}';
    const json = JSON.parse(text) as { insights: string[] };
    return json.insights;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return ["Stay consistent with your Pomodoro sessions!", "Remember to revise chapters within 7 days of completion.", "Focus on subjects where your marks are currently lower."];
  }
};

export const getResultPerformanceAnalysis = async (results: ExamResult[], subjects: Subject[]): Promise<string[]> => {
  try {
    if (results.length === 0) return ["Start logging your exam results to get personalized performance analysis."];

    const resultsSummary = results.map(r => ({
      subject: subjects.find(s => s.id === r.subjectId)?.name || 'Unknown',
      type: r.type,
      score: `${r.obtainedMarks}/${r.totalMarks}`,
      percentage: (r.obtainedMarks / r.totalMarks) * 100,
      date: r.date
    }));

    const prompt = `
      As an expert academic advisor, analyze these exam results: ${JSON.stringify(resultsSummary)}.
      Identify performance trends (improvement, consistency, or decline).
      Provide 3 specific, personalized tips to improve or maintain scores.
      Focus on subjects with the lowest percentages or declining trends.
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

    const text = response.text || '{"analysis": []}';
    const json = JSON.parse(text) as { analysis: string[] };
    return json.analysis;
  } catch (error) {
    console.error("Gemini Result Analysis Error:", error);
    return ["Review subjects where your score is below 60%.", "Look for patterns in the types of exams where you struggle (e.g., Quizzes vs Finals).", "Consistency is key to academic success!"];
  }
};

export const generateSubjectChapters = async (subjectName: string): Promise<string[]> => {
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
    const text = response.text || '{"chapters": []}';
    const json = JSON.parse(text) as { chapters: string[] };
    return json.chapters;
  } catch (error) {
    return ["Introduction", "Core Concepts", "Advanced Application", "Review"];
  }
};
