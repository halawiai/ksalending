'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer' | 'entity_user';
  entity_id?: string;
  entity_type?: 'individual' | 'company' | 'institution';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export function useUser() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile data
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile', user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    return profile.permissions.includes(permission) || profile.role === 'admin';
  };

  // Check if user can access entity type
  const canAccessEntityType = (entityType: 'individual' | 'company' | 'institution'): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.entity_type === entityType;
  };

  return {
    user,
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    isAuthenticated,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    hasPermission,
    canAccessEntityType,
  };
}

// User management utilities
export const userUtils = {
  getDisplayName: (user: User | null, profile: UserProfile | null): string => {
    if (profile?.entity_type === 'individual') {
      return user?.user_metadata?.full_name || user?.email || 'User';
    }
    return user?.user_metadata?.company_name || user?.email || 'User';
  },

  getRoleDisplayName: (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      analyst: 'Credit Analyst',
      viewer: 'Viewer',
      entity_user: 'Entity User',
    };
    return roleMap[role] || role;
  },

  getEntityTypeDisplayName: (entityType: string): string => {
    const typeMap: Record<string, string> = {
      individual: 'Individual',
      company: 'Company',
      institution: 'Institution',
    };
    return typeMap[entityType] || entityType;
  },
};