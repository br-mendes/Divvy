"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Users, Megaphone, Activity, MessageSquare,
  Search, Trash2, LayoutDashboard, Mail,
  Layers, Ban, Lock, Loader2, Calendar, Clock, Check,
} from 'lucide-react';
import { BroadcastMessage } from '@/types';

type AdminTab = 'overview' | 'users' | 'groups' | 'tickets' | 'broadcast';

export default function AdminPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [broadcastsList, setBroadcastsList] = useState<BroadcastMessage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

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
      Authorization: `Bearer ${session?.access_token}`,
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
      } else if (tab === 'users') {
        const res = await fetch('/api/admin/users', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar usuários');
        setUsersList(await res.json());
      } else if (tab === 'groups') {
        const res = await fetch('/api/admin/groups', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar grupos');
        setGroupsList(await res.json());
      } else if (tab === 'tickets') {
        const { data, error } = await supabase
          .from('supporttickets')
          .select('*')
          .order('createdat', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } else if (tab === 'broadcast') {
        const res = await fetch('/api/admin/broadcasts/list', { headers: getHeaders() });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar mensagens');
        setBroadcastsList(await res.json());
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  }, [session, getHeaders]);

  useEffect(() => {
    if (!loading) {
      const checkAdmin = async () => {
        if (!user) {
          router.push('/');
          return;
        }

        if (user.email === 'falecomdivvy@gmail.com') {
          setIsAdmin(true);
          setCheckingPermission(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .from('userprofiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single();

          if (!error && data?.is_super_admin) {
            setIsAdmin(true);
          } else {
            toast.error('Acesso negado.');
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

  useEffect(() => {
    if (isAdmin && !checkingPermission) {
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
        ends_at: endsAt || null,
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
      fetchData('broadcast');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem? Ela deixará de aparecer para todos os usuários imediatamente.')) return;

    try {
      const res = await fetch(`/api/admin/broadcasts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) throw new Error('Erro ao excluir');

      toast.success('Mensagem excluída.');
      setBroadcastsList(broadcastsList.filter(b => b.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResolveTicket = async (id: string) => {
    if (!confirm('Marcar este ticket como resolvido e excluir?')) return;
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Falha ao resolver');

      toast.success('Ticket resolvido');
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
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao alterar status');

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
        body: JSON.stringify({ id: groupId }),
      });

      if (!res.ok) throw new Error('Falha ao deletar grupo');

      setGroupsList(groupsList.filter(g => g.id !== groupId));
      toast.success('Grupo excluído.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredUsers = usersList.filter(u =>
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.fullname || '').toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredGroups = groupsList.filter(g =>
    (g.name || '').toLowerCase().includes(groupSearch.toLowerCase()),
  );

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

          <div className="animate-fade-in-up">
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
                    <tbody>
                      {loadingData ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Carregando...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
                      ) : (
                        filteredUsers.map(userItem => (
                          <tr key={userItem.id} className="border-t border-gray-100 dark:border-dark-800">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden text-gray-500">
                                  {userItem.avatarurl ? (
                                    <img src={userItem.avatarurl} alt={userItem.fullname} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold">{(userItem.fullname || userItem.email || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{userItem.fullname || userItem.displayname || 'Sem nome'}</p>
                                  <p className="text-xs text-gray-500">{userItem.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{userItem.email}</td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(userItem.createdat).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${userItem.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {userItem.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(userItem.id, userItem.status)}
                                  className={`p-2 rounded-lg ${userItem.status === 'suspended' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                                  title={userItem.status === 'suspended' ? 'Reativar usuário' : 'Suspender usuário'}
                                >
                                  {userItem.status === 'suspended' ? <Check size={16} /> : <Ban size={16} />}
                                </button>
                                {userItem.email && (
                                  <a
                                    href={`mailto:${userItem.email}`}
                                    className="p-2 rounded-lg bg-gray-100 text-gray-600"
                                    title="Enviar email"
                                  >
                                    <Mail size={16} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Grupos</h2>
                  <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome do grupo..."
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
                        <th className="px-6 py-4">Grupo</th>
                        <th className="px-6 py-4">Criador</th>
                        <th className="px-6 py-4">Criado em</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Carregando...</td></tr>
                      ) : filteredGroups.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Nenhum grupo encontrado.</td></tr>
                      ) : (
                        filteredGroups.map(group => (
                          <tr key={group.id} className="border-t border-gray-100 dark:border-dark-800">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 dark:text-white">{group.name}</p>
                              <p className="text-xs text-gray-500">{group.id}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{group.creator_email || group.creatorid}</td>
                            <td className="px-6 py-4 text-gray-500">{new Date(group.createdat).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 rounded-lg bg-red-50 text-red-600"
                                title="Excluir grupo"
                              >
                                <Trash2 size={16} />
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

            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {loadingData ? (
                  <div className="text-center text-gray-400 py-10">Carregando...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">Nenhum ticket aberto.</div>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.message}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ticket.createdat).toLocaleDateString('pt-BR')}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdat).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleResolveTicket(ticket.id)}>
                          <Check size={16} className="mr-2" /> Resolver
                        </Button>
                        <a href={`mailto:${ticket.email}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm">
                          <Mail size={16} /> Responder
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'broadcast' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mensagens Broadcast</h2>
                  <Button onClick={() => setBroadcastModal(true)} className="flex items-center gap-2">
                    <Megaphone size={16} /> Nova Mensagem
                  </Button>
                </div>

                <div className="grid gap-4">
                  {loadingData ? (
                    <div className="text-center text-gray-400 py-10">Carregando...</div>
                  ) : broadcastsList.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">Nenhuma mensagem encontrada.</div>
                  ) : (
                    broadcastsList.map(broadcast => {
                      const status = getBroadcastStatus(broadcast);
                      return (
                        <div key={broadcast.id} className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">{broadcast.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{broadcast.body}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-4">
                                <span className={`px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                                <span>Target: {broadcast.target}</span>
                                <span>Início: {new Date(broadcast.starts_at || broadcast.createdat).toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteBroadcast(broadcast.id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600"
                              title="Excluir mensagem"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Nova Mensagem Broadcast">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Início" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <Input label="Fim" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Público</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as 'all' | 'active' | 'inactive30')}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900"
            >
              <option value="all">Todos</option>
              <option value="active">Usuários ativos</option>
              <option value="inactive30">Inativos há 30 dias</option>
            </select>
          </div>

          <Button type="submit" fullWidth isLoading={sending}>
            Enviar Broadcast
          </Button>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
