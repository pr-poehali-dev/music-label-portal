const USERS_API = 'https://functions.poehali.dev/cf5d45c1-d64b-4400-af77-a51c7588d942';
const STATS_COLLECTION_KEY = 'last_stats_collection';
const COLLECTION_INTERVAL = 24 * 60 * 60 * 1000;

export async function collectStatsIfNeeded(): Promise<void> {
  const lastCollection = localStorage.getItem(STATS_COLLECTION_KEY);
  const now = Date.now();

  if (!lastCollection || now - parseInt(lastCollection) >= COLLECTION_INTERVAL) {
    try {
      const response = await fetch(`${USERS_API}?action=collect_stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.setItem(STATS_COLLECTION_KEY, now.toString());
        console.log('✅ Статистика успешно обновлена');
      }
    } catch (error) {
      console.error('❌ Ошибка сбора статистики:', error);
    }
  }
}

export function getNextCollectionTime(): Date | null {
  const lastCollection = localStorage.getItem(STATS_COLLECTION_KEY);
  
  if (!lastCollection) {
    return new Date();
  }

  const nextCollection = parseInt(lastCollection) + COLLECTION_INTERVAL;
  return new Date(nextCollection);
}
