
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Exam, Subject, StudyTask, User } from "../types";

const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const getDailyStudyPlan = async (state: AppState): Promise<StudyTask[]> => {
  const fallbacks: StudyTask[] = [
    { id: 'f1', task: "Revise your most difficult subject", priority: "Critical", estimatedTime: "45m" },
    { id: 'f2', task: "Complete one Pomodoro session", priority: "Focus", estimatedTime: "25m" },
    { id: 'f3', task: "Review upcoming exam schedules", priority: "Routine", estimatedTime: "10m" }
  ];

  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Create a high-impact daily study plan based on this student's data:
      - Subjects: ${JSON.stringify(state.subjects.map(s => ({ name: s.name, progress: s.chapters.filter(c => c.isCompleted).length / (s.chapters.length || 1) })))}
      - Upcoming Exams: ${JSON.stringify(state.exams.filter(e => !e.isCompleted))}
      - Last Results: ${JSON.stringify(state.exams.filter(e => e.isGraded).slice(-3))}

      Provide 4 specific, actionable study tasks for today.
      Output in JSON format: {"tasks": [{"id": "...", "task": "...", "priority": "Critical/Focus/Routine", "estimatedTime": "..."}]}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  task: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING }
                },
                required: ["id", "task", "priority", "estimatedTime"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    const json = JSON.parse(cleanJson(text)) as { tasks: StudyTask[] };
    return json.tasks?.length ? json.tasks : fallbacks;
  } catch (error) {
    console.error("Gemini Study Plan Error:", error);
    return fallbacks;
  }
};

export const getStudyInsights = async (state: AppState): Promise<string[]> => {
  const fallbacks = [
    "Stay consistent with your Pomodoro sessions!",
    "Remember to revise chapters within 7 days of completion.",
    "Focus on subjects where your marks are currently lower."
  ];

  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze this student's data and provide brief, actionable study insights. 
      Data: 
      - Subjects: ${JSON.stringify(state.subjects.map(s => ({ name: s.name, progress: s.chapters.filter(c => c.isCompleted).length / (s.chapters.length || 1) })))}
      - Recent Pomodoro sessions: ${JSON.stringify(state.pomodoroLogs.slice(-10))}
      - Upcoming Exams: ${JSON.stringify(state.exams.filter(e => !e.isCompleted))}
      
      Output exactly 3 bullet points of advice in JSON format: {"insights": ["...", "...", "..."]}
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
    if (!text) throw new Error("Empty response");
    const json = JSON.parse(cleanJson(text)) as { insights: string[] };
    return json.insights?.length ? json.insights : fallbacks;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return fallbacks;
  }
};

export const getDynamicGreeting = async (user: User): Promise<string> => {
  const hour = new Date().getHours();
  let timeContext = "";
  if (hour >= 5 && hour < 12) timeContext = "morning";
  else if (hour >= 12 && hour < 17) timeContext = "afternoon";
  else if (hour >= 17 && hour < 22) timeContext = "evening";
  else timeContext = "late night";

  const fallbacks: Record<string, string> = {
    morning: `Morning, ${user.name.split(' ')[0]}. New peaks await.`,
    afternoon: `Focus peak reached, ${user.name.split(' ')[0]}.`,
    evening: `Wrapping up the conquest, ${user.name.split(' ')[0]}?`,
    "late night": `Late night grind, Zenith? Clarity in silence.`
  };

  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks[timeContext];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Generate a short, ultra-premium, cool greeting (max 8 words) for a study app called Zenith.
      The user is ${user.name}, studying ${user.education || 'Academics'}.
      Current time phase: ${timeContext}. 
      Examples: "Morning, Manager", "The night grind brings mastery, Zenith."
      Return only the text.
    `;
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.95
      }
    });
    return response.text?.trim() || fallbacks[timeContext];
  } catch (error) {
    return fallbacks[timeContext];
  }
};

export const getSyncReport = async (state: AppState): Promise<string> => {
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    return "Data successfully secured in Zenith Cloud via local encryption tunnel.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Create a very short (15 words max), encouraging, high-end "Cloud Sync" confirmation message for a study app.
      Context: The user just backed up ${state.subjects.length} subjects and ${state.goals.length} goals.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Zenith Cloud verified. Your academic progress is safely synced.";
  } catch (error) {
    return "Local state synchronized with cloud backup successfully.";
  }
};

export const getExamPerformanceAnalysis = async (exams: Exam[], subjects: Subject[]): Promise<string[]> => {
  const fallbacks = [
    "Review subjects where your score is below 60%.",
    "Look for patterns in the types of exams where you struggle.",
    "Consistency is key to academic success!"
  ];
  
  const gradedExams = exams.filter(e => e.isGraded);
  if (gradedExams.length === 0) return ["Start grading your completed missions to get personalized performance analysis."];
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const resultsSummary = gradedExams.map(r => ({
      subject: subjects.find(s => s.id === r.subjectId)?.name || 'Unknown',
      type: r.type,
      score: `${r.obtainedMarks}/${r.totalMarks}`,
      percentage: ((r.obtainedMarks || 0) / (r.totalMarks || 1)) * 100,
      date: r.date
    }));
    const prompt = `As an expert academic advisor, analyze graded exam records: ${JSON.stringify(resultsSummary)}. Provide 3 distinct strategic tips. Output JSON: {"analysis": ["...", "...", "..."]}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { analysis: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["analysis"]
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Empty response");
    const json = JSON.parse(cleanJson(text)) as { analysis: string[] };
    return json.analysis?.length ? json.analysis : fallbacks;
  } catch (error) {
    console.error("Gemini Performance Analysis Error:", error);
    return fallbacks;
  }
};

export const generateSubjectChapters = async (subjectName: string): Promise<string[]> => {
  const fallbacks = ["Introduction", "Core Concepts", "Advanced Application", "Review"];
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") return fallbacks;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide a list of 5-8 common core chapters for the subject: ${subjectName}. Keep it brief.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { chapters: { type: Type.ARRAY, items: { type: Type.STRING } } },
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
