'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface PartnerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  successRate: number;
  monthlyQuota: number;
  currentUsage: number;
  approvalRate: number;
}

export interface ApiUsageData {
  date: string;
  requests: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
}

export interface RiskDistribution {
  riskLevel: string;
  count: number;
  percentage: number;
}

export interface GeographicData {
  region: string;
  assessments: number;
  percentage: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  assessments: number;
  costPerAssessment: number;
}

export function usePartnerAnalytics(partnerId: string, dateRange: string = '7d') {
  const queryClient = useQueryClient();

  // Get partner metrics
  const getPartnerMetrics = useQuery({
    queryKey: ['partner-metrics', partnerId, dateRange],
    queryFn: async (): Promise<PartnerMetrics> => {
      const { data, error } = await supabase
        .from('partner_metrics')
        .select('*')
        .eq('partner_id', partnerId)
        .gte('created_at', getDateRangeStart(dateRange))
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate metrics
      const totalRequests = data?.reduce((sum, metric) => sum + metric.total_requests, 0) || 0;
      const successfulRequests = data?.reduce((sum, metric) => sum + metric.successful_requests, 0) || 0;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = data?.reduce((sum, metric) => sum + metric.average_response_time, 0) / (data?.length || 1) || 0;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(averageResponseTime),
        successRate: Math.round(successRate * 100) / 100,
        monthlyQuota: 10000, // This would come from partner settings
        currentUsage: totalRequests,
        approvalRate: 78.5, // This would be calculated from assessment results
      };
    },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get API usage data
  const getApiUsageData = useQuery({
    queryKey: ['api-usage', partnerId, dateRange],
    queryFn: async (): Promise<ApiUsageData[]> => {
      const { data, error } = await supabase
        .from('api_audit_logs')
        .select('*')
        .eq('partner_id', partnerId)
        .gte('created_at', getDateRangeStart(dateRange))
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and aggregate
      const groupedData = data?.reduce((acc, log) => {
        const date = log.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            requests: 0,
            successful: 0,
            failed: 0,
            totalResponseTime: 0,
            count: 0,
          };
        }
        acc[date].requests++;
        if (log.status === 'success') {
          acc[date].successful++;
        } else {
          acc[date].failed++;
        }
        acc[date].totalResponseTime += log.response_time || 0;
        acc[date].count++;
        return acc;
      }, {} as Record<string, any>) || {};

      return Object.values(groupedData).map((day: any) => ({
        date: day.date,
        requests: day.requests,
        successful: day.successful,
        failed: day.failed,
        averageResponseTime: Math.round(day.totalResponseTime / day.count) || 0,
      }));
    },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
  });

  // Get risk distribution
  const getRiskDistribution = useQuery({
    queryKey: ['risk-distribution', partnerId, dateRange],
    queryFn: async (): Promise<RiskDistribution[]> => {
      const { data, error } = await supabase
        .from('assessments')
        .select('risk_level')
        .eq('created_by', partnerId)
        .gte('created_at', getDateRangeStart(dateRange));

      if (error) throw error;

      const distribution = data?.reduce((acc, assessment) => {
        const riskLevel = assessment.risk_level || 'unknown';
        acc[riskLevel] = (acc[riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

      return Object.entries(distribution).map(([riskLevel, count]) => ({
        riskLevel,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
  });

  // Get geographic distribution
  const getGeographicData = useQuery({
    queryKey: ['geographic-data', partnerId, dateRange],
    queryFn: async (): Promise<GeographicData[]> => {
      // This would typically join with entity location data
      // For now, return mock data
      return [
        { region: 'Riyadh', assessments: 4500, percentage: 35 },
        { region: 'Jeddah', assessments: 3200, percentage: 25 },
        { region: 'Dammam', assessments: 2100, percentage: 16 },
        { region: 'Mecca', assessments: 1800, percentage: 14 },
        { region: 'Medina', assessments: 1300, percentage: 10 },
      ];
    },
    enabled: !!partnerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get revenue data
  const getRevenueData = useQuery({
    queryKey: ['revenue-data', partnerId],
    queryFn: async (): Promise<RevenueData[]> => {
      // This would calculate revenue based on assessment pricing
      // For now, return mock data
      return [
        { month: 'Jan', revenue: 125000, assessments: 2500, costPerAssessment: 50 },
        { month: 'Feb', revenue: 142000, assessments: 2840, costPerAssessment: 50 },
        { month: 'Mar', revenue: 138000, assessments: 2760, costPerAssessment: 50 },
        { month: 'Apr', revenue: 156000, assessments: 3120, costPerAssessment: 50 },
        { month: 'May', revenue: 168000, assessments: 3360, costPerAssessment: 50 },
        { month: 'Jun', revenue: 175000, assessments: 3500, costPerAssessment: 50 },
      ];
    },
    enabled: !!partnerId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Export data mutation
  const exportData = useMutation({
    mutationFn: async ({ format, dataType }: { format: 'pdf' | 'excel'; dataType: string }) => {
      // This would generate and download the export file
      const response = await fetch('/api/v1/partner/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          partner_id: partnerId,
          format,
          data_type: dataType,
          date_range: dateRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partner-analytics-${dataType}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  return {
    metrics: getPartnerMetrics.data,
    apiUsageData: getApiUsageData.data,
    riskDistribution: getRiskDistribution.data,
    geographicData: getGeographicData.data,
    revenueData: getRevenueData.data,
    isLoading: getPartnerMetrics.isLoading || getApiUsageData.isLoading,
    error: getPartnerMetrics.error || getApiUsageData.error,
    exportData: exportData.mutate,
    isExporting: exportData.isPending,
  };
}

function getDateRangeStart(range: string): string {
  const now = new Date();
  switch (range) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Utility functions for analytics
export const analyticsUtils = {
  formatMetric: (value: number, type: 'number' | 'percentage' | 'currency' | 'time'): string => {
    switch (type) {
      case 'number':
        return value.toLocaleString();
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'time':
        return `${value}ms`;
      default:
        return value.toString();
    }
  },

  getMetricColor: (value: number, type: 'success_rate' | 'response_time' | 'approval_rate'): string => {
    switch (type) {
      case 'success_rate':
        if (value >= 98) return 'text-green-600';
        if (value >= 95) return 'text-yellow-600';
        return 'text-red-600';
      case 'response_time':
        if (value <= 50) return 'text-green-600';
        if (value <= 100) return 'text-yellow-600';
        return 'text-red-600';
      case 'approval_rate':
        if (value >= 80) return 'text-green-600';
        if (value >= 70) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },

  getTrendIcon: (current: number, previous: number): string => {
    if (current > previous) return '↗️';
    if (current < previous) return '↘️';
    return '➡️';
  },

  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },
};