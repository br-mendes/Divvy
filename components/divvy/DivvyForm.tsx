
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Divvy } from '../../types';
import toast from 'react-hot-toast';

interface DivvyFormProps {
  onSuccess: () => void;
  initialData?: Divvy;
}

const divvyTypes = [
  { value: 'trip', label: '✈️ Viagem' },
  { value: 'roommate', label: '🏠 República' },
  { value: 'event', label: '🎉 Evento' },
  { value: 'general', label: '💰 Geral' },
];

export default function DivvyForm({ onSuccess, initialData }: DivvyFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('trip');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setType(initialData.type);
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
    }
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('O nome do grupo é obrigatório');
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        name,
        description,
        type,
        start_date: startDate || null,
        end_date: endDate || null,
      };

      if (initialData) {
        // UPDATE Existing Divvy
        const { error } = await supabase
          .from('divvies')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Divvy atualizado com sucesso!');
      } else {
        // CREATE New Divvy
        const { error } = await supabase.from('divvies').insert({
          ...payload,
          creator_id: user.id
        });

        if (error) {
           console.error('Erro ao criar divvy:', error);
           if (error.code === '42501') {
              throw new Error('Permissão negada. Verifique suas credenciais.');
           }
           throw new Error(`Erro ao criar grupo: ${error.message}`);
        }
        toast.success('Divvy criado com sucesso!');
      }

      if (!initialData) {
        setName('');
        setDescription('');
        setType('trip');
        setStartDate('');
        setEndDate('');
      }
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar Divvy');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {initialData ? 'Editar Divvy' : 'Criar novo Divvy'}
      </h3>
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Data Inicial (Opcional)"
          value={startDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          label="Data Final (Opcional)"
          value={endDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
        />
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
          {initialData ? 'Salvar Alterações' : 'Criar Divvy'}
        </Button>
      </div>
    </form>
  );
}
