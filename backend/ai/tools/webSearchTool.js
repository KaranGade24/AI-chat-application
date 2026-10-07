/**
 * Web Search Tool with multi-provider resilience (DuckDuckGo Lite, DDG Instant, Wikipedia, Tavily/Serper)
 * Built to reliably execute in cloud environments like Render without timing out or aborting.
 */

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * 1. Tavily Search (Optional - activated if TAVILY_API_KEY is configured)
 */
async function searchTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const signal = AbortSignal.timeout(8000);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 4 }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.results || [])
      .map((r, idx) => `[${idx + 1}] ${r.title}: ${r.content}`)
      .filter(Boolean);

    if (results.length === 0) return null;
    return `Web Search Results for "${query}":\n${results.join("\n\n")}`;
  } catch {
    return null;
  }
}

/**
 * 2. Serper / Google Search (Optional - activated if SERPER_API_KEY is configured)
 */
async function searchSerper(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    const signal = AbortSignal.timeout(8000);
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      signal,
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 4 }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.organic || [])
      .map((r, idx) => `[${idx + 1}] ${r.title}: ${r.snippet}`)
      .filter(Boolean);

    if (results.length === 0) return null;
    return `Web Search Results for "${query}":\n${results.join("\n\n")}`;
  } catch {
    return null;
  }
}

/**
 * 3. DuckDuckGo Lite HTML search (Free, zero API key required)
 */
async function searchDuckDuckGoLite(query) {
  try {
    const signal = AbortSignal.timeout(8000);
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: new URLSearchParams({ q: query }).toString(),
    });

    if (!res.ok) return null;
    const html = await res.text();

    const titles = [
      ...html.matchAll(/<a[^>]+class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi),
    ].map((m) => decodeHtmlEntities(m[1]));

    const snippets = [
      ...html.matchAll(/class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi),
    ].map((m) => decodeHtmlEntities(m[1]));

    if (snippets.length === 0) return null;

    const results = snippets.slice(0, 4).map((snippet, idx) => {
      const title = titles[idx] || `Result ${idx + 1}`;
      return `[${idx + 1}] ${title}: ${snippet}`;
    });

    return `Web Search Results for "${query}":\n${results.join("\n\n")}`;
  } catch {
    return null;
  }
}

/**
 * 4. DuckDuckGo Instant Answer API (Free JSON API)
 */
async function searchDuckDuckGoApi(query) {
  try {
    const signal = AbortSignal.timeout(6000);
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query,
    )}&format=json&no_html=1&skip_disambig=1`;

    const apiRes = await fetch(apiUrl, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!apiRes.ok) return null;
    const data = await apiRes.json();
    const results = [];

    if (data.AbstractText) {
      results.push(`Summary: ${data.AbstractText} (Source: ${data.AbstractSource || data.AbstractURL})`);
    }

    if (Array.isArray(data.RelatedTopics) && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 3).forEach((topic) => {
        if (topic.Text) {
          results.push(`• ${topic.Text}`);
        }
      });
    }

    if (results.length > 0) {
      return `Web Search Results for "${query}":\n${results.join("\n")}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 5. Wikipedia Open API search (Free, high-speed, never blocked by cloud hosts like Render)
 */
async function searchWikipedia(query) {
  try {
    const signal = AbortSignal.timeout(6000);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query,
    )}&utf8=&format=json&origin=*`;

    const res = await fetch(url, {
      signal,
      headers: { "User-Agent": "AIChatApplication/1.0 (websearch-fallback)" },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const items = data.query?.search || [];
    if (items.length === 0) return null;

    const results = items.slice(0, 4).map((item, idx) => {
      const snippet = decodeHtmlEntities(item.snippet);
      return `[${idx + 1}] ${item.title}: ${snippet}`;
    });

    return `Wikipedia Search Results for "${query}":\n${results.join("\n\n")}`;
  } catch {
    return null;
  }
}

/**
 * Main Web Search Dispatcher
 * @param {string} query - The search query
 */
export const searchWeb = async (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    return "No search query provided.";
  }

  const cleanedQuery = query.trim();

  const providers = [
    { name: "Tavily", fn: searchTavily },
    { name: "Serper", fn: searchSerper },
    { name: "DuckDuckGo Lite", fn: searchDuckDuckGoLite },
    { name: "DuckDuckGo Instant Answer", fn: searchDuckDuckGoApi },
    { name: "Wikipedia", fn: searchWikipedia },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(cleanedQuery);
      if (result && typeof result === "string" && result.trim()) {
        return result;
      }
    } catch (err) {
      console.warn(`[WebSearch] ${provider.name} note:`, err.message);
    }
  }

  return `Web search attempted for "${cleanedQuery}". Live search results were temporarily unreachable. Proceeding with built-in assistant knowledge.`;
};
