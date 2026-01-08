import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface DivvyFormProps {
  onSuccess: () => void;
}

const divvyTypes = [
  { value: 'trip', label: '✈️ Viagem' },
  { value: 'roommate', label: '🏠 República' },
  { value: 'couple', label: '💜 Casal' },
  { value: 'event', label: '🎉 Evento' },
  { value: 'other', label: '💰 Outro' },
];

export default function DivvyForm({ onSuccess }: DivvyFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('trip');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Create Divvy
      const { data: divvy, error } = await supabase.from('divvies').insert({
        name,
        description,
        type,
        creator_id: user.id,
      }).select().single();

      if (error) throw error;

      // 2. Add creator as admin member (Ensure creator can access the divvy)
      if (divvy) {
        await supabase.from('divvy_members').insert({
          divvy_id: divvy.id,
          user_id: user.id,
          email: user.email!,
          role: 'admin',
        });
      }

      setName('');
      setDescription('');
      setType('trip');
      onSuccess();
    } catch (err: any) {
      toast.error('Erro ao criar Divvy');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar novo Divvy</h3>
      <Input
        id="divvy-name"
        label="Nome"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        placeholder="Ex: Viagem Rio 2026"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Tipo
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
        >
          {divvyTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Descrição (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o propósito desta despesa compartilhada"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!name.trim()}
          isLoading={loading}
        >
          Criar Divvy
        </Button>
      </div>
    </form>
  );
}