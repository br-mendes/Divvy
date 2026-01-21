
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { DollarSign, CreditCard, Info, Bell } from 'lucide-react';
import Link from 'next/link';
import Skeleton from '../ui/Skeleton';

export default function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setActivities(data);
      }
      setLoading(false);
    };

    fetchActivities();
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'expense': return <DollarSign size={16} className="text-red-500" />;
      case 'settlement': return <CreditCard size={16} className="text-green-500" />;
      case 'invite': return <Info size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  if (loading) return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm overflow-hidden p-4 space-y-4">
        <Skeleton className="h-5 w-40 mb-4" />
        {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
  );

  if (activities.length === 0) return (
    <div className="p-6 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-800 text-center shadow-sm">
        <div className="w-12 h-12 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell size={20} className="text-gray-400" />
        </div>
        <p className="text-gray-900 dark:text-white font-medium text-sm">Tudo tranquilo</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Nenhuma atividade recente para mostrar.</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
         <h3 className="font-bold text-gray-900 dark:text-white text-sm">Últimas Atualizações</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-dark-800">
        {activities.map(activity => (
          <Link href={activity.divvy_id ? `/divvy/${activity.divvy_id}` : '#'} key={activity.id} className="block hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors group">
            <div className="p-4 flex gap-3 items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    activity.type === 'expense' ? 'bg-red-50 dark:bg-red-900/20' : 
                    activity.type === 'settlement' ? 'bg-green-50 dark:bg-green-900/20' : 
                    'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                    {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {activity.message}
                    </p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap self-start mt-1">
                    {new Date(activity.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
