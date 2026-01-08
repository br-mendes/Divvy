import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import toast, { Toaster } from 'react-hot-toast';

export const JoinDivvy: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invite, setInvite] = useState<any | null>(null);
  const [divvyName, setDivvyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInviteDetails();
    }
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      // Fetch invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('divvy_invites')
        .select('*')
        .eq('id', token)
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Convite não encontrado ou inválido.');
      }

      setInvite(inviteData);

      // Check expiration
      if (new Date(inviteData.expires_at) < new Date()) {
        throw new Error('Este convite expirou.');
      }

      if (inviteData.status !== 'pending') {
        throw new Error('Este convite já foi aceito ou recusado.');
      }

      // Fetch Divvy name
      const { data: divvyData, error: divvyError } = await supabase
        .from('divvies')
        .select('name')
        .eq('id', inviteData.divvy_id)
        .single();

      if (divvyData) {
        setDivvyName(divvyData.name);
      }

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar convite.');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) return;
    setProcessing(true);

    try {
      // 1. Add Member
      // Check if already member
      const { data: existingMember } = await supabase
        .from('divvy_members')
        .select('id')
        .eq('divvy_id', invite.divvy_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.success('Você já é membro deste Divvy.');
        // Update invite status anyway to clean up
        await supabase
          .from('divvy_invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', invite.id);
          
        navigate(`/divvy/${invite.divvy_id}`);
        return;
      }

      const { error: memberError } = await supabase
        .from('divvy_members')
        .insert({
          divvy_id: invite.divvy_id,
          user_id: user.id,
          email: user.email!, // Use current user email
          role: 'member',
        });

      if (memberError) throw memberError;

      // 2. Update Invite Status
      const { error: updateError } = await supabase
        .from('divvy_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) console.error('Erro ao atualizar status do convite', updateError);

      toast.success(`Você entrou em ${divvyName}!`);
      navigate(`/divvy/${invite.divvy_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao aceitar convite.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button variant="primary">Ir para Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Toaster position="top-right" />
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-6">📩</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite para Divvy</h1>
        <p className="text-gray-600 mb-6">
          Você foi convidado para participar do grupo de despesas <strong>{divvyName}</strong>.
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Entrar como <strong>{user.email}</strong>
            </p>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleAccept}
              isLoading={processing}
            >
              Aceitar Convite
            </Button>
            <Link to="/dashboard" className="block mt-2">
              <Button variant="outline" fullWidth disabled={processing}>
                Cancelar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Faça login ou crie uma conta para aceitar.
            </p>
            <Link to={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="primary" fullWidth>
                Fazer Login
              </Button>
            </Link>
            <Link to={`/signup?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="outline" fullWidth>
                Criar Conta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};