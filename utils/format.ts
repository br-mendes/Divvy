/**
 * Formata valor em moeda (BRL padrão)
 * @param value - Valor em centavos ou reais
 * @param currency - Código da moeda (padrão: BRL)
 * @param inCents - Se true, converte de centavos para reais
 */
export const formatCurrency = (
  value: number,
  currency: string = 'BRL',
  inCents: boolean = true
): string => {
  const amount = inCents ? value / 100 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formata data em formato legível
 * @param date - Data (string ISO ou Date object)
 * @param format - 'short', 'long', 'time', 'full' (padrão: 'short')
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'time' | 'full' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return new Intl.DateTimeFormat('pt-BR', options[format]).format(dateObj);
};

/**
 * Formata percentual
 * @param value - Valor em decimal (0.5 = 50%)
 * @param decimals - Casas decimais (padrão: 0)
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Valida email
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Gera slug de string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Copia texto para clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
