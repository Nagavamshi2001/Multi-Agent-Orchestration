import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// ─── Google Tasks OAuth2 Client ───────────────────────────────────────────────
// Uses same OAuth2 credentials; ensure refresh token includes Tasks scope:
// https://www.googleapis.com/auth/tasks
const createOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oauth2Client;
};

const getTasksClient = () => {
  const auth = createOAuth2Client();
  return google.tasks({ version: 'v1', auth });
};

// ─── Check if credentials are configured ──────────────────────────────────────
export const isTasksConfigured = () => {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_CLIENT_ID !== 'your-client-id.apps.googleusercontent.com'
  );
};

// ─── Helper: Get default task list ID (first list) ─────────────────────────────
const getDefaultTaskListId = async () => {
  const tasks = getTasksClient();
  const res = await tasks.tasklists.list({ maxResults: 1 });
  const lists = res.data.items || [];
  return lists.length > 0 ? lists[0].id : null;
};

// ─── Tool: List Task Lists ─────────────────────────────────────────────────────
export const listTaskLists = async () => {
  if (!isTasksConfigured()) {
    return JSON.stringify({
      error: 'Tasks credentials not configured. Add Tasks scope to OAuth (https://www.googleapis.com/auth/tasks)',
      setup: 'Re-authorize in OAuth Playground with tasks scope and update GMAIL_REFRESH_TOKEN',
    });
  }

  try {
    const tasks = getTasksClient();
    const res = await tasks.tasklists.list();
    const lists = res.data.items || [];

    if (lists.length === 0) {
      return JSON.stringify({ count: 0, taskLists: [], message: 'No task lists found.' });
    }

    const formatted = lists.map((l) => ({
      id: l.id,
      title: l.title || '(No title)',
    }));

    return JSON.stringify({ count: formatted.length, taskLists: formatted });
  } catch (err) {
    console.error('[listTaskLists] Error:', err.message);
    return JSON.stringify({ error: `Failed to list task lists: ${err.message}` });
  }
};

// ─── Tool: List Tasks ──────────────────────────────────────────────────────────
export const listTasks = async ({ taskListId, showCompleted = false, maxResults = 20 }) => {
  if (!isTasksConfigured()) {
    return JSON.stringify({
      error: 'Tasks credentials not configured.',
    });
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return JSON.stringify({ error: 'No task lists found. Create a task list first in Google Tasks.' });
    }

    const res = await tasks.tasks.list({
      tasklist: listId,
      showCompleted: !!showCompleted,
      showHidden: false,
      maxResults: Math.min(maxResults, 100),
    });

    const items = res.data.items || [];
    if (items.length === 0) {
      return JSON.stringify({
        count: 0,
        tasks: [],
        message: showCompleted ? 'No tasks found.' : 'No incomplete tasks found.',
      });
    }

    const formatted = items.map((t) => ({
      id: t.id,
      title: t.title || '(No title)',
      status: t.status || 'needsAction',
      due: t.due || null,
      notes: t.notes ? t.notes.substring(0, 150) : null,
    }));

    return JSON.stringify({ count: formatted.length, tasks: formatted });
  } catch (err) {
    console.error('[listTasks] Error:', err.message);
    return JSON.stringify({ error: `Failed to list tasks: ${err.message}` });
  }
};

// ─── Tool: Create Task ────────────────────────────────────────────────────────
export const createTask = async ({
  title,
  notes = '',
  due = '',
  taskListId,
}) => {
  if (!isTasksConfigured()) {
    return JSON.stringify({ error: 'Tasks credentials not configured.' });
  }

  if (!title || !title.trim()) {
    return JSON.stringify({ error: 'title is required.' });
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return JSON.stringify({ error: 'No task lists found. Create a task list first.' });
    }

    const body = {
      title: title.trim(),
      ...(notes && { notes: notes.trim() }),
      ...(due && { due: due }), // RFC 3339 format e.g. 2025-03-01T00:00:00.000Z
    };

    const res = await tasks.tasks.insert({
      tasklist: listId,
      requestBody: body,
    });

    return JSON.stringify({
      success: true,
      message: `Task "${title.trim()}" created successfully.`,
      taskId: res.data.id,
    });
  } catch (err) {
    console.error('[createTask] Error:', err.message);
    return JSON.stringify({ error: `Failed to create task: ${err.message}` });
  }
};

// ─── Tool: Complete Task ────────────────────────────────────────────────────────
export const completeTask = async ({ taskId, taskListId }) => {
  if (!isTasksConfigured()) {
    return JSON.stringify({ error: 'Tasks credentials not configured.' });
  }

  if (!taskId) {
    return JSON.stringify({ error: 'taskId is required.' });
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return JSON.stringify({ error: 'No task lists found.' });
    }

    await tasks.tasks.patch({
      tasklist: listId,
      task: taskId,
      requestBody: { status: 'completed' },
    });

    return JSON.stringify({
      success: true,
      message: `Task marked as completed.`,
    });
  } catch (err) {
    console.error('[completeTask] Error:', err.message);
    return JSON.stringify({ error: `Failed to complete task: ${err.message}` });
  }
};

// ─── Tool: Delete Task ─────────────────────────────────────────────────────────
export const deleteTask = async ({ taskId, taskListId }) => {
  if (!isTasksConfigured()) {
    return JSON.stringify({ error: 'Tasks credentials not configured.' });
  }

  if (!taskId) {
    return JSON.stringify({ error: 'taskId is required.' });
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return JSON.stringify({ error: 'No task lists found.' });
    }

    await tasks.tasks.delete({
      tasklist: listId,
      task: taskId,
    });

    return JSON.stringify({
      success: true,
      message: `Task deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteTask] Error:', err.message);
    return JSON.stringify({ error: `Failed to delete task: ${err.message}` });
  }
};
