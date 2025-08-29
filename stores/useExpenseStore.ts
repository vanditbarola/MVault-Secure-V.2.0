import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'borrow' | 'lend' | 'transfer';
  category: string;
  amount: number;
  account: 'cash' | 'bank';
  toAccount?: 'cash' | 'bank';
  date: string;
  notes: string;
  settled: boolean;
  createdAt: number;
  person?: string; // Person involved in borrow/lend transactions
}

export interface Profile {
  name: string;
  email?: string;
  pin?: string;
  monthlyBudget: number;
  currency: string;
  isSetupComplete: boolean;
  theme: 'light' | 'dark';
  avatarUri?: string;
}

export interface Accounts {
  cash: number;
  bank: number;
}

interface ExpenseState {
  profile: Profile;
  accounts: Accounts;
  transactions: Transaction[];
  isAuthenticated: boolean;
  
  // Actions
  setProfile: (profile: Profile) => void;
  updateAccounts: (accounts: Partial<Accounts>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  authenticate: (pin: string) => boolean;
  setAuthenticated: (authenticated: boolean) => void;
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  exportData: () => string;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  getMonthlyStats: () => {
    income: number;
    expenses: number;
    borrowAmount: number;
    lendAmount: number;
    cashflow: number;
  };
  settleBorrowLend: (id: string) => Promise<void>;
}

const STORAGE_KEYS = {
  PROFILE: 'expense_profile',
  ACCOUNTS: 'expense_accounts',
  TRANSACTIONS: 'expense_transactions',
};

import { hashPin } from '../utils/helpers';

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  profile: { 
    name: '', 
    email: '', 
    monthlyBudget: 0, 
    currency: 'USD',
    isSetupComplete: false,
    theme: 'light',
    avatarUri: undefined
  },
  accounts: { cash: 0, bank: 0 },
  transactions: [],
  isAuthenticated: false,

  setProfile: async (profile) => {
    try {
      const currentProfile = get().profile;
      let profileToSave = profile;
      
      console.log('Current profile PIN status:', currentProfile.pin ? 'exists' : 'not set');
      console.log('New profile PIN status:', profile.pin ? 'provided' : 'not provided');
      
      if (!profile.pin && currentProfile.pin) {
        console.log('Preserving existing PIN hash');
        profileToSave = { ...profile, pin: currentProfile.pin };
      }
      else if (profile.pin && profile.pin !== currentProfile.pin) {
        console.log('Hashing new PIN');
        const hashedPin = hashPin(profile.pin);
        profileToSave = { ...profile, pin: hashedPin };
      }
      
      console.log('Saving profile with PIN status:', profileToSave.pin ? 'exists' : 'not set');
      set({ profile: profileToSave });
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileToSave));
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  },

  updateAccounts: async (newAccounts) => {
    try {
      const accounts = { ...get().accounts, ...newAccounts };
      set({ accounts });
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      console.log('Accounts updated successfully');
    } catch (error) {
      console.error('Error updating accounts:', error);
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const transaction: Transaction = {
        ...transactionData,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      
      const transactions = [...get().transactions, transaction];
      set({ transactions });
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      
      // Update account balances based on transaction type
      const { accounts } = get();
      const accountUpdate: Partial<Accounts> = {};
      
      if (transaction.type === 'income') {
        accountUpdate[transaction.account] = accounts[transaction.account] + transaction.amount;
      } else if (transaction.type === 'expense') {
        accountUpdate[transaction.account] = accounts[transaction.account] - transaction.amount;
      } else if (transaction.type === 'transfer' && transaction.toAccount) {
        accountUpdate[transaction.account] = accounts[transaction.account] - transaction.amount;
        accountUpdate[transaction.toAccount] = accounts[transaction.toAccount] + transaction.amount;
      }
      // Note: Borrow/Lend don't affect account balances directly, only cashflow
      
      if (Object.keys(accountUpdate).length > 0) {
        await get().updateAccounts(accountUpdate);
      }
      
      console.log('Transaction added successfully:', transaction.id);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      const transactions = get().transactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      set({ transactions });
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('Transaction updated successfully:', id);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  },

  deleteTransaction: async (id) => {
    try {
      const transactions = get().transactions.filter(t => t.id !== id);
      set({ transactions });
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('Transaction deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  authenticate: (pin) => {
    try {
      const { profile } = get();
      const hashedPin = hashPin(pin);
      
      console.log('Authenticating with PIN hash:', hashedPin);
      console.log('Stored PIN hash:', profile.pin);
      
      if (profile.pin === hashedPin) {
        set({ isAuthenticated: true });
        console.log('Authentication successful');
        return true;
      }
      console.log('Authentication failed');
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  },

  setAuthenticated: (authenticated) => {
    set({ isAuthenticated: authenticated });
  },

  getMonthlyStats: () => {
    const { transactions } = get();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const borrowAmount = monthlyTransactions
      .filter(t => t.type === 'borrow' && !t.settled)
      .reduce((sum, t) => sum + t.amount, 0);

    const lendAmount = monthlyTransactions
      .filter(t => t.type === 'lend' && !t.settled)
      .reduce((sum, t) => sum + t.amount, 0);

    // Monthly cashflow = Income - Expenses + Borrow - Lend
    // Only count unsettled borrow/lend transactions in cashflow
    const cashflow = income - expenses + borrowAmount - lendAmount;

    return {
      income,
      expenses,
      borrowAmount,
      lendAmount,
      cashflow
    };
  },

  settleBorrowLend: async (id) => {
    try {
      await get().updateTransaction(id, { settled: true });
      console.log('Borrow/Lend settled successfully:', id);
      return true;
    } catch (error) {
      console.error('Error settling borrow/lend:', error);
      throw error;
    }
  },

  loadData: async () => {
    try {
      console.log('Loading data from AsyncStorage...');
      
      const [profileData, accountsData, transactionsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS),
        AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
      ]);

      if (profileData) {
        const profile = JSON.parse(profileData);
        set({ profile });
        console.log('Profile loaded:', profile.name);
      }
      
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        set({ accounts });
        console.log('Accounts loaded:', accounts);
      }
      
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData);
        set({ transactions });
        console.log('Transactions loaded:', transactions.length, 'items');
      }
      
      console.log('Data loading completed successfully');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  saveData: async () => {
    try {
      const { profile, accounts, transactions } = get();
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile)),
        AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts)),
        AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)),
      ]);
      console.log('All data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  exportData: () => {
    const { profile, accounts, transactions } = get();
    const stats = get().getMonthlyStats();
    
    const exportData = {
      profile, // Include PIN in export for encrypted backup
      accounts,
      transactions,
      monthlyStats: stats,
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length,
      netWorth: accounts.cash + accounts.bank,
    };
    console.log('Data exported successfully');
    return JSON.stringify(exportData, null, 2);
  },

  importData: async (data) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.profile) {
        // Reset PIN to force re-setup after import
        const profileToImport = { ...parsed.profile, pin: undefined };
        set({ profile: profileToImport });
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileToImport));
      }
      
      if (parsed.accounts) {
        set({ accounts: parsed.accounts });
        await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed.accounts));
      }
      
      if (parsed.transactions) {
        set({ transactions: parsed.transactions });
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      }
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  clearAllData: async () => {
    try {
      await Promise.all([
        AsyncStorage.clear()
      ]);
      
      set({
        profile: { 
          name: '', 
          email: '', 
          monthlyBudget: 0, 
          currency: 'USD',
          isSetupComplete: false,
          theme: 'light',
          avatarUri: undefined
        },
        accounts: { cash: 0, bank: 0 },
        transactions: [],
        isAuthenticated: false,
      });
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },
}));