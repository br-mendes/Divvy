
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Camera, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
        const { data: profile, error } = await supabase
        .from('userprofiles')
        .select('fullname, displayname, avatarurl')
        .eq('id', user.id)
        .single();

        if (profile) {
        setName(profile.displayname || profile.fullname || user.user_metadata?.full_name || '');
        setAvatarUrl(profile.avatarurl || user.user_metadata?.avatar_url || null);
        } else {
        setName(user.user_metadata?.full_name || '');
        }
        setEmail(user.email || '');
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAvatarLoading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (!user) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('userprofiles')
        .update({ 
            avatarurl: publicUrl,
            updatedat: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
      if (!user || !confirm("Remover foto de perfil?")) return;
      setAvatarLoading(true);
      try {
          const { error } = await supabase.from('userprofiles').update({ avatarurl: null }).eq('id', user.id);
          if (error) throw error;
          setAvatarUrl(null);
          toast.success("Foto removida.");
      } catch (error: any) {
          toast.error("Erro: " + error.message);
      } finally {
          setAvatarLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('userprofiles')
        .upsert({
          id: user.id,
          email: user.email,
          fullname: name,
          displayname: name,
          updatedat: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User size={24} className="text-brand-600" />
        Dados Pessoais
      </h2>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-dark-800 shadow-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
             {avatarLoading ? (
                <Loader2 className="animate-spin text-brand-500 w-10 h-10" />
             ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                <span className="text-4xl text-brand-300 font-bold">
                   {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </span>
             )}
          </div>
          
          <div className="absolute bottom-0 right-0 flex gap-2">
              <label className="p-2 bg-brand-600 text-white rounded-full cursor-pointer hover:bg-brand-700 shadow-md transition-all hover:scale-105" title="Alterar foto">
                  <Camera size={18} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={avatarLoading}
                  />
              </label>
              {avatarUrl && (
                 <button 
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={avatarLoading}
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-md transition-all hover:scale-105"
                    title="Remover foto"
                 >
                    <Trash2 size={18} />
                 </button>
              )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Clique na câmera para alterar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
              <Input
                label="Nome ou Apelido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
          </div>
          <div>
            <Input
              label="Email"
              value={email}
              disabled
              className="bg-gray-50 dark:bg-dark-800"
            />
          </div>
        </div>
        <Button type="submit" isLoading={loading}>
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
}
