const express = require("express");
const auth = require("../middleware/auth");
const aiRateLimit = require("../middleware/aiRateLimit");
const Vault = require("../models/Vault");
const AiUsageLog = require("../models/AiUsageLog");
const {
  fetchArticleFromUrl,
  fetchStructuredPageData,
} = require("../services/articleExtractor");
const { generateNotesFromArticle } = require("../services/groqClient");

const router = express.Router();

const MAX_INPUT_TEXT = 25000;
const ACTIVE_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const ALLOWED_NOTE_STYLES = new Set(["concise", "detailed", "exam-ready"]);

router.use(auth);
router.use(aiRateLimit);

const logUsage = async ({
  userId,
  endpoint,
  success,
  statusCode,
  durationMs,
  sourceUrl,
  requestType,
  errorMessage,
  model,
}) => {
  try {
    await AiUsageLog.create({
      userId,
      endpoint,
      success,
      statusCode,
      durationMs,
      sourceUrl: sourceUrl || "",
      requestType: requestType || "",
      errorMessage: errorMessage || "",
      model: model || "",
    });
  } catch (error) {
    console.error("Failed to save AI usage log:", error.message);
  }
};

const formatNoteContent = (notes, article) => {
  const pointList = notes.keyPoints.map((point) => `- ${point}`).join("\n");
  const actionList = notes.actionItems.map((item) => `- [ ] ${item}`).join("\n");

  return [
    `Source: ${article.sourceUrl}`,
    "",
    "## Summary",
    notes.summary || "No summary generated.",
    "",
    "## Note Style",
    notes.noteStyle || "detailed",
    "",
    "## Key Points",
    pointList || "- No key points generated.",
    "",
    "## Action Items",
    actionList || "- [ ] No action items generated.",
    "",
    `Confidence: ${notes.confidence}`,
  ].join("\n");
};

const validateUrlInput = (url) => {
  if (!url || typeof url !== "string") {
    return "url is required";
  }

  if (url.length > 2048) {
    return "url is too long";
  }

  return null;
};

router.post("/extract", async (req, res) => {
  const startedAt = Date.now();
  const userId = req.user.userId;
  const endpoint = "/extract";
  let statusCode = 200;
  let sourceUrl = "";

  try {
    const { url } = req.body;
    const urlError = validateUrlInput(url);
    if (urlError) {
      statusCode = 400;
      return res.status(statusCode).json({ error: urlError });
    }

    sourceUrl = url;

    const article = await fetchArticleFromUrl(url);
    return res.status(statusCode).json(article);
  } catch (error) {
    console.error("AI extract error:", error.message);
    statusCode = 400;
    return res.status(statusCode).json({ error: error.message || "Failed to extract article" });
  } finally {
    await logUsage({
      userId,
      endpoint,
      success: statusCode < 400,
      statusCode,
      durationMs: Date.now() - startedAt,
      sourceUrl,
      requestType: "extract",
      model: "",
    });
  }
});

router.post("/notes/from-article", async (req, res) => {
  const startedAt = Date.now();
  const userId = req.user.userId;
  const endpoint = "/notes/from-article";
  let statusCode = 200;
  let sourceUrl = "";
  let requestType = "unknown";

  try {
    const {
      url,
      articleText,
      articleTitle,
      saveToVault,
      vaultId,
      noteStyle,
      createTodos,
    } = req.body;

    const normalizedNoteStyle = ALLOWED_NOTE_STYLES.has(String(noteStyle || "").toLowerCase())
      ? String(noteStyle).toLowerCase()
      : "detailed";

    let article;
    if (url) {
      requestType = "url";
      const urlError = validateUrlInput(url);
      if (urlError) {
        statusCode = 400;
        return res.status(statusCode).json({ error: urlError });
      }
      sourceUrl = url;
      article = await fetchArticleFromUrl(url);
    } else if (articleText) {
      requestType = "direct-text";
      const normalizedText = String(articleText).trim().slice(0, MAX_INPUT_TEXT);
      if (normalizedText.length < 120) {
        statusCode = 400;
        return res.status(statusCode).json({ error: "articleText is too short" });
      }

      article = {
        sourceUrl: "direct-input",
        title: String(articleTitle || "Untitled Article").trim(),
        description: "",
        content: normalizedText,
        contentLength: normalizedText.length,
      };
    } else {
      statusCode = 400;
      return res.status(statusCode).json({ error: "Either url or articleText is required" });
    }

    sourceUrl = article.sourceUrl;

    const notes = await generateNotesFromArticle({
      articleTitle: article.title,
      articleUrl: article.sourceUrl,
      articleText: article.content,
      noteStyle: normalizedNoteStyle,
    });

    const payload = {
      article,
      notes,
      savedNote: null,
      createdTodos: [],
    };

    if (saveToVault === true) {
      if (!vaultId) {
        statusCode = 400;
        return res.status(statusCode).json({ error: "vaultId is required when saveToVault=true" });
      }

      const vault = await Vault.findOne({ _id: vaultId, userId });
      if (!vault) {
        statusCode = 404;
        return res.status(statusCode).json({ error: "Vault not found" });
      }

      vault.notes.push({
        title: notes.title || `${article.title} - Notes`,
        content: formatNoteContent(notes, article),
        images: [],
      });

      if (createTodos === true) {
        const createdTodoIds = [];
        const currentMaxOrder = (vault.todos || []).length
          ? Math.max(...vault.todos.map((todo) => (Number.isFinite(todo.order) ? todo.order : 0)))
          : -1;

        const tasksToCreate = notes.actionItems
          .map((task) => String(task || "").trim())
          .filter(Boolean)
          .slice(0, 12);

        tasksToCreate.forEach((task, index) => {
          vault.todos.push({
            title: task.slice(0, 200),
            description: `Generated from AI notes: ${article.title}`,
            priority: "medium",
            completed: false,
            repeat: "none",
            important: false,
            order: currentMaxOrder + index + 1,
          });

          const insertedTodo = vault.todos[vault.todos.length - 1];
          if (insertedTodo?._id) {
            createdTodoIds.push(String(insertedTodo._id));
          }
        });

        payload.createdTodos = createdTodoIds;
      }

      await vault.save();
      payload.savedNote = vault.notes[vault.notes.length - 1];
    }

    return res.status(statusCode).json(payload);
  } catch (error) {
    console.error("AI notes generation error:", error.message);
    statusCode = 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Failed to generate notes from article" });
  } finally {
    await logUsage({
      userId,
      endpoint,
      success: statusCode < 400,
      statusCode,
      durationMs: Date.now() - startedAt,
      sourceUrl,
      requestType,
      model: ACTIVE_GROQ_MODEL,
    });
  }
});

router.post("/scrape/structured", async (req, res) => {
  const startedAt = Date.now();
  const userId = req.user.userId;
  const endpoint = "/scrape/structured";
  let statusCode = 200;
  let sourceUrl = "";

  try {
    const { url } = req.body;
    const urlError = validateUrlInput(url);
    if (urlError) {
      statusCode = 400;
      return res.status(statusCode).json({ error: urlError });
    }

    sourceUrl = url;
    const structured = await fetchStructuredPageData(url);
    return res.status(statusCode).json(structured);
  } catch (error) {
    console.error("Structured scrape error:", error.message);
    statusCode = 400;
    return res.status(statusCode).json({ error: error.message || "Failed to scrape page" });
  } finally {
    await logUsage({
      userId,
      endpoint,
      success: statusCode < 400,
      statusCode,
      durationMs: Date.now() - startedAt,
      sourceUrl,
      requestType: "structured-scrape",
      model: "",
    });
  }
});

module.exports = router;
