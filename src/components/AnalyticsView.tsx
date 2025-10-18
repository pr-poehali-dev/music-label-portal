import { useState } from 'react';
import Icon from '@/components/ui/icon';
import TaskAnalyticsDashboard from './TaskAnalyticsDashboard';
import TicketAnalyticsDashboard from './TicketAnalyticsDashboard';

export default function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'tickets'>('tasks');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="BarChart3" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Аналитика</h1>
      </div>

      {/* Tabs */}
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
          Аналитика заявок
        </button>
      </div>

      {/* Tasks Analytics Tab */}
      {activeTab === 'tasks' && <TaskAnalyticsDashboard />}

      {/* Tickets Analytics Tab */}
      {activeTab === 'tickets' && <TicketAnalyticsDashboard />}
    </div>
  );
}
