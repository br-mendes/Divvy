
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { User, Upload, Check } from 'lucide-react';

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Simba',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Coco',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bear',
];

function ProfileContent() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '');
      setNickname(user.user_metadata?.nickname || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualiza auth.users metadata. O Trigger no SQL vai replicar para a tabela profiles.
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          nickname: nickname,
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

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      toast.success('Imagem carregada!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleUpdateProfile} className="space-y-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 group">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-brand-50 shadow-sm"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center border-4 border-brand-50">
                  <User size={48} className="text-brand-400" />
                </div>
              )}
              
              {/* Botão de Upload Sobreposto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full border-2 border-white shadow-md hover:bg-brand-700 transition-colors"
                title="Carregar foto"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload size={16} />
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Predefined Avatars */}
            <div className="w-full">
               <p className="text-sm text-gray-500 mb-3 text-center">Ou escolha um avatar:</p>
               <div className="flex flex-wrap justify-center gap-3">
                 {PREDEFINED_AVATARS.map((url) => (
                   <button
                     key={url}
                     type="button"
                     onClick={() => handleAvatarSelect(url)}
                     className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-brand-600 scale-110 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-300'}`}
                   >
                     <img src={url} alt="Opção de avatar" className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-gray-100 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Apelido (Principal)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Como quer ser chamado?"
                helperText="Se preenchido, será seu nome principal no app."
              />
              <Input
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <Input
              label="Email"
              value={email}
              disabled
              className="opacity-70 bg-gray-50"
              placeholder="seu@email.com"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={loading} className="flex items-center gap-2">
              <Check size={18} />
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
