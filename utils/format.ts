const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const dateFormats: Record<string, Intl.DateTimeFormatOptions> = {
  short: {
    day: '2-digit',
    month: 'short',
  },
  long: {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  },
};

export const formatCurrency = (amountInCents: number) => {
  return currencyFormatter.format(amountInCents / 100);
};

export const formatDate = (date: string, format: 'short' | 'long' = 'long') => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('pt-BR', dateFormats[format]);
};
