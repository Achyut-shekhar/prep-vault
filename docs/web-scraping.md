# Web Scraping & Multi-Source Aggregation Implementation

## Overview
PrepVault's search feature is designed to provide high-quality developer resources by aggregating data from multiple authoritative platforms (GitHub, StackOverflow, Reddit). Rather than traditional HTML scraping which can be fragile and slow, we utilize public APIs to fetch structured data in real-time.

## Architecture

### Backend (`/backend/routes/search.js`)
The core logic resides in a single Express route handler that:
1.  Receives a search query (e.g., "Amazon SDE") from the frontend.
2.  Parallelizes requests to multiple external APIs.
3.  Normalizes the disparate data formats into a unified `Resource` structure.
4.  Returns the aggregated list to the frontend.

### Data Sources
We aggregate data from the following sources using `axios`:

1.  **GitHub API** (`https://api.github.com/search/repositories`)
    *   **Purpose**: To find curated repositories, cheat sheets, and project examples.
    *   **Parameters**: Key search terms matching repository names and descriptions.
    *   **Output**: Repository title, description, and link.

2.  **YouTube** (`yt-search`)
    *   **Purpose**: To find video tutorials and course playlists.
    *   **Mechanism**: Uses `yt-search` library to scrape YouTube search results without an API key.
    *   **Output**: Video title, channel name, views, and link.

3.  **StackOverflow API** (`https://api.stackexchange.com/2.2/search`)
    *   **Purpose**: To find high-quality Q&A discussions and solved problems.
    *   **Parameters**: Sorts by relevance and votes to ensure quality.
    *   **Output**: Question title, score, answer count, and link.

4.  **Dev.to API** (`https://dev.to/api/articles`)
    *   **Purpose**: To find developer-written articles and tutorials.
    *   **Parameters**: Searches by tag (using the first keyword of the query) to find relevant posts.
    *   **Output**: Article title, description, and link.

5.  **Reddit API** (`https://www.reddit.com/search.json`)
    *   **Purpose**: To find community discussions, interview experiences, and career advice.
    *   **Parameters**: Searches globally across subreddits like `r/cscareerquestions`, `r/leetcode`.
    *   **Output**: Post title, subreddit name, upvotes, and link.

## Implementation Details

### API Aggregation Pattern
The backend uses `Promise.all` (implicit in the implementation structure or sequential for simplicity currently) to fetch data. Error handling is granular—if one source (e.g., Reddit) fails or times out, the search request **does not fail**. It logs the error and returns results from the successful sources (e.g., GitHub and StackOverflow).

```javascript
// Example logic structure
try {
    // 1. Fetch GitHub
} catch (e) {
    console.error('GitHub failed'); // Continues execution
}

try {
    // 2. Fetch StackOverflow
} catch (e) {
    console.error('StackOverflow failed'); // Continues execution
}
```

### Response Format
The frontend receives a unified JSON array:
```json
[
  {
    "id": "gh-12345",
    "title": "amazon-sde-sheet",
    "description": "Curated list of questions",
    "url": "https://github.com/...",
    "source": "GitHub",
    "type": "github"
  },
  {
    "id": "so-67890",
    "title": "How to design a URL shortener?",
    "description": "Score: 154 | Answers: 5",
    "url": "https://stackoverflow.com/...",
    "source": "StackOverflow",
    "type": "blog"
  }
]
```

## Why This Approach?
1.  **Reliability**: Public APIs are clearer contracts than HTML DOM structures, which change frequently and break scrapers.
2.  **Performance**: We avoid the overhead of heavy headless browsers (Puppeteer/Selenium).
3.  **Scalability**: We can easily add more sources (e.g., Dev.to, YouTube API) by adding another block to the aggregator.
4.  **No Cost**: These endpoints are free for the volume of a personal project/MVP.

## Future Improvements
*   **Caching**: Implement Redis to cache search results for 24 hours to reduce API calls.
*   **Rate Limiting**: Add a rate limiter to prevent abuse of the backend search route.
*   **YouTube Integration**: Add `googleapis` back for YouTube video results (requires API key).

### Web-to-LLM Context Engine (Firecrawl/Jina)
Instead of standard scraping (messy HTML) or APIs (limited metadata), we can use Context Engines to crawl URLs and return clean Markdown.

*   **How it works**: Send a URL to an API like **Firecrawl** or **Jina AI Reader**. It handles proxies, JS rendering, and "de-cluttering" (removing ads/navbars).
*   **Why for PrepVault**: Fetch full GeeksforGeeks articles, convert to Markdown, and use an LLM (like Gemini) to automatically generate 3-bullet summaries for users.
