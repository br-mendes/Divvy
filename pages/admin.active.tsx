
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { ShieldCheck, Users, Megaphone, Activity, MessageSquare, ExternalLink } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'active' | 'inactive30'>('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'falecomdivvy@gmail.com') {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Stats via API
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const statsData = await res.json();
        setStats(statsData);
      }

      // 2. Fetch Support Tickets via Supabase Client (RLS protected)
      const { data: ticketData, error: ticketError } = await supabase
        .from('supporttickets')
        .select('*')
        .order('createdat', { ascending: false })
        .limit(50);
      
      if (ticketError) console.error("Error fetching tickets", ticketError);
      if (ticketData) setTickets(ticketData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
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
    } catch (e: any) {
      toast.error('Erro ao enviar broadcast: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !user || user.email !== 'falecomdivvy@gmail.com') {
     return <div className="min-h-screen flex items-center justify-center text-gray-500">Acesso restrito</div>;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Usuários Totais</p>
                 <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : stats?.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                 <Users size={24} />
              </div>
           </div>
           
           <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Totais</p>
                 <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : stats?.totalDivvies}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                 <Activity size={24} />
              </div>
           </div>

           <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between">
              <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Ativos</p>
                 <p className="text-4xl font-black text-green-600 dark:text-green-400 mt-2">{loadingData ? '...' : stats?.activeDivvies}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                 <Activity size={24} />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Actions */}
            <div className="bg-white dark:bg-dark-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 h-fit">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Megaphone size={20} /> Ações Globais
                </h2>
                <div className="flex gap-4">
                    <Button onClick={() => setBroadcastModal(true)}>Enviar Broadcast</Button>
                </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white dark:bg-dark-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <MessageSquare size={20} /> Tickets de Suporte
                </h2>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {loadingData ? (
                        <p className="text-gray-500">Carregando...</p>
                    ) : tickets.length === 0 ? (
                        <p className="text-gray-500">Nenhum ticket encontrado.</p>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="p-4 border border-gray-100 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ticket.subject}</h3>
                                    <span className="text-xs text-gray-400">{new Date(ticket.createdat).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{ticket.message}</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">{ticket.email}</span>
                                    <a href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                                        Responder <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Broadcast Modal */}
        <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Enviar Broadcast">
           <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Alvo</label>
                 <select 
                    value={target} 
                    onChange={e => setTarget(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2 text-gray-900 dark:text-white"
                 >
                    <option value="all">Todos os usuários</option>
                    <option value="active">Ativos (30 dias)</option>
                    <option value="inactive30">Inativos (+30 dias)</option>
                 </select>
              </div>
              <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} required />
              <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mensagem</label>
                 <textarea 
                    value={body} 
                    onChange={e => setBody(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2 h-32 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
