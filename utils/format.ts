export const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
};

export const formatDate = (dateStr: string, mode: 'short' | 'long' = 'short') => {
  if (!dateStr) return '';
  const raw = String(dateStr).split('T')[0];
  const [year, month, day] = raw.split('-').map((v) => Number(v));
  if (!year || !month || !day) return raw;

  const dt = new Date(year, month - 1, day);
  const opts: Intl.DateTimeFormatOptions =
    mode === 'long'
      ? { day: '2-digit', month: 'long', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };

  return new Intl.DateTimeFormat('pt-BR', opts).format(dt);
};
