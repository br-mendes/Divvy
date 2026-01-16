import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Divvy } from '@/types';

export function useDivvies(userId: string | undefined) {
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('divvies')
          .select('*, members:divvy_members(*, user:user_profiles(*))')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setDivvies(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar'));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel('divvies-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divvies' }, () => {
        fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { divvies, loading, error };
}
