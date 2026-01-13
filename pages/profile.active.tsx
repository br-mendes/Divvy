
import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ProfileForm from '../components/settings/ProfileForm';
import Security2FAForm from '../components/settings/Security2FAForm';
import PaymentMethodsForm from '../components/settings/PaymentMethodsForm';
import ChangePasswordForm from '../components/settings/ChangePasswordForm';
import DangerZone from '../components/settings/DangerZone';

function ProfileContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais e preferências.</p>
      </div>

      <ProfileForm />
      
      <PaymentMethodsForm />
      
      <ChangePasswordForm />
      
      <Security2FAForm />

      <DangerZone />
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
