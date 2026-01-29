
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '../../types';
import { Bell, Trash2, CreditCard, DollarSign, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Inscrição Realtime otimizada: Escutamos mudanças na tabela
    // O RLS do banco já garante que só recebamos o que é nosso
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications'
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Filtro extra de segurança no cliente
          if (newNotif.user_id === user.id) {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.divvy_id) {
      router.push(`/divvy/${notif.divvy_id}`);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'expense': return <DollarSign size={16} className="text-red-500" />;
      case 'settlement': return <CreditCard size={16} className="text-green-500" />;
      case 'invite': return <Info size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-700 z-[100] overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-gray-50 dark:border-dark-700 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold">
                Ler todas
              </button>
            )}
          </div>
          
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm italic">
                Sua caixa está vazia.
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 cursor-pointer flex gap-3 transition-colors ${!notif.is_read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
                >
                  <div className={`mt-1 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-white dark:bg-dark-800 shadow-sm' : 'bg-gray-100 dark:bg-dark-900'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notif.is_read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mt-1">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 font-medium">
                       {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
