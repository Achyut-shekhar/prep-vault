const express = require("express");
const axios = require("axios");
const yts = require("yt-search");
const DDG = require("duck-duck-scrape");

const router = express.Router();

const REQUEST_TIMEOUT_MS = 5000;

const normalizeQuery = (req) => {
  const rawQuery =
    req.query.q ||
    req.query.query ||
    req.body?.q ||
    req.body?.query ||
    "";

  return String(rawQuery).trim();
};

const normalizeType = (req) => {
  const rawType = req.query.type || req.body?.type || "all";
  return String(rawType).trim().toLowerCase();
};

const dedupeResults = (items) => {
  const seen = new Set();

  return items.filter((item, index) => {
    const title = String(item.title || "").trim().toLowerCase();
    const url = String(item.url || "").trim().toLowerCase();
    const key = url || `${title}-${item.source || "unknown"}-${index}`;

    if (!url && !title) {
      return false;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const filterResultsByType = (items, type) => {
  if (!type || type === "all") {
    return items;
  }

  const typeMap = {
    articles: ["blog"],
    blogs: ["blog"],
    videos: ["video"],
    github: ["github"],
  };

  const allowedTypes = typeMap[type] || [type];
  return items.filter((item) => allowedTypes.includes(item.type));
};

const fetchYouTubeResults = async (query) => {
  const ytResults = await yts(query);

  return (ytResults.videos || []).slice(0, 4).map((video) => ({
    id: `yt-${video.videoId}`,
    title: video.title,
    description: `Channel: ${video.author?.name || "Unknown"} | Views: ${video.views || 0}`,
    url: video.url,
    source: "YouTube",
    type: "video",
  }));
};

const fetchGitHubResults = async (query) => {
  const githubRes = await axios.get("https://api.github.com/search/repositories", {
    params: { q: query, per_page: 4 },
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "PrepVault/1.0",
    },
  });

  return (githubRes.data.items || []).map((item) => ({
    id: `gh-${item.id}`,
    title: item.full_name,
    description: item.description || "No description",
    url: item.html_url,
    source: "GitHub",
    type: "github",
  }));
};

const fetchStackOverflowResults = async (query) => {
  const soRes = await axios.get("https://api.stackexchange.com/2.3/search", {
    params: {
      order: "desc",
      sort: "relevance",
      intitle: query,
      site: "stackoverflow",
      pagesize: 4,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return (soRes.data.items || []).map((item) => ({
    id: `so-${item.question_id}`,
    title: item.title,
    description: `Score: ${item.score} | Answers: ${item.answer_count}`,
    url: item.link,
    source: "StackOverflow",
    type: "blog",
  }));
};

const fetchDevToResults = async (query) => {
  const tag = query.split(/\s+/)[0] || "programming";
  const devToRes = await axios.get("https://dev.to/api/articles", {
    params: {
      tag,
      per_page: 4,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return (devToRes.data || []).map((item) => ({
    id: `dev-${item.id}`,
    title: item.title,
    description: item.description || "Developer article",
    url: item.url,
    source: "Dev.to",
    type: "blog",
  }));
};

const fetchRedditResults = async (query) => {
  const redditRes = await axios.get("https://www.reddit.com/search.json", {
    params: { q: query, limit: 4, sort: "relevance" },
    headers: { "User-Agent": "PrepVault/1.0" },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const children = redditRes.data?.data?.children || [];

  return children
    .map((child) => child.data)
    .filter((item) => item && !item.over_18)
    .map((item) => ({
      id: `rd-${item.id}`,
      title: item.title,
      description: `r/${item.subreddit} | Upvotes: ${item.ups}`,
      url: `https://www.reddit.com${item.permalink}`,
      source: "Reddit",
      type: "blog",
    }));
};

const fetchDuckDuckGoResults = async (query) => {
  const ddgRes = await DDG.search(query, {
    safeSearch: DDG.SafeSearchType.MODERATE,
  });

  return (ddgRes.results || []).slice(0, 6).map((item, index) => ({
    id: `ddg-${index}-${Buffer.from(item.url || item.title || `${index}`)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 16)}`,
    title: item.title,
    description: item.description || item.snippet || item.hostname || "Web result",
    url: item.url,
    source: "DuckDuckGo",
    type: item.url?.includes("github.com") ? "github" : "blog",
  }));
};

const collectSource = async (label, fetcher) => {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`${label} search error:`, error.message);
    return [];
  }
};

const handleSearch = async (req, res) => {
  const query = normalizeQuery(req);
  const type = normalizeType(req);

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  try {
    console.log(`Aggregating results for: ${query} (type: ${type})`);

    const sourceResults = await Promise.all([
      collectSource("YouTube", () => fetchYouTubeResults(query)),
      collectSource("GitHub", () => fetchGitHubResults(query)),
      collectSource("StackOverflow", () => fetchStackOverflowResults(query)),
      collectSource("Dev.to", () => fetchDevToResults(query)),
      collectSource("Reddit", () => fetchRedditResults(query)),
    ]);

    let results = dedupeResults(sourceResults.flat());

    if (results.length === 0) {
      results = dedupeResults(
        await collectSource("DuckDuckGo", () => fetchDuckDuckGoResults(query)),
      );
    }

    const filteredResults = filterResultsByType(results, type);

    return res.json({
      query,
      type,
      total: filteredResults.length,
      results: filteredResults,
    });
  } catch (error) {
    console.error("Aggregator error:", error.message);
    return res.status(500).json({ error: "Failed to fetch search results" });
  }
};

router.get("/", handleSearch);
router.post("/", handleSearch);

module.exports = router;
