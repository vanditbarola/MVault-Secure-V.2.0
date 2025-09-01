import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'borrow' | 'lend' | 'transfer';
  category: string;
  amount: number;
  account: string;
  toAccount?: string;
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

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'savings' | 'credit' | 'investment' | 'other';
  createdAt: number;
}

export interface Accounts {
  [key: string]: Account;
}

interface ExpenseState {
  profile: Profile;
  accounts: Accounts;
  transactions: Transaction[];
  isAuthenticated: boolean;
  
  // Actions
  setProfile: (profile: Profile) => void;
  updateAccounts: (accounts: Partial<Accounts>) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  importTransaction: (transaction: Transaction) => void;
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
  getTotalBalance: () => number;
  getAccountsList: () => Account[];
  getReadableTransactions: () => Transaction[];
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
  accounts: {},

  addAccount: async (accountData) => {
    try {
      const { accounts } = get();
      
      // Check if account name already exists
      const existingAccount = Object.values(accounts).find(acc => 
        acc.name.toLowerCase() === accountData.name.toLowerCase()
      );
      
      if (existingAccount) {
        throw new Error(`Account with name "${accountData.name}" already exists`);
      }
      
      const account: Account = {
        ...accountData,
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      
      const updatedAccounts = { ...accounts, [account.id]: account };
      set({ accounts: updatedAccounts });
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
      console.log('Account added successfully:', account.id);
    } catch (error) {
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      const accounts = { ...get().accounts };
      if (accounts[id]) {
        accounts[id] = { ...accounts[id], ...updates };
        set({ accounts });
        await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
        console.log('Account updated successfully:', id);
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  },

  deleteAccount: async (id) => {
    try {
      const accounts = { ...get().accounts };
      delete accounts[id];
      set({ accounts });
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      console.log('Account deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  },

  getTotalBalance: () => {
    const { accounts } = get();
    return Object.values(accounts).reduce((total, account) => total + account.balance, 0);
  },

  getAccountsList: () => {
    const { accounts } = get();
    return Object.values(accounts).sort((a, b) => a.createdAt - b.createdAt);
  },
  
  getReadableTransactions: () => {
    const { transactions } = get();
    // Since we now store account names directly, just return transactions as is
    return transactions;
  },
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
      const { accounts, transactions } = get();
      
      // Convert account ID to name for storage
      const fromAccount = accounts[transactionData.account];
      const toAccount = transactionData.toAccount ? accounts[transactionData.toAccount] : null;
      
      const transaction: Transaction = {
        ...transactionData,
        account: fromAccount?.name || 'Unknown Account',
        toAccount: toAccount?.name || transactionData.toAccount,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      
      // Update account balances
      const updatedAccounts = { ...accounts };
      if (transaction.type === 'income' && updatedAccounts[transactionData.account]) {
        updatedAccounts[transactionData.account].balance += transaction.amount;
      } else if (transaction.type === 'expense' && updatedAccounts[transactionData.account]) {
        updatedAccounts[transactionData.account].balance -= transaction.amount;
      } else if (transaction.type === 'transfer' && transactionData.toAccount) {
        if (updatedAccounts[transactionData.account] && updatedAccounts[transactionData.toAccount]) {
          updatedAccounts[transactionData.account].balance -= transaction.amount;
          updatedAccounts[transactionData.toAccount].balance += transaction.amount;
        }
      }
      
      const newTransactions = [...transactions, transaction];
      
      // Batch update state and storage
      set({ transactions: newTransactions, accounts: updatedAccounts });
      
      // Async storage operations (non-blocking)
      Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions)),
        AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts))
      ]).catch(error => console.error('Storage error:', error));
      
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  },

  importTransaction: async (transaction) => {
    try {
      const { accounts } = get();
      
      // Convert account ID to name if it's still an ID
      const fromAccount = accounts[transaction.account];
      const toAccount = transaction.toAccount ? accounts[transaction.toAccount] : null;
      
      const processedTransaction = {
        ...transaction,
        account: fromAccount?.name || transaction.account, // Use name if ID found, otherwise keep as is
        toAccount: toAccount?.name || transaction.toAccount
      };
      
      const transactions = [...get().transactions, processedTransaction];
      set({ transactions });
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('Transaction imported successfully:', transaction.id);
    } catch (error) {
      console.error('Error importing transaction:', error);
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
      transactions, // Keep original transactions with IDs for backup
      monthlyStats: stats,
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length,
      netWorth: Object.values(accounts).reduce((total, acc) => total + acc.balance, 0),
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
        accounts: {},
        transactions: [],
        isAuthenticated: false,
      });
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },
}));