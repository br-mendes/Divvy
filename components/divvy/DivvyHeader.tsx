
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import DivvyForm from './DivvyForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Pencil, Trash2, Archive, RotateCcw, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface DivvyHeaderProps {
  divvy: Divvy;
  onUpdate?: () => void;
}

const typeEmoji: Record<string, string> = {
  trip: '✈️',
  roommate: '🏠',
  event: '🎉',
  general: '💰',
};

const typeLabel: Record<string, string> = {
  trip: 'Viagem',
  roommate: 'República',
  event: 'Evento',
  general: 'Geral',
};

export default function DivvyHeader({ divvy, onUpdate }: DivvyHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Proteção máxima contra objeto nulo ou indefinido
  if (!divvy || !divvy.id) return null;

  const isCreator = user?.id === divvy.creator_id;

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo? Todas as despesas serão apagadas permanentemente.')) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('divvies').delete().eq('id', divvy.id);
      if (error) throw error;
      
      toast.success('Grupo excluído com sucesso.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao excluir grupo: ' + err.message);
      setActionLoading(false);
    }
  };

  const handleToggleArchive = async () => {
     const currentStatus = !!divvy.is_archived;
     const newStatus = !currentStatus;
     const action = newStatus ? 'arquivar' : 'desarquivar';
     
     if (!window.confirm(`Deseja realmente ${action} este grupo?`)) return;

     setActionLoading(true);
     try {
       const { error } = await supabase
        .from('divvies')
        .update({ is_archived: newStatus })
        .eq('id', divvy.id);
       
       if (error) throw error;
       toast.success(`Grupo ${newStatus ? 'arquivado' : 'ativado'} com sucesso!`);
       if (onUpdate) onUpdate();
     } catch (err: any) {
       toast.error(`Erro ao ${action}: ` + err.message);
     } finally {
       setActionLoading(false);
     }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (onUpdate) onUpdate();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const rawDate = String(dateStr).split('T')[0];
      const [year, month, day] = rawDate.split('-');
      if (!year || !month || !day) return null;
      return `${day}/${month}/${year}`;
    } catch (e) {
      return null;
    }
  };

  return (
    <>
      <div className={`border-b -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-8 transition-colors duration-200 
          ${divvy.is_archived 
            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-dark-700'
          }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl filter grayscale-[.5]">{typeEmoji[divvy.type] || '💰'}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {divvy.name}
                  {divvy.is_archived && (
                    <span className="text-xs bg-gray-600 dark:bg-gray-700 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Archive size={10} /> Arquivado
                    </span>
                  )}
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2 mt-1">
                  <span>{typeLabel[divvy.type]}</span>
                  <span>•</span>
                  <span>Criado em {new Date(divvy.created_at).toLocaleDateString('pt-BR')}</span>
                  
                  {(divvy.start_date || divvy.end_date) && (
                     <>
                       <span className="hidden sm:inline">•</span>
                       <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          <Calendar size={12} />
                          {formatDate(divvy.start_date) || '...'} 
                          {' → '} 
                          {formatDate(divvy.end_date) || '...'}
                       </span>
                     </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">← Voltar</Button>
              </Link>
              
              {isCreator && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditModalOpen(true)}
                    title="Editar Grupo"
                    disabled={divvy.is_archived}
                  >
                    <Pencil size={16} />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToggleArchive}
                    title={divvy.is_archived ? "Desarquivar" : "Arquivar"}
                    isLoading={actionLoading}
                    className={divvy.is_archived ? "text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800" : "text-gray-600 dark:text-gray-400"}
                  >
                    {divvy.is_archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                    onClick={handleDelete}
                    isLoading={actionLoading}
                    title="Excluir Grupo"
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {divvy.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">{divvy.description}</p>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Grupo"
      >
        <DivvyForm 
          onSuccess={handleEditSuccess} 
          initialData={divvy} 
        />
      </Modal>
    </>
  );
}
