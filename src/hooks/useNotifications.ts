import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        const newNotif = payload.new as any;
        if (newNotif?.title) {
          toast.info(newNotif.title, {
            description: newNotif.message,
            duration: 6000,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
}

export function useInfiniteNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-notifications-infinite')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications-infinite', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useInfiniteQuery({
    queryKey: ['notifications-infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data as Notification[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread-count', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id?: string) => {
      if (id) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } else {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('Notificación eliminada');
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('Todas las notificaciones eliminadas');
    },
  });
}
