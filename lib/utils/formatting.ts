export const formatCurrency = (amount: number, currency = 'SAR'): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatNationalId = (id: string): string => {
  return id.replace(/(\d{1})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
};

export const formatCommercialReg = (reg: string): string => {
  return reg.replace(/(\d{4})(\d{4})/, '$1-$2');
};