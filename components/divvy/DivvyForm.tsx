
"use client";

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
  { value: 'other', label: '💰 Geral' }, // Alterado de 'general' para 'other' para passar na validação do banco
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
      // Mapeia legacy 'general' para 'other' se existir
      setType((initialData.type as string) === 'general' ? 'other' : initialData.type);
      setStartDate(initialData.createdat ? initialData.createdat.split('T')[0] : '');
      setEndDate(initialData.endedat ? initialData.endedat.split('T')[0] : '');
    }
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        name,
        description,
        type,
        endedat: endDate ? new Date(endDate).toISOString() : null,
      };

      if (initialData) {
        const { error } = await supabase.from('divvies').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Grupo atualizado!');
      } else {
        // 1. Criar o grupo
        const { data: newDivvy, error: divvyError } = await supabase.from('divvies').insert({
          ...payload,
          creatorid: user.id,
          isarchived: false
        }).select().single();

        if (divvyError) throw divvyError;

        // 2. CRÍTICO: Adicionar o criador como membro
        if (newDivvy) {
          const { error: memberError } = await supabase.from('divvymembers').insert({
            divvyid: newDivvy.id,
            userid: user.id,
            email: user.email,
            role: 'admin'
          });
          if (memberError) console.error("Erro ao adicionar criador como membro:", memberError);
        }

        toast.success('Grupo criado com sucesso!');
      }
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {initialData ? 'Editar Grupo' : 'Informações do Novo Grupo'}
      </h3>
      <Input
        label="Nome do Grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Aluguel Mensal"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {divvyTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Data Início (Criação)" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" label="Data Fim" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={loading} fullWidth>
          {initialData ? 'Salvar Alterações' : 'Criar Grupo'}
        </Button>
      </div>
    </form>
  );
}
