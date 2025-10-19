import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskAnalyticsDashboard from './TaskAnalyticsDashboard';
import TicketAnalyticsDashboard from './TicketAnalyticsDashboard';
import ReleaseAnalyticsDashboard from './ReleaseAnalyticsDashboard';

export default function AnalyticsView() {
  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Icon name="BarChart3" size={24} className="text-primary md:hidden" />
        <Icon name="BarChart3" size={32} className="text-primary hidden md:block" />
        <h1 className="text-xl md:text-3xl font-bold">Аналитика</h1>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
          <TabsTrigger value="tasks" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="CheckSquare" className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
            <span className="hidden sm:inline">Задачи</span>
            <span className="sm:hidden">Задачи</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="Ticket" className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
            <span className="hidden sm:inline">Тикеты</span>
            <span className="sm:hidden">Тикеты</span>
          </TabsTrigger>
          <TabsTrigger value="releases" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="Music" className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
            <span className="hidden sm:inline">Релизы</span>
            <span className="sm:hidden">Релизы</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="tickets" className="mt-4">
          <TicketAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="releases" className="mt-4">
          <ReleaseAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}