
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DivvyMember, Expense } from '../../types';
import toast from 'react-hot-toast';
import { Camera, Upload } from 'lucide-react';

interface ExpenseFormProps {
  divvyId: string;
  members: DivvyMember[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Expense;
}

export default function ExpenseForm({ divvyId, members, onSuccess, onCancel, initialData }: ExpenseFormProps) {
  const { user } = useAuth();
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  
  // Split State
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [manualPercentages, setManualPercentages] = useState<Record<string, string>>({});
  
  // Receipt State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Initial Data for Editing
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date.split('T')[0]);
      setPayerId(initialData.paidbyuserid);
      setReceiptUrl(initialData.receiptphotourl || null);
      if (initialData.receiptphotourl) setPreviewUrl(initialData.receiptphotourl);

      // Fetch Splits for this expense to populate form
      const fetchSplits = async () => {
        const { data: splits } = await supabase
          .from('expensesplits')
          .select('*')
          .eq('expenseid', initialData.id);

        if (splits && splits.length > 0) {
          const totalMembers = members.length;
          const participantIds = new Set<string>(splits.map((s: any) => s.participantuserid as string));
          
          setSelectedParticipants(participantIds);
          
          const amounts: Record<string, string> = {};
          const percentages: Record<string, string> = {};
          const totalAmount = initialData.amount;

          splits.forEach((s: any) => {
              amounts[s.participantuserid] = s.amountowed.toFixed(2);
              percentages[s.participantuserid] = ((s.amountowed / totalAmount) * 100).toFixed(1);
          });
          
          setManualAmounts(amounts);
          setManualPercentages(percentages);
          
          // Simple Heuristic for type detection
          const isAll = splits.length === totalMembers;
          const firstAmount = splits[0].amountowed;
          const isEqual = splits.every((s: any) => Math.abs(s.amountowed - firstAmount) < 0.05);

          if (isAll && isEqual) {
            setSplitType('equal');
          } else {
            setSplitType('exact');
          }
        }
      };
      fetchSplits();
    } else if (user && members.length > 0) {
      // Defaults for new expense
      const me = members.find(m => m.userid === user.id);
      setPayerId(me ? me.userid : members[0].userid);
      setSelectedParticipants(new Set(members.map(m => m.userid)));
    }
  }, [initialData, user, members]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.userid === uid);
    if (!m) return 'Membro';
    return m.userprofiles?.displayname || m.userprofiles?.fullname || m.email.split('@')[0];
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (isNaN(val) || val <= 0 || !description.trim() || !payerId) {
        toast.error("Preencha os campos obrigatórios.");
        return;
    }

    setLoading(true);

    try {
      // 1. Calculate Splits Logic (Client-Side Validation)
      let splitsPayload: { participantuserid: string; amountowed: number; }[] = [];

      if (splitType === 'equal') {
          if (selectedParticipants.size === 0) throw new Error("Selecione pelo menos um participante.");
          const splitVal = val / selectedParticipants.size;
          splitsPayload = Array.from(selectedParticipants).map(uid => ({ participantuserid: uid, amountowed: splitVal }));
      } else if (splitType === 'exact') {
          let sum = 0;
          splitsPayload = members.map(m => {
              const v = parseFloat(manualAmounts[m.userid] || '0');
              if (v > 0) {
                sum += v;
                return { participantuserid: m.userid, amountowed: v };
              }
              return null;
          }).filter(Boolean) as any;
          
          if (Math.abs(sum - val) > 0.05) throw new Error(`A soma (R$ ${sum.toFixed(2)}) deve ser igual ao total (R$ ${val.toFixed(2)}).`);
      } else if (splitType === 'percentage') {
          let totalPct = 0;
          splitsPayload = members.map(m => {
              const pct = parseFloat(manualPercentages[m.userid] || '0');
              if (pct > 0) {
                totalPct += pct;
                return { participantuserid: m.userid, amountowed: (val * pct) / 100 };
              }
              return null;
          }).filter(Boolean) as any;
          
          if (Math.abs(totalPct - 100) > 0.5) throw new Error("A soma das porcentagens deve ser 100%.");
      }

      // 2. Upload Receipt to Supabase Storage (Client-Side)
      let finalReceiptUrl = receiptUrl;
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${divvyId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (uploadError) {
            console.error("Upload error:", uploadError);
            toast.error("Erro ao enviar imagem. A despesa será salva sem o comprovante.");
        } else {
            const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
            finalReceiptUrl = urlData.publicUrl;
        }
      }

      // 3. Send to API
      const endpoint = initialData ? `/api/expenses/${initialData.id}` : '/api/expenses';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              divvyId,
              paidByUserId: payerId,
              amount: val,
              category,
              description,
              date,
              receiptPhotoUrl: finalReceiptUrl,
              splits: splitsPayload
          })
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.error || 'Erro ao processar despesa');
      }

      toast.success(initialData ? 'Despesa atualizada!' : 'Despesa salva!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar despesa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="md:col-span-2">
            <Input label="Descrição *" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Jantar Pizza" required />
         </div>
         
         <Input label="Valor (R$) *" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
         
         <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
         
         <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Categoria</label>
            <select 
                className="w-full rounded-lg border border-gray-300 dark:border-dark-600 px-3 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
            >
               <option value="food">🍽️ Alimentação</option>
               <option value="transport">🚗 Transporte</option>
               <option value="accommodation">🏨 Hospedagem</option>
               <option value="activity">🎬 Atividade</option>
               <option value="utilities">💡 Contas</option>
               <option value="shopping">🛍️ Compras</option>
               <option value="other">💰 Outros</option>
            </select>
         </div>
         
         <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quem pagou?</label>
            <select 
                className="w-full rounded-lg border border-gray-300 dark:border-dark-600 px-3 py-2 bg-white dark:bg-dark-800 text-gray-900 dark:text-white" 
                value={payerId} 
                onChange={e => setPayerId(e.target.value)}
            >
               {members.map(m => (
                   <option key={m.userid} value={m.userid}>
                       {m.userid === user?.id ? 'Eu' : getMemberName(m.userid)}
                   </option>
               ))}
            </select>
         </div>
      </div>

      {/* Receipt Upload */}
      <div>
         <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Comprovante / Recibo</label>
         <div className="flex items-center gap-4">
            <div 
                className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-dark-800 border-2 border-dashed border-gray-300 dark:border-dark-600 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center">
                        <Camera size={20} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500">Adicionar</span>
                    </div>
                )}
            </div>
            
            <div className="flex-1">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} className="mr-2" /> Escolher arquivo
                </Button>
                {previewUrl && (
                    <Button type="button" variant="ghost" size="sm" className="ml-2 text-red-500" onClick={() => { setReceiptFile(null); setPreviewUrl(null); setReceiptUrl(null); }}>
                        Remover
                    </Button>
                )}
            </div>
         </div>
      </div>

      {/* Split Logic */}
      <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
         <label className="block text-sm font-bold mb-3 text-gray-900 dark:text-white">Como dividir?</label>
         <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-dark-800 p-1 rounded-lg w-fit">
            {['equal', 'exact', 'percentage'].map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setSplitType(t as any)} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    splitType === t 
                    ? 'bg-white dark:bg-dark-700 shadow text-brand-600 dark:text-brand-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                  {t === 'equal' ? 'Igual' : t === 'exact' ? 'Valor' : '%'}
              </button>
            ))}
         </div>
         
         <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-dark-800/50 rounded-xl custom-scrollbar border border-gray-100 dark:border-dark-800">
             {members.map(m => (
                 <div key={m.userid} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-dark-800 rounded-lg transition-colors">
                     <div className="flex items-center gap-3">
                         {splitType === 'equal' && (
                             <input 
                                type="checkbox" 
                                checked={selectedParticipants.has(m.userid)} 
                                onChange={() => { 
                                    const s = new Set(selectedParticipants); 
                                    s.has(m.userid) ? s.delete(m.userid) : s.add(m.userid); 
                                    setSelectedParticipants(s); 
                                }} 
                                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                             />
                         )}
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                             {getMemberName(m.userid)} {m.userid === payerId && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded ml-1">Pagou</span>}
                         </span>
                     </div>
                     
                     {splitType === 'equal' && (
                         <span className="text-xs font-mono text-gray-500">
                             {selectedParticipants.has(m.userid) 
                                ? formatMoney(parseFloat(amount || '0') / selectedParticipants.size) 
                                : '-'}
                         </span>
                     )}
                     
                     {splitType === 'exact' && (
                         <Input 
                            type="number" 
                            step="0.01" 
                            value={manualAmounts[m.userid] || ''} 
                            onChange={e => setManualAmounts({ ...manualAmounts, [m.userid]: e.target.value })} 
                            className="w-24 text-right text-sm py-1" 
                            placeholder="0.00" 
                         />
                     )}
                     
                     {splitType === 'percentage' && (
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-mono">
                                 {formatMoney((parseFloat(amount || '0') * (parseFloat(manualPercentages[m.userid] || '0'))) / 100)}
                             </span>
                             <div className="relative">
                                <input 
                                    type="number" 
                                    value={manualPercentages[m.userid] || ''} 
                                    onChange={e => setManualPercentages({ ...manualPercentages, [m.userid]: e.target.value })} 
                                    className="w-16 p-1 border rounded text-right text-sm pr-6 focus:ring-brand-500 focus:border-brand-500" 
                                    placeholder="0" 
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-gray-400">%</span>
                             </div>
                         </div>
                     )}
                 </div>
             ))}
         </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" isLoading={loading}>
            {initialData ? 'Atualizar Despesa' : 'Salvar Despesa'}
        </Button>
      </div>
    </form>
  );
}
