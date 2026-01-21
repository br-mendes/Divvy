export function formatCurrency(amountInCents: number): string {
  const value = amountInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

type DateFormat = 'short' | 'long';

export function formatDate(dateString: string, format: DateFormat = 'long'): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: 'short' }
      : { day: '2-digit', month: 'short', year: 'numeric' };

  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}
