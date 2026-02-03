'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { toast } from 'react-hot-toast';

export default function NewDivvyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      toast.error('Nome do grupo é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('divvies')
        .insert({
          name,
          description,
          creator_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await supabase.from('divvy_members').insert({
          divvy_id: data.id,
          user_id: user?.id,
          role: 'admin',
        });
        toast.success('Grupo criado com sucesso!');
        router.push(`/dashboard/divvies/${data.id}`);
      }
    } catch (err) {
      toast.error('Erro ao criar grupo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar novo Divvy</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do grupo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Viagem para o Rio"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Viagem de 5 dias em janeiro"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" size="lg" loading={loading}>
              Criar Divvy
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
