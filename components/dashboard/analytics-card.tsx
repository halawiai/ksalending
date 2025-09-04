'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface AnalyticsData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: 'chart' | 'trending' | 'dollar' | 'users';
}

interface AnalyticsCardProps {
  data: AnalyticsData;
}

export function AnalyticsCard({ data }: AnalyticsCardProps) {
  const getIcon = () => {
    switch (data.icon) {
      case 'chart':
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
      case 'dollar':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case 'users':
        return <Users className="h-4 w-4 text-muted-foreground" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeColor = () => {
    switch (data.changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.value}</div>
        {data.change && (
          <div className={`text-xs ${getChangeColor()}`}>
            {data.change}
          </div>
        )}
      </CardContent>
    </Card>
  );
}