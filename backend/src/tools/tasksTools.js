import { getTasksClient, isTasksConfigured } from '../utils/googleAuth.js';
import { toolSuccess, toolError, toolEmpty } from '../utils/toolResponse.js';
import { safeTitle, clampMaxResults } from '../utils/helpers.js';

export { isTasksConfigured };

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
    return toolError(
      'Tasks credentials not configured. Add Tasks scope to OAuth (https://www.googleapis.com/auth/tasks)',
      { setup: 'Re-authorize in OAuth Playground with tasks scope and update GMAIL_REFRESH_TOKEN' }
    );
  }

  try {
    const tasks = getTasksClient();
    const res = await tasks.tasklists.list();
    const lists = res.data.items || [];

    if (lists.length === 0) {
      return toolEmpty('No task lists found.', { taskLists: [] });
    }

    const formatted = lists.map((l) => ({
      id: l.id,
      title: safeTitle(l.title),
    }));

    return toolSuccess({ count: formatted.length, taskLists: formatted });
  } catch (err) {
    console.error('[listTaskLists] Error:', err.message);
    return toolError(`Failed to list task lists: ${err.message}`);
  }
};

// ─── Tool: List Tasks ──────────────────────────────────────────────────────────
export const listTasks = async ({ taskListId, showCompleted = false, maxResults = 20 }) => {
  if (!isTasksConfigured()) {
    return toolError('Tasks credentials not configured.');
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return toolError('No task lists found. Create a task list first in Google Tasks.');
    }

    const res = await tasks.tasks.list({
      tasklist: listId,
      showCompleted: !!showCompleted,
      showHidden: false,
      maxResults: clampMaxResults(maxResults, 100),
    });

    const items = res.data.items || [];
    if (items.length === 0) {
      return toolEmpty(showCompleted ? 'No tasks found.' : 'No incomplete tasks found.', {
        tasks: [],
      });
    }

    const formatted = items.map((t) => ({
      id: t.id,
      title: safeTitle(t.title),
      status: t.status || 'needsAction',
      due: t.due || null,
      notes: t.notes ? t.notes.substring(0, 150) : null,
    }));

    return toolSuccess({ count: formatted.length, tasks: formatted });
  } catch (err) {
    console.error('[listTasks] Error:', err.message);
    return toolError(`Failed to list tasks: ${err.message}`);
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
    return toolError('Tasks credentials not configured.');
  }

  if (!title || !title.trim()) {
    return toolError('title is required.');
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return toolError('No task lists found. Create a task list first.');
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

    return toolSuccess({
      success: true,
      message: `Task "${title.trim()}" created successfully.`,
      taskId: res.data.id,
    });
  } catch (err) {
    console.error('[createTask] Error:', err.message);
    return toolError(`Failed to create task: ${err.message}`);
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
    return toolError('Tasks credentials not configured.');
  }

  if (!taskId) {
    return toolError('taskId is required.');
  }

  try {
    const tasks = getTasksClient();
    const listId = taskListId || (await getDefaultTaskListId());

    if (!listId) {
      return toolError('No task lists found.');
    }

    await tasks.tasks.delete({
      tasklist: listId,
      task: taskId,
    });

    return toolSuccess({
      success: true,
      message: `Task deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteTask] Error:', err.message);
    return toolError(`Failed to delete task: ${err.message}`);
  }
};
