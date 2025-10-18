import { useEffect, useRef } from 'react';

interface UnreadCounts {
  tickets: number;
  tasks: number;
  messages: number;
  submissions: number;
}

export function useNotifications(unreadCounts: UnreadCounts) {
  const prevCountsRef = useRef<UnreadCounts>({
    tickets: 0,
    tasks: 0,
    messages: 0,
    submissions: 0
  });

  useEffect(() => {
    const prevCounts = prevCountsRef.current;
    
    // Проверяем увеличение счётчиков
    const hasNewTickets = unreadCounts.tickets > prevCounts.tickets;
    const hasNewTasks = unreadCounts.tasks > prevCounts.tasks;
    const hasNewMessages = unreadCounts.messages > prevCounts.messages;
    const hasNewSubmissions = unreadCounts.submissions > prevCounts.submissions;

    if (hasNewTickets || hasNewTasks || hasNewMessages || hasNewSubmissions) {
      // Звуковое уведомление
      playNotificationSound();
      
      // Browser notification (если разрешено)
      if ('Notification' in window && Notification.permission === 'granted') {
        let notificationText = '';
        
        if (hasNewTickets) notificationText += `Новых тикетов: ${unreadCounts.tickets - prevCounts.tickets}\n`;
        if (hasNewTasks) notificationText += `Новых задач: ${unreadCounts.tasks - prevCounts.tasks}\n`;
        if (hasNewMessages) notificationText += `Новых сообщений: ${unreadCounts.messages - prevCounts.messages}\n`;
        if (hasNewSubmissions) notificationText += `Новых заявок: ${unreadCounts.submissions - prevCounts.submissions}`;
        
        new Notification('Новые уведомления', {
          body: notificationText,
          icon: '/favicon.ico'
        });
      }
    }

    // Сохраняем текущие значения
    prevCountsRef.current = unreadCounts;
  }, [unreadCounts]);

  return null;
}

function playNotificationSound() {
  // Создаём простой звуковой сигнал через Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Функция для запроса разрешения на уведомления
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
