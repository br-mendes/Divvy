
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&]/.test(pwd);
    return { minLength, hasUpper, hasLower, hasNumber, hasSpecial, isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial };
  };

  const validation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }

    if (!validation.isValid) {
      toast.error('A senha não atende aos requisitos de segurança.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Erro ao atualizar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Lock size={24} className="text-brand-600" />
        Alterar Senha
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Nova Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-lg text-sm h-fit">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Requisitos da senha:</p>
            <ul className="space-y-1.5 text-gray-500 dark:text-gray-400">
              <li className={`flex items-center gap-2 ${validation.minLength ? 'text-green-600 dark:text-green-400' : ''}`}>
                {validation.minLength ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />} 
                Mínimo de 8 caracteres
              </li>
              <li className={`flex items-center gap-2 ${validation.hasUpper ? 'text-green-600 dark:text-green-400' : ''}`}>
                {validation.hasUpper ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />} 
                Uma letra maiúscula
              </li>
              <li className={`flex items-center gap-2 ${validation.hasLower ? 'text-green-600 dark:text-green-400' : ''}`}>
                {validation.hasLower ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />} 
                Uma letra minúscula
              </li>
              <li className={`flex items-center gap-2 ${validation.hasNumber ? 'text-green-600 dark:text-green-400' : ''}`}>
                {validation.hasNumber ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />} 
                Um número
              </li>
              <li className={`flex items-center gap-2 ${validation.hasSpecial ? 'text-green-600 dark:text-green-400' : ''}`}>
                {validation.hasSpecial ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />} 
                Um caractere especial (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit" isLoading={loading} disabled={!validation.isValid || !password || password !== confirmPassword}>
            Atualizar Senha
            </Button>
        </div>
      </form>
    </div>
  );
}
