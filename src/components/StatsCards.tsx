import React, { useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: number;
  creator_name: string;
  created_at: string;
  assigned_to?: number | null;
  assigned_name?: string | null;
  deadline?: string | null;
}

interface StatsCardsProps {
  tickets: Ticket[];
}

const StatsCards = React.memo(function StatsCards({ tickets }: StatsCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      overdue: tickets.filter(
        t => t.deadline && new Date(t.deadline) < now && t.status !== 'closed'
      ).length
    };
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-primary/20 bg-card/95">
        <CardHeader className="pb-3">
          <CardDescription>Всего заявок</CardDescription>
          <CardTitle className="text-3xl text-primary">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-blue-500/20 bg-card/95">
        <CardHeader className="pb-3">
          <CardDescription>Открытые</CardDescription>
          <CardTitle className="text-3xl text-blue-500">{stats.open}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-yellow-500/20 bg-card/95">
        <CardHeader className="pb-3">
          <CardDescription>В работе</CardDescription>
          <CardTitle className="text-3xl text-yellow-500">{stats.inProgress}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-red-500/20 bg-card/95">
        <CardHeader className="pb-3">
          <CardDescription>Просрочено</CardDescription>
          <CardTitle className="text-3xl text-red-500">{stats.overdue}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
});

export default StatsCards;