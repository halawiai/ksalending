'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export interface RLSContext {
  userId: string | null;
  entityId: string | null;
  entityType: 'individual' | 'company' | 'institution' | null;
  role: string | null;
}

export function useRLS() {
  const { user, isAuthenticated } = useAuth();

  // Get RLS context for the current user
  const {
    data: rlsContext,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['rls-context', user?.id],
    queryFn: async (): Promise<RLSContext> => {
      if (!user?.id) {
        return {
          userId: null,
          entityId: null,
          entityType: null,
          role: null,
        };
      }

      // Get user profile to determine entity association
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('entity_id, entity_type, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching RLS context:', profileError);
        return {
          userId: user.id,
          entityId: null,
          entityType: null,
          role: null,
        };
      }

      return {
        userId: user.id,
        entityId: profile.entity_id,
        entityType: profile.entity_type,
        role: profile.role,
      };
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper functions for RLS policy checks
  const canReadEntity = (entityId: string): boolean => {
    if (!rlsContext) return false;
    
    // Admin can read all entities
    if (rlsContext.role === 'admin') return true;
    
    // Users can read their own entity
    if (rlsContext.entityId === entityId) return true;
    
    // Analysts can read entities of their type
    if (rlsContext.role === 'analyst') return true;
    
    return false;
  };

  const canWriteEntity = (entityId: string): boolean => {
    if (!rlsContext) return false;
    
    // Admin can write all entities
    if (rlsContext.role === 'admin') return true;
    
    // Users can write their own entity
    if (rlsContext.entityId === entityId) return true;
    
    return false;
  };

  const canReadAssessment = (entityId: string): boolean => {
    if (!rlsContext) return false;
    
    // Admin and analysts can read all assessments
    if (['admin', 'analyst'].includes(rlsContext.role || '')) return true;
    
    // Users can read assessments for their entity
    if (rlsContext.entityId === entityId) return true;
    
    return false;
  };

  const canCreateAssessment = (): boolean => {
    if (!rlsContext) return false;
    
    // Only admin and analysts can create assessments
    return ['admin', 'analyst'].includes(rlsContext.role || '');
  };

  return {
    rlsContext,
    isLoading,
    error,
    canReadEntity,
    canWriteEntity,
    canReadAssessment,
    canCreateAssessment,
  };
}

// RLS policy helpers for server-side usage
export const rlsPolicies = {
  // Entity policies
  entityReadPolicy: `
    CREATE POLICY "Users can read entities based on role and ownership"
    ON entities FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role = 'admin'
      )
      OR
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE entity_id = entities.id
      )
      OR
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role = 'analyst' AND entity_type = entities.entity_type
      )
    );
  `,

  entityWritePolicy: `
    CREATE POLICY "Users can update their own entities or admins can update all"
    ON entities FOR UPDATE
    USING (
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role = 'admin'
      )
      OR
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE entity_id = entities.id
      )
    );
  `,

  // Assessment policies
  assessmentReadPolicy: `
    CREATE POLICY "Users can read assessments based on role and entity access"
    ON assessments FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role IN ('admin', 'analyst')
      )
      OR
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE entity_id = assessments.entity_id
      )
    );
  `,

  assessmentCreatePolicy: `
    CREATE POLICY "Only analysts and admins can create assessments"
    ON assessments FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role IN ('admin', 'analyst')
      )
    );
  `,
};