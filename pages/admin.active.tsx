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
  ExternalLink, Search, Trash2, LayoutDashboard, CheckCircle, Mail,
  Layers, Ban, Lock, Loader2, Calendar, Clock, Check
} from 'lucide-react';
import { BroadcastMessage } from '../types';

type AdminTab = 'overview' | 'users' | 'groups' | 'tickets' | 'broadcast';

export default function AdminPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  
  // State Global
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  
  // Data States
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [broadcastsList, setBroadcastsList] = useState<BroadcastMessage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Filter States
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  // Broadcast Modal State
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'active' | 'inactive30'>('all');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [sending, setSending] = useState(false);

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  }, [session]);

  const fetchData = useCallback(async (tab: AdminTab) => {
    if (!session?.access_token) return;
    
    setLoadingData(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/admin/stats', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar estatísticas');
        setStats(await res.json());
      } 
      else if (tab === 'users') {
        const res = await fetch('/api/admin/users', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar usuários');
        setUsersList(await res.json());
      }
      else if (tab === 'groups') {
        const res = await fetch('/api/admin/groups', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar grupos');
        setGroupsList(await res.json());
      }
      else if (tab === 'tickets') {
        const { data, error } = await supabase
          .from('supporttickets')
          .select('*')
          .order('createdat', { ascending: false });
        
        if (error) throw error;
        setTickets(data || []);
      }
      else if (tab === 'broadcast') {
        const res = await fetch('/api/admin/broadcasts/list', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar mensagens');
        setBroadcastsList(await res.json());
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao carregar dados");
    } finally {
      setLoadingData(false);
    }
  }, [session, getHeaders]);

  // Security Check
  useEffect(() => {
    if (!loading) {
      const checkAdmin = async () => {
        if (!user) {
            router.push('/');
            return;
        }

        // Check admin via admin_users (server verified)
        try {
            const res = await fetch('/api/user/me', {
              headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();

            if (res.ok && data?.is_admin) {
              setIsAdmin(true);
            } else {
              toast.error("Acesso negado.");
              router.push('/dashboard');
            }
        } catch (e) {
            console.error(e);
            router.push('/dashboard');
        } finally {
            setCheckingPermission(false);
        }
      };
      
      checkAdmin();
    }
  }, [user, loading, router]);

  // Initial Fetch upon Admin confirmation
  useEffect(() => {
      if(isAdmin && !checkingPermission) {
          fetchData(activeTab);
      }
  }, [activeTab, isAdmin, checkingPermission, fetchData]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload = { 
          title, 
          body, 
          target,
          starts_at: startsAt || new Date().toISOString(),
          ends_at: endsAt || null
      };

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erro ao enviar broadcast');
      }

      toast.success('Mensagem programada/enviada com sucesso!');
      setBroadcastModal(false);
      setTitle('');
      setBody('');
      setStartsAt('');
      setEndsAt('');
      fetchData('broadcast'); // Refresh list
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta mensagem? Ela deixará de aparecer para todos os usuários imediatamente.")) return;
      
      try {
          const res = await fetch(`/api/admin/broadcasts/${id}`, {
              method: 'DELETE',
              headers: getHeaders()
          });
          
          if (!res.ok) throw new Error("Erro ao excluir");
          
          toast.success("Mensagem excluída.");
          setBroadcastsList(broadcastsList.filter(b => b.id !== id));
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const handleResolveTicket = async (id: string) => {
    if(!confirm("Marcar este ticket como resolvido e excluir?")) return;
    try {
        const res = await fetch(`/api/admin/tickets/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error("Falha ao resolver");
        
        toast.success("Ticket resolvido");
        setTickets(tickets.filter(t => t.id !== id));
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const action = newStatus === 'active' ? 'Reativar' : 'Suspender';
      
      if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

      try {
          const res = await fetch(`/api/admin/users/${userId}/status`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ status: newStatus })
          });

          if (!res.ok) throw new Error("Falha ao alterar status");

          setUsersList(usersList.map(u => u.id === userId ? { ...u, status: newStatus } : u));
          toast.success(`Usuário ${newStatus === 'active' ? 'reativado' : 'suspenso'}.`);
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const handleDeleteGroup = async (groupId: string) => {
      const confirmText = prompt("Para confirmar a exclusão deste grupo, digite 'DELETAR':");
      if (confirmText !== 'DELETAR') return;

      try {
          const res = await fetch('/api/admin/groups', {
              method: 'DELETE',
              headers: getHeaders(),
              body: JSON.stringify({ id: groupId })
          });

          if (!res.ok) throw new Error("Falha ao deletar grupo");

          setGroupsList(groupsList.filter(g => g.id !== groupId));
          toast.success("Grupo excluído.");
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const filteredUsers = usersList.filter(u => 
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.fullname || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredGroups = groupsList.filter(g =>
    (g.name || '').toLowerCase().includes(groupSearch.toLowerCase())
  );

  // Helper para status do broadcast
  const getBroadcastStatus = (b: BroadcastMessage) => {
      const now = new Date();
      const start = b.starts_at ? new Date(b.starts_at) : new Date(b.createdat);
      const end = b.ends_at ? new Date(b.ends_at) : null;

      if (end && now > end) return { label: 'Expirado', color: 'bg-red-100 text-red-700' };
      if (now < start) return { label: 'Agendado', color: 'bg-yellow-100 text-yellow-700' };
      return { label: 'Ativo', color: 'bg-green-100 text-green-700' };
  };

  if (loading || checkingPermission) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-950 text-gray-500 gap-4">
            <Loader2 className="animate-spin text-brand-600" size={40} />
            <p>Verificando permissões administrativas...</p>
        </div>
     );
  }

  if (!isAdmin) return null;

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
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-dark-900 py-2 px-4 rounded-full border border-gray-200 dark:border-dark-800 shadow-sm text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Admin Conectado: {user?.email}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide border-b border-gray-200 dark:border-dark-800">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
                    { id: 'users', label: 'Usuários', icon: Users },
                    { id: 'groups', label: 'Grupos', icon: Layers },
                    { id: 'tickets', label: 'Tickets', icon: MessageSquare, count: tickets.length },
                    { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AdminTab)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-dark-900 text-brand-600 border-b-2 border-brand-600' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <tab.icon size={18} /> 
                        {tab.label}
                        {tab.count ? <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tab.count}</span> : null}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="animate-fade-in-up">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Usuários Totais</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : (stats?.totalUsers || 0)}</p>
                            </div>
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between group">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Totais</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{loadingData ? '...' : (stats?.totalDivvies || 0)}</p>
                            </div>
                            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity size={32} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 flex items-center justify-between group">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Grupos Ativos</p>
                                <p className="text-4xl font-black text-green-600 dark:text-green-400 mt-2">{loadingData ? '...' : (stats?.activeGroups || 0)}</p>
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
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
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
                                                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold shrink-0">
                                                        {u.fullname?.charAt(0) || u.email.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div>{u.fullname || 'Sem nome'}</div>
                                                        <div className="text-xs text-gray-400">{u.id}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(u.createdat).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        u.status === 'suspended' 
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                        {u.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleToggleUserStatus(u.id, u.status || 'active')}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            u.status === 'suspended'
                                                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                            : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                        }`}
                                                        title={u.status === 'suspended' ? "Reativar usuário" : "Suspender usuário"}
                                                    >
                                                        {u.status === 'suspended' ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. GROUPS TAB */}
                {activeTab === 'groups' && (
                    <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Grupos</h2>
                            <div className="relative w-full sm:w-64">
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar grupos..." 
                                    value={groupSearch}
                                    onChange={(e) => setGroupSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Nome</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4 text-center">Membros</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                                    {loadingData ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando grupos...</td></tr>
                                    ) : filteredGroups.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum grupo encontrado.</td></tr>
                                    ) : (
                                        filteredGroups.map(g => (
                                            <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {g.name}
                                                    <div className="text-xs text-gray-400">{g.id}</div>
                                                </td>
                                                <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-300">{g.type}</td>
                                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300 font-mono">
                                                    {g.member_count}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {g.isarchived ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">
                                                            <Lock size={10} /> Arquivado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">
                                                            <Check size={10} /> Ativo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteGroup(g.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir Grupo"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. TICKETS TAB */}
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

                {/* 5. BROADCAST TAB */}
                {activeTab === 'broadcast' && (
                    <div className="space-y-8">
                        {/* Hero Section / Action */}
                        <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
                                <Megaphone size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enviar Mensagem Global</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                                Envie notificações importantes para todos os usuários do sistema. Você pode agendar o início e o fim da exibição.
                            </p>
                            <Button size="lg" onClick={() => setBroadcastModal(true)} className="px-8 shadow-xl shadow-brand-500/20">
                                Criar Nova Mensagem
                            </Button>
                        </div>

                        {/* List of Broadcasts */}
                        <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-dark-800">
                                <h3 className="font-bold text-gray-900 dark:text-white">Histórico de Mensagens</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-dark-800">
                                {loadingData ? (
                                    <p className="p-8 text-center text-gray-500">Carregando...</p>
                                ) : broadcastsList.length === 0 ? (
                                    <p className="p-8 text-center text-gray-500">Nenhuma mensagem enviada.</p>
                                ) : (
                                    broadcastsList.map(b => {
                                        const status = getBroadcastStatus(b);
                                        return (
                                            <div key={b.id} className="p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{new Date(b.createdat).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{b.title}</h4>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{b.body}</p>
                                                    
                                                    {/* Dates Info */}
                                                    <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} /> 
                                                            Início: {b.starts_at ? new Date(b.starts_at).toLocaleString() : 'Imediato'}
                                                        </div>
                                                        {b.ends_at && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={12} /> 
                                                                Fim: {new Date(b.ends_at).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteBroadcast(b.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir Mensagem"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
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

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-800 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                        <div>
                            <label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Agendar Início</label>
                            <input 
                                type="datetime-local" 
                                className="w-full rounded border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 px-2 py-1 text-sm text-gray-900 dark:text-white"
                                value={startsAt}
                                onChange={e => setStartsAt(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para enviar agora.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-gray-500 uppercase">Agendar Fim (Expiração)</label>
                            <input 
                                type="datetime-local" 
                                className="w-full rounded border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 px-2 py-1 text-sm text-gray-900 dark:text-white"
                                value={endsAt}
                                onChange={e => setEndsAt(e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para não expirar.</p>
                        </div>
                    </div>

                    <Button fullWidth type="submit" isLoading={sending}>
                        {startsAt ? 'Agendar Mensagem' : 'Enviar Agora'}
                    </Button>
                </form>
            </Modal>
        </div>
      </div>
    </ProtectedRoute>
  );
}
