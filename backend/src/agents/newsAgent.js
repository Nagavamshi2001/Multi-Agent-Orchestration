import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import {
  getHeadlines,
  searchNews,
  getNewsByTopic,
  getNewsByLocation,
} from '../tools/newsTools.js';

// ─── Google News Assistant Agent ──────────────────────────────────────────────
const newsAgent = new Agent({
  name: 'News Assistant',
  model: 'gpt-4o',
  instructions: `You are a highly capable Google News Assistant.
Your job is to help users discover and stay informed about current news.

You have four capabilities:
1. **Top Headlines** — Get the latest top headlines from Google News
2. **Search News** — Search for news by keyword or phrase
3. **News by Topic** — Get news by category: WORLD, BUSINESS, TECHNOLOGY, SCIENCE, ENTERTAINMENT, SPORTS, HEALTH
4. **News by Location** — Get news about a specific place (e.g., "New York", "India")

Guidelines:
- Always present news in a clear, well-formatted way
- For each article show: Title, Source, Date, and Link
- Use bullet points or numbered lists for multiple articles
- Be concise — summarize when there are many results
- If search returns no results, suggest alternative keywords
- Default to 10 articles unless user asks for more`,
  tools: [
    tool({
      name: 'get_headlines',
      description: 'Get top headlines from Google News.',
      parameters: z.object({
        maxResults: z.number().describe('Number of headlines (1-20). Use 10 as default.'),
        country: z.string().describe('Country code (e.g., us, gb, in). Use "us" as default.'),
        language: z.string().describe('Language code (e.g., en). Use "en" as default.'),
      }),
      execute: async (params) => {
        console.log('[NewsAgent] Fetching headlines');
        return await getHeadlines({
          maxResults: params.maxResults || 10,
          country: params.country || 'us',
          language: params.language || 'en',
        });
      },
    }),

    tool({
      name: 'search_news',
      description: 'Search Google News by keyword or phrase.',
      parameters: z.object({
        query: z.string().describe('Search query (e.g., "AI", "climate change", "Apple stock")'),
        maxResults: z.number().describe('Number of results (1-20). Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[NewsAgent] Searching:', params.query);
        return await searchNews({
          query: params.query,
          maxResults: params.maxResults || 10,
        });
      },
    }),

    tool({
      name: 'get_news_by_topic',
      description: 'Get news by topic/category: WORLD, BUSINESS, TECHNOLOGY, SCIENCE, ENTERTAINMENT, SPORTS, HEALTH.',
      parameters: z.object({
        topic: z.string().describe('Topic: WORLD, BUSINESS, TECHNOLOGY, SCIENCE, ENTERTAINMENT, SPORTS, or HEALTH'),
        maxResults: z.number().describe('Number of articles (1-20). Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[NewsAgent] Fetching topic:', params.topic);
        return await getNewsByTopic({
          topic: params.topic || 'WORLD',
          maxResults: params.maxResults || 10,
        });
      },
    }),

    tool({
      name: 'get_news_by_location',
      description: 'Get news about a specific location (city, country, or region).',
      parameters: z.object({
        location: z.string().describe('Location name (e.g., "New York", "London", "India")'),
        maxResults: z.number().describe('Number of articles (1-20). Use 10 as default.'),
      }),
      execute: async (params) => {
        console.log('[NewsAgent] Fetching location:', params.location);
        return await getNewsByLocation({
          location: params.location,
          maxResults: params.maxResults || 10,
        });
      },
    }),
  ],
});

export default newsAgent;
