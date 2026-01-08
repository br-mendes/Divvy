import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, Users, Plane, Home, Heart, Calendar, Briefcase } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Divvy Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<Divvy['type']>('trip');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchDivvies();
  }, [user]);

  const fetchDivvies = async () => {
    if (!user) return;
    try {
      // Fetch divvies where user is creator
      const { data: createdDivvies, error: createdError } = await supabase
        .from('divvies')
        .select('*')
        .eq('creator_id', user.id);

      if (createdError) throw createdError;

      // Fetch divvies where user is member
      const { data: memberDivvies, error: memberError } = await supabase
        .from('divvy_members')
        .select('divvies(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const sharedDivvies = memberDivvies?.map((d: any) => d.divvies).filter(Boolean) || [];
      
      // Merge and deduplicate
      const allDivvies = [...(createdDivvies || []), ...sharedDivvies];
      const uniqueDivvies = Array.from(new Map(allDivvies.map(item => [item.id, item])).values());
      
      setDivvies(uniqueDivvies);
    } catch (error) {
      console.error('Error fetching divvies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDivvy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreateLoading(true);

    try {
      // 1. Create Divvy
      const { data: divvy, error } = await supabase
        .from('divvies')
        .insert({
          name: newName,
          description: newDesc,
          type: newType,
          creator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Add creator as admin member
      if (divvy) {
        await supabase.from('divvy_members').insert({
          divvy_id: divvy.id,
          user_id: user.id,
          email: user.email!,
          role: 'admin',
        });
      }

      setIsModalOpen(false);
      setNewName('');
      setNewDesc('');
      fetchDivvies();
    } catch (error) {
      console.error('Error creating divvy:', error);
      alert('Failed to create Divvy. Check console.');
    } finally {
      setCreateLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trip': return <Plane className="text-blue-500" />;
      case 'roommate': return <Home className="text-green-500" />;
      case 'couple': return <Heart className="text-pink-500" />;
      case 'event': return <Calendar className="text-purple-500" />;
      default: return <Briefcase className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
           <p className="text-gray-500">Manage your shared expenses</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          New Divvy
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : divvies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Divvies yet</h3>
          <p className="text-gray-500 mb-6">Create a group to start sharing expenses.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create Divvy</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {divvies.map((divvy) => (
            <Link
              key={divvy.id}
              to={`/divvy/${divvy.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                  {getTypeIcon(divvy.type)}
                </div>
                {divvy.is_archived && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Archived</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{divvy.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 h-10">{divvy.description || 'No description'}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Created {new Date(divvy.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Divvy">
        <form onSubmit={handleCreateDivvy} className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Summer Roadtrip"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
            >
              <option value="trip">Trip ✈️</option>
              <option value="roommate">Roommate 🏠</option>
              <option value="couple">Couple 💑</option>
              <option value="event">Event 🎉</option>
              <option value="other">Other 💼</option>
            </select>
          </div>
          <Input
            label="Description"
            placeholder="Brief description..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createLoading}>Create Divvy</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
