'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ScoringAPIRequest, ScoringAPIResponse } from '@/lib/scoring/types';
import { toast } from 'sonner';

export interface ScoringOptions {
  includeFraudCheck?: boolean;
  includeAlternativeData?: boolean;
  includeRecommendations?: boolean;
  cacheResults?: boolean;
}

export function useScoring() {
  const queryClient = useQueryClient();

  // Get latest assessment for an entity
  const getAssessment = (entityId: string) => {
    return useQuery({
      queryKey: ['assessment', entityId],
      queryFn: async (): Promise<ScoringAPIResponse> => {
        const response = await fetch(`/api/v1/scoring?entityId=${entityId}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assessment');
        }

        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!entityId,
    });
  };

  // Create new assessment
  const createAssessment = useMutation({
    mutationFn: async (request: ScoringAPIRequest & { options?: ScoringOptions }) => {
      const session = await supabase.auth.getSession();
      
      const response = await fetch('/api/v1/scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create assessment');
      }

      return response.json() as Promise<ScoringAPIResponse>;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch assessment data
      queryClient.invalidateQueries({ queryKey: ['assessment', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      
      if (data.success && data.data) {
        toast.success(`Credit assessment completed. Score: ${data.data.score}`);
      }
    },
    onError: (error) => {
      toast.error(`Assessment failed: ${error.message}`);
    },
  });

  // Get assessment history
  const getAssessmentHistory = (entityId: string) => {
    return useQuery({
      queryKey: ['assessments', entityId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('entity_id', entityId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!entityId,
    });
  };

  // Calculate score for entity
  const calculateScore = async (
    entityId: string, 
    assessmentType: 'loan_application' | 'credit_review' | 'risk_evaluation' = 'credit_review',
    options: ScoringOptions = {}
  ) => {
    return createAssessment.mutateAsync({
      entityId,
      assessmentType,
      options: {
        includeFraudCheck: true,
        includeAlternativeData: true,
        includeRecommendations: true,
        cacheResults: true,
        ...options,
      },
    });
  };

  return {
    getAssessment,
    getAssessmentHistory,
    createAssessment,
    calculateScore,
    isCalculating: createAssessment.isPending,
  };
}

// Utility functions for scoring data
export const scoringUtils = {
  formatScore: (score: number): string => {
    return score.toString();
  },

  getScoreColor: (score: number): string => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-blue-600';
    if (score >= 550) return 'text-yellow-600';
    if (score >= 450) return 'text-orange-600';
    return 'text-red-600';
  },

  getScoreBackground: (score: number): string => {
    if (score >= 750) return 'bg-green-100';
    if (score >= 650) return 'bg-blue-100';
    if (score >= 550) return 'bg-yellow-100';
    if (score >= 450) return 'bg-orange-100';
    return 'bg-red-100';
  },

  getRiskLevelColor: (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'very_low':
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
      case 'very_high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },

  formatRiskLevel: (riskLevel: string): string => {
    return riskLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  formatProbability: (probability: number): string => {
    return `${(probability * 100).toFixed(1)}%`;
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  },

  formatInterestRate: (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  },

  getRecommendationIcon: (type: string) => {
    switch (type) {
      case 'improvement':
        return '📈';
      case 'warning':
        return '⚠️';
      case 'opportunity':
        return '💡';
      default:
        return '📋';
    }
  },

  getFactorImpactIcon: (impact: string) => {
    switch (impact) {
      case 'positive':
        return '✅';
      case 'negative':
        return '❌';
      case 'neutral':
        return '➖';
      default:
        return '❓';
    }
  },
};