import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from("notes").select();
      setNotes(data);
    };
    fetchNotes();
  }, []);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
};