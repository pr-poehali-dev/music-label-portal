import funcUrls from '../../backend/func2url.json';

export const API_ENDPOINTS = {
  TICKET_COMMENTS: funcUrls['ticket-comments'],
  CHANGE_PASSWORD: funcUrls['change-password'],
  GEN_HASH: funcUrls['gen-hash'],
  MIGRATE_DB: funcUrls['migrate-db'],
  VK_POSTS: funcUrls['vk-posts'],
  TELEGRAM_AUTH: funcUrls['telegram-auth'],
  PITCHING: funcUrls['pitching'],
  CREATE_NOTIFICATION: funcUrls['create-notification'],
  RELEASE_ANALYTICS: funcUrls['release-analytics'],
  NOTIFICATIONS: funcUrls['notifications'],
  RELEASES: funcUrls['releases'],
  UNREAD_COUNTS: funcUrls['unread-counts'],
  WEEKLY_REPORT: funcUrls['weekly-report'],
  TASKS: funcUrls['tasks'],
  MESSAGES: funcUrls['messages'],
  TICKET_ANALYTICS: funcUrls['ticket-analytics'],
  TASK_COMMENTS: funcUrls['task-comments'],
  UPLOAD_FILE: funcUrls['upload-file'],
  SUBMISSIONS: funcUrls['submissions'],
  UPLOAD_REPORTS: funcUrls['upload-reports'],
  DEADLINE_REMINDER: funcUrls['deadline-reminder'],
  TELEGRAM_BOT: funcUrls['telegram-bot'],
  USERS: funcUrls['users'],
  TICKETS: funcUrls['tickets'],
  AUTH: funcUrls['auth'],
} as const;

// Оптимизированная функция для fetch с retry и timeout
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok && retries > 0) {
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw error;
  }
};