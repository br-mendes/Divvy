
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import DivvyForm from './DivvyForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';
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
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isCreator = user?.id === divvy.creator_id;

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo? Todas as despesas serão apagadas permanentemente.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('divvies').delete().eq('id', divvy.id);
      if (error) throw error;
      
      toast.success('Grupo excluído com sucesso.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao excluir grupo: ' + err.message);
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-8">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{typeEmoji[divvy.type] || '💰'}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {divvy.name}
                  {divvy.is_archived && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-normal">
                      Arquivado
                    </span>
                  )}
                </h1>
                <div className="text-sm text-gray-500">
                  {typeLabel[divvy.type]} •{' '}
                  {new Date(divvy.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50 border-red-200"
                    onClick={handleDelete}
                    isLoading={deleteLoading}
                    title="Excluir Grupo"
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {divvy.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{divvy.description}</p>
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
