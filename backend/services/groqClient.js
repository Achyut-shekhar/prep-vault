const axios = require("axios");

const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const NOTE_STYLE_CONFIG = {
  concise: {
    summaryWords: "80-140",
    keyPoints: "4-6",
    actionItems: "3-5",
    tone: "compact and direct",
    minSummaryWords: 70,
    minKeyPoints: 4,
    minActionItems: 3,
    maxTokens: 900,
  },
  detailed: {
    summaryWords: "220-420",
    keyPoints: "8-14",
    actionItems: "5-10",
    tone: "thorough and explanatory",
    minSummaryWords: 200,
    minKeyPoints: 8,
    minActionItems: 5,
    maxTokens: 2200,
  },
  "exam-ready": {
    summaryWords: "180-320",
    keyPoints: "8-12",
    actionItems: "6-10",
    tone: "structured for revision with definitions and memory cues",
    minSummaryWords: 170,
    minKeyPoints: 8,
    minActionItems: 6,
    maxTokens: 1900,
  },
};

const getGroqApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing GROQ_API_KEY in environment");
  }
  return key;
};

const normalizeNoteStyle = (value) => {
  const normalized = String(value || "detailed").trim().toLowerCase();
  return NOTE_STYLE_CONFIG[normalized] ? normalized : "detailed";
};

const buildNotesPrompt = ({ articleTitle, articleUrl, articleText, noteStyle, isRetry }) => {
  const style = normalizeNoteStyle(noteStyle);
  const styleConfig = NOTE_STYLE_CONFIG[style];

  return [
    "You are an expert study assistant.",
    "Read the article and output STRICT JSON only (no markdown).",
    "Schema:",
    "{",
    '  "title": string,',
    '  "summary": string,',
    '  "keyPoints": string[],',
    '  "actionItems": string[],',
    '  "tags": string[],',
    '  "confidence": number',
    "}",
    "Rules:",
    `- writing mode: ${style}`,
    `- tone: ${styleConfig.tone}`,
    `- summary: ${styleConfig.summaryWords} words`,
    `- keyPoints: ${styleConfig.keyPoints} concise bullets`,
    `- actionItems: ${styleConfig.actionItems} practical tasks`,
    "- tags: 3-8 lowercase tags",
    "- confidence: 0 to 1",
    "- For detailed or exam-ready style, include specifics, examples, and important caveats from the article.",
    "- Keep output factual and grounded in the provided article.",
    isRetry
      ? "- Previous output was too brief. You MUST increase depth and meet all minimum counts and word targets."
      : "",
    "",
    `Article title: ${articleTitle || "Unknown"}`,
    `Article URL: ${articleUrl || "Unknown"}`,
    "Article text:",
    articleText,
  ].join("\n");
};

const safeParseJson = (value) => {
  if (!value) {
    throw new Error("Model returned empty response");
  }

  const text = String(value).trim();
  const fromCodeBlock = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fromCodeBlock ? fromCodeBlock[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("Model did not return valid JSON");
  }
};

const normalizeNotesPayload = (payload, fallbackTitle) => {
  const keyPoints = Array.isArray(payload.keyPoints)
    ? payload.keyPoints.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const actionItems = Array.isArray(payload.actionItems)
    ? payload.actionItems.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const tags = Array.isArray(payload.tags)
    ? payload.tags
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const confidenceNumber = Number(payload.confidence);
  const confidence = Number.isFinite(confidenceNumber)
    ? Math.max(0, Math.min(1, confidenceNumber))
    : 0.6;

  return {
    title: String(payload.title || fallbackTitle || "AI Notes").trim(),
    summary: String(payload.summary || "").trim(),
    keyPoints,
    actionItems,
    tags,
    confidence,
  };
};

const countWords = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const isNotesDetailedEnough = (notes, noteStyle) => {
  const style = normalizeNoteStyle(noteStyle);
  const styleConfig = NOTE_STYLE_CONFIG[style];

  const summaryWordCount = countWords(notes.summary);
  const keyPointsCount = Array.isArray(notes.keyPoints) ? notes.keyPoints.length : 0;
  const actionItemsCount = Array.isArray(notes.actionItems) ? notes.actionItems.length : 0;

  return (
    summaryWordCount >= styleConfig.minSummaryWords &&
    keyPointsCount >= styleConfig.minKeyPoints &&
    actionItemsCount >= styleConfig.minActionItems
  );
};

const requestNotesFromGroq = async ({
  apiKey,
  articleTitle,
  articleUrl,
  articleText,
  noteStyle,
  isRetry = false,
}) => {
  const style = normalizeNoteStyle(noteStyle);
  const styleConfig = NOTE_STYLE_CONFIG[style];

  const response = await axios.post(
    `${GROQ_API_BASE_URL}/chat/completions`,
    {
      model: DEFAULT_MODEL,
      temperature: 0.2,
      max_tokens: styleConfig.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a precise assistant that always follows output schema and returns valid JSON only.",
        },
        {
          role: "user",
          content: buildNotesPrompt({
            articleTitle,
            articleUrl,
            articleText,
            noteStyle: style,
            isRetry,
          }),
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  const rawText = response.data?.choices?.[0]?.message?.content;
  const parsed = safeParseJson(rawText);
  return normalizeNotesPayload(parsed, articleTitle);
};

const generateNotesFromArticle = async ({ articleTitle, articleUrl, articleText, noteStyle }) => {
  const apiKey = getGroqApiKey();
  const normalizedStyle = normalizeNoteStyle(noteStyle);
  let notes = await requestNotesFromGroq({
    apiKey,
    articleTitle,
    articleUrl,
    articleText,
    noteStyle: normalizedStyle,
    isRetry: false,
  });

  if (!isNotesDetailedEnough(notes, normalizedStyle)) {
    notes = await requestNotesFromGroq({
      apiKey,
      articleTitle,
      articleUrl,
      articleText,
      noteStyle: normalizedStyle,
      isRetry: true,
    });
  }

  return {
    ...notes,
    noteStyle: normalizedStyle,
  };
};

module.exports = {
  generateNotesFromArticle,
};
