import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export interface GeneratedSummary {
  smartTitle: string;
  meetingOverview: string;
  keyDiscussionPoints: string[];
  importantDecisions: string[];
  actionItems: { task: string; assignee?: string; deadline?: string; priority: 'low' | 'medium' | 'high' }[];
  nextSteps: string[];
  risks: string[];
  highlights: string[];
  keywords: string[];
  tags: string[];
  summaryText: string;
}

const SUMMARY_PROMPT = `You are an expert meeting analyst. Given the raw meeting transcript below, analyze it carefully and produce a structured JSON summary.

Respond with ONLY valid JSON (no markdown fences, no preamble, no commentary) matching exactly this shape:

{
  "smartTitle": "A short, descriptive title for this meeting (max 10 words)",
  "meetingOverview": "A 2-4 sentence high-level overview of what this meeting was about",
  "keyDiscussionPoints": ["point 1", "point 2", "..."],
  "importantDecisions": ["decision 1", "decision 2", "..."],
  "actionItems": [
    { "task": "description of the task", "assignee": "name or empty string if unknown", "deadline": "date string or empty string if unknown", "priority": "low|medium|high" }
  ],
  "nextSteps": ["next step 1", "next step 2", "..."],
  "risks": ["risk or concern 1", "..."],
  "highlights": ["notable highlight or quote-worthy moment 1", "..."],
  "keywords": ["keyword1", "keyword2", "..."],
  "tags": ["tag1", "tag2", "..."],
  "summaryText": "A complete professional meeting-minutes-style summary in well-formatted markdown, suitable to stand alone as the meeting's official record."
}

Rules:
- If a section has no relevant content, return an empty array for it, never omit the key.
- Keep arrays concise: 3-8 items per array, prioritizing the most important content.
- "summaryText" should be thorough markdown (headings, bullet points) capturing the meeting professionally.
- Output raw JSON only. Do not wrap it in triple backticks.

TRANSCRIPT:
"""
{{TRANSCRIPT}}
"""`;

/**
 * Sends a transcript to Gemini and parses the structured JSON summary it returns.
 * Includes defensive parsing since LLM output can occasionally include
 * stray markdown fences despite instructions.
 */
export const generateMeetingSummary = async (transcriptText: string): Promise<GeneratedSummary> => {
  if (!transcriptText || transcriptText.trim().length < 20) {
    throw ApiError.badRequest('Transcript is too short to generate a meaningful summary');
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

    const prompt = SUMMARY_PROMPT.replace('{{TRANSCRIPT}}', transcriptText.slice(0, 100000));

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const cleaned = rawText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: GeneratedSummary;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw ApiError.internal('AI returned an unparseable summary. Please try regenerating.');
    }

    // Defensive defaults in case the model omits a field
    return {
      smartTitle: parsed.smartTitle || 'Untitled Meeting',
      meetingOverview: parsed.meetingOverview || '',
      keyDiscussionPoints: parsed.keyDiscussionPoints || [],
      importantDecisions: parsed.importantDecisions || [],
      actionItems: parsed.actionItems || [],
      nextSteps: parsed.nextSteps || [],
      risks: parsed.risks || [],
      highlights: parsed.highlights || [],
      keywords: parsed.keywords || [],
      tags: parsed.tags || [],
      summaryText: parsed.summaryText || '',
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(`AI summary generation failed: ${error.message || 'Unknown error'}`);
  }
};
