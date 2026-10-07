/**
 * Web Search Tool using DuckDuckGo
 * Provides real-time web search capabilities without requiring external API keys.
 * @param {string} query - The search query
 */
export const searchWeb = async (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    return "No search query provided.";
  }

  const cleanedQuery = query.trim();

  try {
    // 1. Try DuckDuckGo Instant Answer API first
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      cleanedQuery,
    )}&format=json&no_html=1&skip_disambig=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const apiRes = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
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
        return `Web Search Results for "${cleanedQuery}":\n${results.join("\n")}`;
      }
    }

    // 2. Fallback to DuckDuckGo HTML search lite
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanedQuery)}`;
    const htmlController = new AbortController();
    const htmlTimeout = setTimeout(() => htmlController.abort(), 6000);

    const htmlRes = await fetch(htmlUrl, {
      signal: htmlController.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(htmlTimeout);

    if (htmlRes.ok) {
      const html = await htmlRes.text();
      // Extract snippet snippets using regex
      const snippetMatches = [
        ...html.matchAll(/<a class="result__snippet[^>]*>(.*?)<\/a>/gs),
      ].slice(0, 4);

      if (snippetMatches.length > 0) {
        const snippets = snippetMatches.map((m) =>
          m[1].replace(/<[^>]+>/g, "").trim(),
        );
        return `Web Search Results for "${cleanedQuery}":\n${snippets
          .map((s, idx) => `[${idx + 1}] ${s}`)
          .join("\n\n")}`;
      }
    }

    return `Search completed for "${cleanedQuery}", but no direct snippets were returned.`;
  } catch (err) {
    console.warn("Web search encountered an error:", err.message);
    return `Unable to complete web search for "${cleanedQuery}" (${err.message}). Proceeding with internal knowledge.`;
  }
};
