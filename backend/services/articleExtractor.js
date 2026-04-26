const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

const ARTICLE_TIMEOUT_MS = 12000;
const MAX_CONTENT_CHARS = 25000;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/i,
  /^fc00:/i,
  /^fe80:/i,
];

const normalizeWhitespace = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const isPrivateHost = (hostname) => {
  const normalized = String(hostname || "").trim().toLowerCase();
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
};

const assertSafePublicUrl = (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Local and private network URLs are not allowed");
  }

  return parsed.toString();
};

const pickCandidateText = ($) => {
  const articleText = normalizeWhitespace($("article").text());
  if (articleText.length > 300) {
    return articleText;
  }

  const paragraphText = normalizeWhitespace(
    $("main p, article p, .post p, .content p, p")
      .map((_, p) => $(p).text())
      .get()
      .join(" "),
  );

  if (paragraphText.length > 200) {
    return paragraphText;
  }

  return normalizeWhitespace($("body").text());
};

const toAbsoluteUrl = (href, baseUrl) => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
};

const fetchArticleFromUrl = async (rawUrl) => {
  const safeUrl = assertSafePublicUrl(rawUrl);

  const response = await axios.get(safeUrl, {
    timeout: ARTICLE_TIMEOUT_MS,
    maxRedirects: 5,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = String(response.data || "");
  const $ = cheerio.load(html);

  const title =
    normalizeWhitespace($("meta[property='og:title']").attr("content")) ||
    normalizeWhitespace($("title").text()) ||
    "Untitled Article";

  const description =
    normalizeWhitespace($("meta[name='description']").attr("content")) ||
    normalizeWhitespace($("meta[property='og:description']").attr("content")) ||
    "";

  const rawText = pickCandidateText($);
  const content = rawText.slice(0, MAX_CONTENT_CHARS);

  if (content.length < 120) {
    throw new Error("Could not extract enough readable article text");
  }

  return {
    sourceUrl: safeUrl,
    title,
    description,
    content,
    contentLength: content.length,
  };
};

const fetchStructuredPageData = async (rawUrl) => {
  const safeUrl = assertSafePublicUrl(rawUrl);

  const response = await axios.get(safeUrl, {
    timeout: ARTICLE_TIMEOUT_MS,
    maxRedirects: 5,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = String(response.data || "");
  const $ = cheerio.load(html);

  const title =
    normalizeWhitespace($("meta[property='og:title']").attr("content")) ||
    normalizeWhitespace($("title").text()) ||
    "Untitled Page";

  const description =
    normalizeWhitespace($("meta[name='description']").attr("content")) ||
    normalizeWhitespace($("meta[property='og:description']").attr("content")) ||
    "";

  const headings = $("h1, h2, h3")
    .map((_, node) => normalizeWhitespace($(node).text()))
    .get()
    .filter(Boolean)
    .slice(0, 30);

  const links = $("a[href]")
    .map((_, node) => {
      const href = $(node).attr("href");
      const absoluteUrl = toAbsoluteUrl(href, safeUrl);
      if (!absoluteUrl || !/^https?:\/\//i.test(absoluteUrl)) {
        return null;
      }

      return {
        text: normalizeWhitespace($(node).text()).slice(0, 180),
        url: absoluteUrl,
      };
    })
    .get()
    .filter(Boolean)
    .slice(0, 40);

  const rawText = pickCandidateText($);
  const content = rawText.slice(0, MAX_CONTENT_CHARS);

  return {
    sourceUrl: safeUrl,
    title,
    description,
    headings,
    links,
    textPreview: content.slice(0, 1200),
    contentLength: content.length,
  };
};

module.exports = {
  fetchArticleFromUrl,
  fetchStructuredPageData,
  assertSafePublicUrl,
};
