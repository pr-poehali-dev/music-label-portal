import { useState } from 'react';
import Icon from '@/components/ui/icon';
import TaskAnalyticsDashboard from './TaskAnalyticsDashboard';
import TicketAnalyticsDashboard from './TicketAnalyticsDashboard';
import ReleaseAnalyticsDashboard from './ReleaseAnalyticsDashboard';

export default function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'tickets' | 'releases'>('tasks');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="BarChart3" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Аналитика</h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Аналитика задач
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Аналитика тикетов
        </button>
        <button
          onClick={() => setActiveTab('releases')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'releases'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Аналитика релизов
        </button>
      </div>

      {activeTab === 'tasks' && <TaskAnalyticsDashboard />}
      {activeTab === 'tickets' && <TicketAnalyticsDashboard />}
      {activeTab === 'releases' && <ReleaseAnalyticsDashboard />}
    </div>
  );
}