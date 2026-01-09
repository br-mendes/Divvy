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
    
    if (!name.trim()) {
      toast.error('O nome do grupo é obrigatório');
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Create Divvy
      const { data: divvy, error } = await supabase.from('divvies').insert({
        name,
        description,
        type,
        creator_id: user.id,
        is_archived: false
      }).select().single();

      if (error) {
        console.error('Erro ao criar divvy:', error);
        throw new Error(`Erro ao criar grupo: ${error.message}`);
      }

      // 2. Add creator as admin member
      // Try to insert member, but handle cases where trigger might have already done it
      if (divvy) {
        const { error: memberError } = await supabase.from('divvy_members').insert({
          divvy_id: divvy.id,
          user_id: user.id,
          email: user.email || '',
          role: 'admin',
        });

        if (memberError) {
          // If error is NOT duplicate key, we log it. 
          // Duplicate key means user was likely added by a DB trigger, which is fine.
          if (!memberError.message?.toLowerCase().includes('duplicate')) {
             console.warn('Aviso ao adicionar membro:', memberError);
          }
        }
      }

      setName('');
      setDescription('');
      setType('trip');
      toast.success('Divvy criado com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar Divvy');
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
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