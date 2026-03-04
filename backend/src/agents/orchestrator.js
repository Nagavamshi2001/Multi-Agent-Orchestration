import { Agent, handoff } from '@openai/agents';
import emailAgent, { createEmailAgent } from './emailAgent.js';
import calendarAgent, { createCalendarAgent } from './calendarAgent.js';
import tasksAgent, { createTasksAgent } from './tasksAgent.js';
import newsAgent, { createNewsAgent } from './newsAgent.js';
import searchAgent, { createSearchAgent } from './searchAgent.js';
import youtubeAgent, { createYouTubeAgent } from './youtubeAgent.js';

// ─── Master Orchestrator Agent ────────────────────────────────────────────────
const ORCHESTRATOR_INSTRUCTIONS = `You are a powerful AI Orchestrator that manages a team of specialized sub-agents.
Your primary role is to understand the user's intent and delegate tasks to the most appropriate sub-agent,
or answer directly if the question is within your general knowledge.

## Your Team of Specialized Sub-Agents:

### 📧 Email Assistant
- **Trigger**: Any email-related request
- **Capabilities**:
  - Reading/checking unread emails
  - Sending emails to recipients
  - Searching emails by sender, subject, keyword, date, or any Gmail filter
- **Example requests**: "Check my inbox", "Send an email to John", "Find emails from Amazon", "Show unread emails"

### 📅 Calendar Assistant
- **Trigger**: Any calendar-related request
- **Capabilities**:
  - Listing upcoming events
  - Creating new events (meetings, reminders)
  - Deleting events
  - Searching events by keyword or date range
- **Example requests**: "What's on my calendar?", "Schedule a meeting tomorrow at 3pm", "Create event Team Standup", "Delete the meeting at 2pm", "Find events next week"

### ✅ Tasks Assistant
- **Trigger**: Any tasks, to-do, or todo list related request
- **Capabilities**:
  - Listing task lists and tasks
  - Creating new tasks
  - Marking tasks as complete
  - Deleting tasks
- **Example requests**: "Show my tasks", "Add task Buy groceries", "What's on my to-do list?", "Mark task X as done", "Delete task Y", "Create task Study for exam due tomorrow"

### 📰 News Assistant
- **Trigger**: Any news, headlines, or current events related request
- **Capabilities**:
  - Top headlines
  - Search news by keyword
  - News by topic (world, business, tech, sports, etc.)
  - News by location
- **Example requests**: "What's the latest news?", "Search news about AI", "Tech news today", "News from India", "Business headlines"

### 🎬 YouTube Assistant
- **Trigger**: Any YouTube, music, songs, or YouTube Music related request
- **Capabilities**:
  - Get the user's YouTube channel and stats
  - List the user's playlists and playlist videos
  - Search YouTube for videos
  - Search for music/songs (YouTube Music style)
  - Get video details
- **Example requests**: "Show my YouTube channel", "My playlists", "Search YouTube for React tutorials", "Play a song by [artist]", "Find music", "Play [song name]", "YouTube Music search"

## Decision Logic:
1. If the user's request involves **emails** → delegate to **Email Assistant**
2. If the user's request involves **calendar, events, meetings, schedule** → delegate to **Calendar Assistant**
3. If the user's request involves **tasks, to-do, todo list, reminders** → delegate to **Tasks Assistant**
4. If the user's request involves **news, headlines, current events** → delegate to **News Assistant**
5. If the user wants to **search the web, look up, find online** (general web) → delegate to **Search Assistant**
6. If the user's request involves **YouTube, music, songs, play a song, find music, YouTube Music, playlists, channel** → delegate to **YouTube Assistant**
7. If the user asks about your capabilities or what you can do → explain your available sub-agents
8. If the question is general knowledge → answer directly without delegating
9. Always be transparent about which sub-agent you're delegating to

## Response Style:
- Be professional, friendly, and clear
- When delegating, briefly mention you're routing to the specialized agent
- Present results in a well-formatted, easy-to-read manner
- If a task fails, explain what went wrong and how to fix it`;

const orchestratorAgent = new Agent({
  name: 'Orchestrator',
  model: 'gpt-4o',
  instructions: ORCHESTRATOR_INSTRUCTIONS,
  handoffs: [
        handoff(emailAgent, {
            toolNameOverride: 'delegate_to_email_assistant',
            toolDescriptionOverride:
                'Delegate email-related tasks (read, send, search) to the Email Assistant agent.',
        }),
        handoff(calendarAgent, {
            toolNameOverride: 'delegate_to_calendar_assistant',
            toolDescriptionOverride:
                'Delegate calendar-related tasks (list, create, delete, search events) to the Calendar Assistant agent.',
        }),
        handoff(tasksAgent, {
            toolNameOverride: 'delegate_to_tasks_assistant',
            toolDescriptionOverride:
                'Delegate task/to-do related tasks (list, create, complete, delete) to the Tasks Assistant agent.',
        }),
        handoff(newsAgent, {
            toolNameOverride: 'delegate_to_news_assistant',
            toolDescriptionOverride:
                'Delegate news-related requests (headlines, search, topic, location) to the News Assistant agent.',
        }),
        handoff(searchAgent, {
            toolNameOverride: 'delegate_to_search_assistant',
            toolDescriptionOverride:
                'Delegate web search requests (look up, find online) to the Search Assistant agent.',
        }),
        handoff(youtubeAgent, {
            toolNameOverride: 'delegate_to_youtube_assistant',
            toolDescriptionOverride:
                'Delegate YouTube and music-related tasks (search videos, play music, playlists, channel) to the YouTube Assistant.',
        }),
    ],
});

/**
 * Create an orchestrator with sub-agents bound to request context so MCP tools run as the correct user.
 * Use this when running the agent from the chat WebSocket so OAuth context reaches the MCP server.
 */
export function createOrchestratorAgent(requestContext) {
  const email = createEmailAgent(requestContext);
  const calendar = createCalendarAgent(requestContext);
  const tasks = createTasksAgent(requestContext);
  const news = createNewsAgent(requestContext);
  const search = createSearchAgent(requestContext);
  const youtube = createYouTubeAgent(requestContext);
  return new Agent({
    name: 'Orchestrator',
    model: 'gpt-4o',
    instructions: ORCHESTRATOR_INSTRUCTIONS,
    handoffs: [
      handoff(email, {
        toolNameOverride: 'delegate_to_email_assistant',
        toolDescriptionOverride:
          'Delegate email-related tasks (read, send, search) to the Email Assistant agent.',
      }),
      handoff(calendar, {
        toolNameOverride: 'delegate_to_calendar_assistant',
        toolDescriptionOverride:
          'Delegate calendar-related tasks (list, create, delete, search events) to the Calendar Assistant agent.',
      }),
      handoff(tasks, {
        toolNameOverride: 'delegate_to_tasks_assistant',
        toolDescriptionOverride:
          'Delegate task/to-do related tasks (list, create, complete, delete) to the Tasks Assistant agent.',
      }),
      handoff(news, {
        toolNameOverride: 'delegate_to_news_assistant',
        toolDescriptionOverride:
          'Delegate news-related requests (headlines, search, topic, location) to the News Assistant agent.',
      }),
      handoff(search, {
        toolNameOverride: 'delegate_to_search_assistant',
        toolDescriptionOverride:
          'Delegate web search requests (look up, find online) to the Search Assistant agent.',
      }),
      handoff(youtube, {
        toolNameOverride: 'delegate_to_youtube_assistant',
        toolDescriptionOverride:
          'Delegate YouTube and music-related tasks (search videos, play music, playlists, channel) to the YouTube Assistant.',
      }),
    ],
  });
}

export default orchestratorAgent;
