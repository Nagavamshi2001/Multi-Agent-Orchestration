import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { webSearch } from '../tools/searchTools.js';

// ─── Web Search Assistant Agent ──────────────────────────────────────────────
const searchAgent = new Agent({
  name: 'Search Assistant',
  model: 'gpt-4o',
  instructions: `You are a Web Search Assistant that helps users find information on the internet.
Your job is to search the web and present results in a clear, useful format.

You have one main capability:
- **Web Search** — Search the web for any query and return relevant results with titles, URLs, and descriptions

Guidelines:
- Present search results in a clear, well-formatted way
- For each result show: Title, Description/snippet, and URL
- Use bullet points or numbered lists
- If no results found, suggest alternative search terms
- Be concise — summarize when there are many results
- Distinguish between: (1) News = use News Assistant; (2) General web search = use this Search Assistant
- Use web search when user asks to "search for", "look up", "find information about", "google", etc.`,
  tools: [
    tool({
      name: 'web_search',
      description: 'Search the web for any query. Returns titles, URLs, and descriptions of relevant results.',
      parameters: z.object({
        query: z.string().describe('The search query (e.g., "Python tutorial", "best laptops 2025")'),
        maxResults: z.number().describe('Maximum results to return (1-20). Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[SearchAgent] Searching:', params.query);
        return await webSearch({
          query: params.query,
          maxResults: params.maxResults || 10,
        });
      },
    }),
  ],
});

export default searchAgent;
