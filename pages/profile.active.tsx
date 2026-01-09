import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { User, Camera, RefreshCw } from 'lucide-react';

function ProfileContent() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-32 h-32">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-brand-50"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center border-4 border-brand-50">
                  <User size={48} className="text-brand-400" />
                </div>
              )}
              <button
                type="button"
                onClick={generateRandomAvatar}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-gray-200 shadow-md hover:bg-gray-50 text-gray-600"
                title="Gerar avatar aleatório"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Clique no botão de atualizar para gerar um novo avatar.
            </p>
          </div>

          <div className="grid gap-6">
            <Input
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />

            <Input
              label="Email"
              value={email}
              disabled
              className="opacity-70 bg-gray-50"
              placeholder="seu@email.com"
            />

            <Input
              label="URL do Avatar (Opcional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" isLoading={loading}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
