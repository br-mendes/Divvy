
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, Users, Megaphone, Activity, MessageSquare, 
  ExternalLink, Search, Trash2, LayoutDashboard, CheckCircle, Mail 
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'tickets' | 'broadcast';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State Global
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Data States
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Filter States
  const [userSearch, setUserSearch] = useState('');

  // Broadcast Modal State
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'active' | 'inactive30'>('all');
  const [sending, setSending] = useState(false);

  // Security Check
  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'falecomdivvy@gmail.com') {
        router.push('/');
      } else {
        // Carrega dados iniciais baseados na aba
        fetchData(activeTab);
      }
    }
  }, [user, loading, activeTab, router]);

  const fetchData = useCallback(async (tab: AdminTab) => {
    setLoadingData(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/admin/stats');
        if (res.ok) setStats(await res.json());
      } 
      else if (tab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.ok) setUsersList(await res.json());
      }
      else if (tab === 'tickets') {
        const { data, error } = await supabase
          .from('supporttickets')
          .select('*')
          .order('createdat', { ascending: false });
        if (!error && data) setTickets(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target }),
      });

      if (!res.ok) throw new Error('Erro ao enviar broadcast');

      toast.success('Mensagem enviada com sucesso!');
      setBroadcastModal(false);
      setTitle('');
      setBody('');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async (id: string) => {
    if(!confirm("Marcar este ticket como resolvido e excluir?")) return;
    try {
        const res = await fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Falha ao resolver");
        
        toast.success("Ticket resolvido");
        setTickets(tickets.filter(t => t.id !== id));
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.fullname && u.fullname.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (loading || !user || user.email !== 'falecomdivvy@gmail.com') {
     return <div className="min-h-screen flex items-center justify-center text-gray-500">Acesso restrito</div>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-600 p-3 rounded-xl shadow-lg shadow-brand-500/30">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Controle total do sistema Divvy</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-dark-900 py-2 px-4 rounded-full border border-gray-200 dark:border-dark-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sistema Operacional
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide border-b border-gray-200 dark:border-dark-800">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-dark-900 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <LayoutDashboard size={18} /> Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'users' ? 'bg-white dark:bg-dark-900 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Users size={18} /> Usuários
                </button>
                <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'tickets' ? 'bg-white dark:bg-dark-900 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <MessageSquare size={18} /> Tickets {tickets.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tickets.length}</span>}
                </button>
                <button 
                    onClick={() => setActiveTab('broadcast')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white dark:bg-dark-900 text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <Megaphone size={18} /> Broadcast
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="animate-fade-in-up">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Usuários Totais</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : stats?.totalUsers}</p>
                            </div>
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between group">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Totais</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : stats?.totalDivvies}</p>
                            </div>
                            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity size={32} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between group">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Ativos</p>
                                <p className="text-4xl font-black text-green-600 dark:text-green-400 mt-2">{loadingData ? '...' : stats?.activeGroups}</p>
                            </div>
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity size={32} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USERS TAB */}
                {activeTab === 'users' && (
                    <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h2>
                            <div className="relative w-full sm:w-64">
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome ou email..." 
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Cadastro</th>
                                        <th className="px-6 py-4">Último Login</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                    {loadingData ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando usuários...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                                                        {u.fullname?.charAt(0) || u.email.charAt(0)}
                                                    </div>
                                                    {u.fullname || 'Sem nome'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(u.createdat).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Nunca'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Ativo
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. TICKETS TAB */}
                {activeTab === 'tickets' && (
                    <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tickets de Suporte</h2>
                        
                        <div className="grid gap-4">
                            {loadingData ? (
                                <p className="text-gray-500 text-center py-10">Carregando tickets...</p>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 dark:bg-dark-800 rounded-xl border border-dashed border-gray-200 dark:border-dark-700">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                    <p className="text-gray-900 dark:text-white font-medium">Tudo limpo!</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum ticket pendente.</p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div key={ticket.id} className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-200 dark:border-dark-700 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{ticket.subject}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <span className="bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded text-xs font-mono">{new Date(ticket.createdat).toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {ticket.email}</span>
                                                    {ticket.name && <span>• {ticket.name}</span>}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleResolveTicket(ticket.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent hover:border-green-200"
                                                title="Marcar como resolvido"
                                            >
                                                <CheckCircle size={18} /> Resolver
                                            </button>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg text-gray-700 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-dark-700">
                                            {ticket.message}
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <a 
                                                href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}&body=%0A%0AEm resposta a: "${ticket.message.substring(0, 50)}..."`}
                                                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm font-bold flex items-center gap-1"
                                            >
                                                <ExternalLink size={14} /> Responder por Email
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 4. BROADCAST TAB */}
                {activeTab === 'broadcast' && (
                    <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
                            <Megaphone size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enviar Mensagem Global</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                            Envie notificações importantes para todos os usuários do sistema. A mensagem aparecerá no topo do dashboard deles.
                        </p>
                        <Button size="lg" onClick={() => setBroadcastModal(true)} className="px-8 shadow-xl shadow-brand-500/20">
                            Criar Nova Mensagem
                        </Button>
                    </div>
                )}
            </div>

            {/* Broadcast Modal */}
            <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Enviar Broadcast">
                <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Público Alvo</label>
                        <select 
                            value={target} 
                            onChange={e => setTarget(e.target.value as any)}
                            className="w-full rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2 text-gray-900 dark:text-white"
                        >
                            <option value="all">Todos os usuários</option>
                            <option value="active">Ativos (últimos 30 dias)</option>
                            <option value="inactive30">Inativos (+30 dias)</option>
                        </select>
                    </div>
                    <Input label="Título da Mensagem" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Manutenção Programada" />
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Conteúdo</label>
                        <textarea 
                            value={body} 
                            onChange={e => setBody(e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2 h-32 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            required 
                            placeholder="Digite sua mensagem aqui..."
                        />
                    </div>
                    <Button fullWidth type="submit" isLoading={sending}>Enviar Transmissão</Button>
                </form>
            </Modal>
        </div>
      </div>
    </ProtectedRoute>
  );
}
