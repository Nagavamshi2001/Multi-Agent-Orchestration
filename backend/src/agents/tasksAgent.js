import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import {
  listTaskLists,
  listTasks,
  createTask,
  completeTask,
  deleteTask,
} from '../tools/tasksTools.js';

// ─── Google Tasks Assistant Agent ─────────────────────────────────────────────
const tasksAgent = new Agent({
  name: 'Tasks Assistant',
  model: 'gpt-4o',
  instructions: `You are a highly capable Google Tasks Assistant.
Your job is to help users manage their tasks and to-do lists efficiently.

You have five capabilities:
1. **List Task Lists** — Show the user's Google Tasks lists (e.g., "My Tasks")
2. **List Tasks** — Show tasks in a list (incomplete by default, or include completed)
3. **Create Task** — Add a new task with title, optional notes and due date
4. **Complete Task** — Mark a task as done by its ID
5. **Delete Task** — Remove a task by its ID

Guidelines:
- Always present task information in a clear, well-formatted way
- For list results, show: Title, Status, Due date (if any), and Task ID for actions
- When creating tasks, use RFC 3339 for due date (e.g., "2025-03-01T00:00:00.000Z")
- If user says "due tomorrow", convert to the appropriate RFC 3339 datetime
- Use the default task list unless user specifies a different one
- If credentials are not configured, explain how to add the Tasks scope to OAuth
- Be concise but thorough — don't omit important task details
- Use bullet points or numbered lists for multiple tasks
- For list_tasks, use showCompleted: true only when user asks for completed or "all" tasks`,
  tools: [
    tool({
      name: 'list_task_lists',
      description: 'List all Google Tasks lists (e.g., My Tasks). Returns id and title for each list.',
      parameters: z.object({}),
      execute: async () => {
        console.log('[TasksAgent] Listing task lists');
        return await listTaskLists();
      },
    }),

    tool({
      name: 'list_tasks',
      description: 'List tasks from the default or specified task list. By default shows only incomplete tasks.',
      parameters: z.object({
        showCompleted: z.boolean().describe('Set true to include completed tasks. Default false.'),
        maxResults: z.number().describe('Maximum tasks to return. Use 20 as default.'),
        taskListId: z.string().describe('Task list ID. Use empty string "" to use default list.'),
      }),
      execute: async (params) => {
        console.log('[TasksAgent] Listing tasks, showCompleted:', params.showCompleted);
        return await listTasks({
          taskListId: params.taskListId || undefined,
          showCompleted: params.showCompleted,
          maxResults: params.maxResults || 20,
        });
      },
    }),

    tool({
      name: 'create_task',
      description: 'Create a new task in the default task list.',
      parameters: z.object({
        title: z.string().describe('Task title'),
        notes: z.string().describe('Optional notes. Use empty string "" if not needed.'),
        due: z.string().describe('Optional due date in RFC 3339 format. Use empty string "" if not needed.'),
      }),
      execute: async (params) => {
        console.log('[TasksAgent] Creating task:', params.title);
        return await createTask({
          title: params.title,
          notes: params.notes || '',
          due: params.due || '',
        });
      },
    }),

    tool({
      name: 'complete_task',
      description: 'Mark a task as completed by its ID.',
      parameters: z.object({
        taskId: z.string().describe('The task ID to mark complete (from list results)'),
      }),
      execute: async (params) => {
        console.log('[TasksAgent] Completing task:', params.taskId);
        return await completeTask({ taskId: params.taskId });
      },
    }),

    tool({
      name: 'delete_task',
      description: 'Delete a task by its ID.',
      parameters: z.object({
        taskId: z.string().describe('The task ID to delete (from list results)'),
      }),
      execute: async (params) => {
        console.log('[TasksAgent] Deleting task:', params.taskId);
        return await deleteTask({ taskId: params.taskId });
      },
    }),
  ],
});

export default tasksAgent;
