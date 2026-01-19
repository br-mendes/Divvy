
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { ShieldCheck, Users, Megaphone, Activity } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [target, setTarget] = useState<'all' | 'active' | 'inactive30'>('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'falecomdivvy@gmail.com') {
        router.push('/');
        return;
      }
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      // Fetch User Count
      const { count: userCount } = await supabase.from('userprofiles').select('*', { count: 'exact', head: true });
      
      // Fetch Divvy Count
      const { count: divvyCount } = await supabase.from('divvies').select('*', { count: 'exact', head: true });

      // Fetch Active Divvies (not archived)
      const { count: activeDivvyCount } = await supabase.from('divvies').select('*', { count: 'exact', head: true }).eq('isarchived', false);

      setStats({
        totalUsers: userCount || 0,
        totalDivvies: divvyCount || 0,
        activeDivvies: activeDivvyCount || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.from('broadcastmessages').insert({
        title,
        body,
        target
      });
      if (error) throw error;
      toast.success('Mensagem enviada com sucesso!');
      setBroadcastModal(false);
      setTitle('');
      setBody('');
      setCategoryId('');
    } catch (e: any) {
      toast.error('Erro ao enviar broadcast: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !user || user.email !== 'falecomdivvy@gmail.com') {
     return <div className="min-h-screen flex items-center justify-center">Acesso restrito</div>;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Usuários Totais</p>
                 <p className="text-4xl font-black text-gray-900 mt-2">{loadingStats ? '...' : stats?.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                 <Users size={24} />
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Grupos Totais</p>
                 <p className="text-4xl font-black text-gray-900 mt-2">{loadingStats ? '...' : stats?.totalDivvies}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                 <Activity size={24} />
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Grupos Ativos</p>
                 <p className="text-4xl font-black text-green-600 mt-2">{loadingStats ? '...' : stats?.activeDivvies}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                 <Activity size={24} />
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Megaphone size={20} /> Ações Globais
           </h2>
           <div className="flex gap-4">
              <Button onClick={() => setBroadcastModal(true)}>Enviar Broadcast</Button>
           </div>
        </div>

        {/* Broadcast Modal */}
        <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Enviar Broadcast">
           <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium mb-1">Alvo</label>
                 <select 
                    value={target} 
                    onChange={e => setTarget(e.target.value as any)}
                    className="w-full rounded-lg border px-3 py-2"
                 >
                    <option value="all">Todos os usuários</option>
                    <option value="active">Ativos (30 dias)</option>
                    <option value="inactive30">Inativos (+30 dias)</option>
                 </select>
              </div>
              <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} required />
              <div>
                 <label className="block text-sm font-medium mb-1">Mensagem</label>
                 <textarea 
                    value={body} 
                    onChange={e => setBody(e.target.value)} 
                    className="w-full rounded-lg border px-3 py-2 h-32"
                    required 
                 />
              </div>
              <Button fullWidth type="submit" isLoading={sending}>Enviar</Button>
           </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
