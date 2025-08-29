import * as Crypto from 'expo-crypto';

export const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// Ensure any number used in calculations is finite and valid
export const safeNumber = (value: number | string | undefined | null): number => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isFinite(num) ? num : 0;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Ensure amount is a safe number before formatting
  const safeAmount = safeNumber(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(safeAmount);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currencies: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
  };
  return currencies[currencyCode] || '$';
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getTransactionIcon = (type: string): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
  switch (type) {
    case 'income': return 'trending-up';
    case 'expense': return 'trending-down';
    case 'borrow': return 'arrow-down-circle';
    case 'lend': return 'arrow-up-circle';
    case 'transfer': return 'swap-horizontal';
    default: return 'help-circle';
  }
};

export const getTransactionColor = (type: string): string => {
  switch (type) {
    case 'income': return '#4CAF50';
    case 'expense': return '#F44336';
    case 'borrow': return '#FF9800';
    case 'lend': return '#2196F3';
    case 'transfer': return '#9C27B0';
    default: return '#9E9E9E';
  }
};

export const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'],
  borrow: ['Personal', 'Emergency', 'Investment', 'Other'],
  lend: ['Personal', 'Emergency', 'Investment', 'Other'],
};