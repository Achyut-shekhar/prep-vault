const express = require('express');
const axios = require('axios');
const yts = require('yt-search');
const router = express.Router();

router.post('/', async (req, res) => {
    const q = req.query.q || req.body.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    try {
        console.log(`Aggregating results for: ${q}`);
        
        const results = [];
        
        // 1. YouTube Search (High Priority)
        try {
            const ytResults = await yts(q);
            const videos = ytResults.videos.slice(0, 3);
            videos.forEach(video => {
                results.push({
                    id: `yt-${video.videoId}`,
                    title: video.title,
                    description: `Channel: ${video.author.name} | Views: ${video.views}`,
                    url: video.url,
                    source: 'YouTube',
                    type: 'video'
                });
            });
        } catch (e) {
            console.error('YouTube search error:', e.message);
        }

        // 2. GitHub Search
        try {
            const githubRes = await axios.get(`https://api.github.com/search/repositories`, {
                params: { q: q, per_page: 3 },
                timeout: 3000
            });
            
            githubRes.data.items.forEach(item => {
                results.push({
                    id: `gh-${item.id}`,
                    title: item.full_name,
                    description: item.description || 'No description',
                    url: item.html_url,
                    source: 'GitHub',
                    type: 'github'
                });
            });
        } catch (e) {
            console.error('GitHub API error:', e.message);
        }

        // 3. StackOverflow Search
        try {
            const soRes = await axios.get(`https://api.stackexchange.com/2.2/search`, {
                params: {
                    order: 'desc',
                    sort: 'relevance',
                    intitle: q,
                    site: 'stackoverflow',
                    pagesize: 3
                },
                timeout: 3000
            });
            
            soRes.data.items.forEach(item => {
                results.push({
                    id: `so-${item.question_id}`,
                    title: item.title,
                    description: `Score: ${item.score} | Answers: ${item.answer_count}`,
                    url: item.link,
                    source: 'StackOverflow',
                    type: 'blog'
                });
            });
        } catch (e) {
            console.error('StackOverflow API error:', e.message);
        }

        // 4. Dev.to Search (Articles)
        try {
            // Searching by tag is more reliable on Dev.to API than free text search 
            // We use the first word of query as tag, or fallback to 'javascript'
            const tag = q.split(' ')[0] || 'programming';
            const devToRes = await axios.get(`https://dev.to/api/articles`, {
                params: {
                    tag: tag,
                    per_page: 3
                },
                timeout: 3000
            });
            
            devToRes.data.forEach(item => {
                 results.push({
                    id: `dev-${item.id}`,
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    source: 'Dev.to',
                    type: 'blog'
                });
            });
        } catch (e) {
             console.error('Dev.to API error:', e.message);
        }

        // 5. Reddit Search
        try {
            const redditRes = await axios.get(`https://www.reddit.com/search.json`, {
                params: { q: q, limit: 3, sort: 'relevance' },
                headers: { 'User-Agent': 'PrepVault/1.0' },
                timeout: 3000
            });
            
            const children = redditRes.data.data.children || [];
            children.forEach(child => {
                const item = child.data;
                if (!item.over_18) {
                    results.push({
                        id: `rd-${item.id}`,
                        title: item.title,
                        description: `r/${item.subreddit} | Upvotes: ${item.ups}`,
                        url: `https://www.reddit.com${item.permalink}`,
                        source: 'Reddit',
                        type: 'blog'
                    });
                }
            });
        } catch (e) {
            console.error('Reddit API error:', e.message);
        }

        res.json(results);

    } catch (error) {
        console.error('Aggregator error:', error.message);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

module.exports = router;
