'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { fraudDetectionEngine, FraudAssessment, FraudIndicator } from '@/lib/fraud/detector';
import { Entity } from '@/lib/types';
import { toast } from 'sonner';

export interface FraudCase {
  id: string;
  entity_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  indicator_count: number;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface FraudMetrics {
  total_cases: number;
  active_cases: number;
  resolved_cases: number;
  false_positives: number;
  detection_rate: number;
  average_response_time: number;
  cost_savings: number;
}

export function useFraudDetection() {
  const queryClient = useQueryClient();

  // Get fraud metrics
  const getFraudMetrics = useQuery({
    queryKey: ['fraud-metrics'],
    queryFn: async (): Promise<FraudMetrics> => {
      const { data, error } = await supabase
        .from('fraud_cases')
        .select('*');

      if (error) throw error;

      const totalCases = data?.length || 0;
      const activeCases = data?.filter(c => c.status === 'open' || c.status === 'investigating').length || 0;
      const resolvedCases = data?.filter(c => c.status === 'resolved').length || 0;
      const falsePositives = data?.filter(c => c.status === 'false_positive').length || 0;

      return {
        total_cases: totalCases,
        active_cases: activeCases,
        resolved_cases: resolvedCases,
        false_positives: falsePositives,
        detection_rate: totalCases > 0 ? ((totalCases - falsePositives) / totalCases) * 100 : 0,
        average_response_time: 1.8, // Mock data - would calculate from actual response times
        cost_savings: 2400000, // Mock data - would calculate from prevented fraud amounts
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get active fraud cases
  const getActiveCases = useQuery({
    queryKey: ['fraud-cases', 'active'],
    queryFn: async (): Promise<FraudCase[]> => {
      const { data, error } = await supabase
        .from('fraud_cases')
        .select('*')
        .in('status', ['open', 'investigating'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds for active cases
  });

  // Get fraud indicators
  const getFraudIndicators = (entityId?: string) => {
    return useQuery({
      queryKey: ['fraud-indicators', entityId],
      queryFn: async (): Promise<FraudIndicator[]> => {
        let query = supabase
          .from('fraud_indicators')
          .select('*')
          .order('detected_at', { ascending: false });

        if (entityId) {
          query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        return data || [];
      },
      enabled: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Run fraud detection
  const runFraudDetection = useMutation({
    mutationFn: async ({
      entity,
      deviceFingerprint,
      geolocation,
      behavioral,
      ipAddress,
    }: {
      entity: Entity;
      deviceFingerprint?: any;
      geolocation?: any;
      behavioral?: any;
      ipAddress?: string;
    }): Promise<FraudAssessment> => {
      return await fraudDetectionEngine.detectFraud(
        entity,
        deviceFingerprint,
        geolocation,
        behavioral,
        ipAddress
      );
    },
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: ['fraud-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-cases'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-indicators'] });
      
      if (assessment.risk_level === 'high' || assessment.risk_level === 'critical') {
        toast.warning(`High fraud risk detected: ${assessment.overall_risk_score}/100`);
      }
    },
    onError: (error) => {
      toast.error(`Fraud detection failed: ${error.message}`);
    },
  });

  // Update fraud case
  const updateFraudCase = useMutation({
    mutationFn: async ({
      caseId,
      updates,
    }: {
      caseId: string;
      updates: Partial<FraudCase>;
    }) => {
      const { data, error } = await supabase
        .from('fraud_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-cases'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-metrics'] });
      toast.success('Fraud case updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update case: ${error.message}`);
    },
  });

  // Resolve fraud case
  const resolveFraudCase = useMutation({
    mutationFn: async ({
      caseId,
      resolution,
      notes,
    }: {
      caseId: string;
      resolution: 'resolved' | 'false_positive';
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('fraud_cases')
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fraud-cases'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-metrics'] });
      toast.success(`Case ${variables.resolution === 'resolved' ? 'resolved' : 'marked as false positive'}`);
    },
    onError: (error) => {
      toast.error(`Failed to resolve case: ${error.message}`);
    },
  });

  // Block entity
  const blockEntity = useMutation({
    mutationFn: async ({
      entityId,
      reason,
      duration,
    }: {
      entityId: string;
      reason: string;
      duration?: number; // hours
    }) => {
      const expiresAt = duration 
        ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('blacklist')
        .insert({
          entity_id: entityId,
          reason,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Entity blocked successfully');
    },
    onError: (error) => {
      toast.error(`Failed to block entity: ${error.message}`);
    },
  });

  // Get fraud trends
  const getFraudTrends = (dateRange: string = '7d') => {
    return useQuery({
      queryKey: ['fraud-trends', dateRange],
      queryFn: async () => {
        const startDate = getDateRangeStart(dateRange);
        
        const { data, error } = await supabase
          .from('fraud_assessments')
          .select('*')
          .gte('created_at', startDate)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by date and aggregate
        const trends = data?.reduce((acc, assessment) => {
          const date = assessment.created_at.split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, detected: 0, blocked: 0, reviewed: 0 };
          }
          acc[date].detected++;
          if (assessment.risk_score >= 90) acc[date].blocked++;
          else if (assessment.risk_score >= 50) acc[date].reviewed++;
          return acc;
        }, {} as Record<string, any>) || {};

        return Object.values(trends);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // Export fraud data
  const exportFraudData = useMutation({
    mutationFn: async ({
      format,
      dateRange,
      includeResolved,
    }: {
      format: 'pdf' | 'excel';
      dateRange: string;
      includeResolved: boolean;
    }) => {
      const response = await fetch('/api/v1/fraud/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          format,
          date_range: dateRange,
          include_resolved: includeResolved,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success('Fraud report exported successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  return {
    // Data queries
    metrics: getFraudMetrics.data,
    activeCases: getActiveCases.data,
    getFraudIndicators,
    getFraudTrends,
    
    // Loading states
    isLoadingMetrics: getFraudMetrics.isLoading,
    isLoadingCases: getActiveCases.isLoading,
    
    // Mutations
    runFraudDetection: runFraudDetection.mutate,
    updateFraudCase: updateFraudCase.mutate,
    resolveFraudCase: resolveFraudCase.mutate,
    blockEntity: blockEntity.mutate,
    exportFraudData: exportFraudData.mutate,
    
    // Loading states for mutations
    isRunningDetection: runFraudDetection.isPending,
    isUpdatingCase: updateFraudCase.isPending,
    isResolvingCase: resolveFraudCase.isPending,
    isBlockingEntity: blockEntity.isPending,
    isExporting: exportFraudData.isPending,
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

// Utility functions for fraud detection
export const fraudUtils = {
  formatRiskScore: (score: number): string => {
    return `${Math.round(score)}/100`;
  },

  getRiskColor: (level: string): string => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  getRiskBackground: (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-orange-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'investigating': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'false_positive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  },

  getActionColor: (action: string): string => {
    switch (action) {
      case 'approve': return 'text-green-600';
      case 'review': return 'text-yellow-600';
      case 'reject': return 'text-orange-600';
      case 'block': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  formatConfidence: (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  },

  getIndicatorIcon: (type: string): string => {
    switch (type) {
      case 'velocity': return '⚡';
      case 'device': return '📱';
      case 'geolocation': return '🌍';
      case 'identity': return '👤';
      case 'behavioral': return '🧠';
      case 'financial': return '💰';
      default: return '🔍';
    }
  },

  calculateRiskTrend: (current: number, previous: number): {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  } => {
    if (previous === 0) return { trend: 'stable', percentage: 0 };
    
    const change = ((current - previous) / previous) * 100;
    
    if (Math.abs(change) < 5) return { trend: 'stable', percentage: change };
    return { trend: change > 0 ? 'up' : 'down', percentage: Math.abs(change) };
  },
};