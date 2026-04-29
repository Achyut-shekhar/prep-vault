const axios = require("axios");

const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL =
  process.env.GROQ_MODEL ||
  process.env.GROQ_FALLBACK_MODEL ||
  "llama-3.1-8b-instant";
const PROMPT_MAX_CHARS = Number(process.env.GROQ_PROMPT_MAX_CHARS || 8000);
const MAX_TOKENS_CAP = Number(process.env.GROQ_MAX_TOKENS_CAP || 1500);

const NOTE_STYLE_CONFIG = {
  concise: {
    summaryWords: "60-100",
    keyPoints: "3-5",
    actionItems: "2-4",
    tone: "compact and direct",
    minSummaryWords: 50,
    minKeyPoints: 3,
    minActionItems: 2,
    maxTokens: 600,
  },
  detailed: {
    summaryWords: "140-240",
    keyPoints: "6-10",
    actionItems: "4-8",
    tone: "thorough and explanatory",
    minSummaryWords: 140,
    minKeyPoints: 6,
    minActionItems: 4,
    maxTokens: 1200,
  },
  "exam-ready": {
    summaryWords: "140-220",
    keyPoints: "6-10",
    actionItems: "4-8",
    tone: "structured for revision with definitions and memory cues",
    minSummaryWords: 140,
    minKeyPoints: 6,
    minActionItems: 4,
    maxTokens: 1000,
  },
};

const getGroqApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing GROQ_API_KEY in environment");
  }
  return key;
};

const buildGroqError = (error) => {
  const groqError = new Error(
    error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to generate notes from article",
  );

  groqError.statusCode = error.response?.status || error.statusCode || 500;
  groqError.retryAfterSeconds = error.response?.headers?.["retry-after"]
    ? Number(error.response.headers["retry-after"])
    : undefined;
  groqError.isGroqRateLimit = groqError.statusCode === 429;

  return groqError;
};

const normalizeNoteStyle = (value) => {
  const normalized = String(value || "detailed")
    .trim()
    .toLowerCase();
  return NOTE_STYLE_CONFIG[normalized] ? normalized : "detailed";
};

const buildNotesPrompt = ({
  articleTitle,
  articleUrl,
  articleText,
  noteStyle,
  isRetry,
}) => {
  const style = normalizeNoteStyle(noteStyle);
  const styleConfig = NOTE_STYLE_CONFIG[style];

  // Keep prompt compact to reduce token usage. Truncate article text to PROMPT_MAX_CHARS.
  const truncatedText = String(articleText || "").slice(0, PROMPT_MAX_CHARS);

  return [
    "You are an expert study assistant. Output STRICT JSON only.",
    `Schema: {"title": string, "summary": string, "keyPoints": string[], "actionItems": string[], "tags": string[], "confidence": number}`,
    `- writing mode: ${style}`,
    `- tone: ${styleConfig.tone}`,
    `- summary target: ${styleConfig.summaryWords} words`,
    "- tags: 2-6 lowercase tags",
    isRetry
      ? "- If previous output was insufficient, increase depth to meet minimum counts."
      : "",
    `Article title: ${articleTitle || "Unknown"}`,
    `Article URL: ${articleUrl || "Unknown"}`,
    "Article text:",
    truncatedText,
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
  const keyPointsCount = Array.isArray(notes.keyPoints)
    ? notes.keyPoints.length
    : 0;
  const actionItemsCount = Array.isArray(notes.actionItems)
    ? notes.actionItems.length
    : 0;

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

  try {
    const maxTokens = Math.min(
      styleConfig.maxTokens,
      MAX_TOKENS_CAP || styleConfig.maxTokens,
    );

    const response = await axios.post(
      `${GROQ_API_BASE_URL}/chat/completions`,
      {
        model: DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a precise assistant that follows the schema and returns valid JSON only.",
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
  } catch (error) {
    throw buildGroqError(error);
  }
};

const generateNotesFromArticle = async ({
  articleTitle,
  articleUrl,
  articleText,
  noteStyle,
}) => {
  const apiKey = getGroqApiKey();
  const normalizedStyle = normalizeNoteStyle(noteStyle);
  // Single request to reduce token usage and avoid double calls to Groq (helps with TPM quotas).
  const notes = await requestNotesFromGroq({
    apiKey,
    articleTitle,
    articleUrl,
    articleText,
    noteStyle: normalizedStyle,
    isRetry: false,
  });

  return {
    ...notes,
    noteStyle: normalizedStyle,
  };
};

module.exports = {
  generateNotesFromArticle,
};
