
import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ProfileForm from '../components/settings/ProfileForm';
import Security2FAForm from '../components/settings/Security2FAForm';
import DangerZone from '../components/settings/DangerZone';
import { CreditCard } from 'lucide-react';

function ProfileContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <ProfileForm />
      
      <Security2FAForm />

      {/* --- PAYMENT METHODS (Placeholder) --- */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 md:p-8 opacity-50 pointer-events-none grayscale">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={24} className="text-brand-600" />
                Métodos de Pagamento (Em Breve)
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-500">Funcionalidade indisponível no momento.</p>
      </div>

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
