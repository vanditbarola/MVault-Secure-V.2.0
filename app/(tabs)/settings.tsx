import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Share, Switch, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
// Import html2pdf.js for web platform
let html2pdf;
if (Platform.OS === 'web') {
  // Import html2pdf.js directly for web platform
  import('html2pdf.js')
    .then(module => {
      console.log('html2pdf.js loaded successfully');
      html2pdf = module.default || module;
    })
    .catch(err => {
      console.error('Failed to load html2pdf.js:', err);
    });
}
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { formatCurrency, safeNumber } from '../../utils/helpers';
import PinModal from '../../components/PinModal';
import Icon from '../../components/Icon';
import ProfileImage from '../../components/ProfileImage';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getThemeColors } from '../../styles/commonStyles';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

function SettingsScreen() {
  const { 
    profile, 
    accounts, 
    transactions, 
    setProfile, 
    updateAccounts, 
    exportData, 
    importData, 
    clearAllData,
    loadData,
    authenticate
  } = useExpenseStore();

  const { theme, toggleTheme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);

  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempEmail, setTempEmail] = useState(profile.email || '');
  const [tempBudget, setTempBudget] = useState(profile.monthlyBudget.toString());
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(profile.avatarUri || null);
  const [authenticated, setAuthenticated] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('complete');
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);


  React.useEffect(() => {
    loadData();
  }, []);
  
  // Update local state when profile changes
  React.useEffect(() => {
    setProfileImage(profile.avatarUri || null);
    setTempName(profile.name);
    setTempEmail(profile.email || '');
    setTempBudget(profile.monthlyBudget.toString());
  }, [profile]);

  

  const handleImageChange = async (uri: string) => {
    try {
      console.log('Updating profile image with current PIN:', profile.pin ? 'PIN exists' : 'No PIN');
      console.log('Image URI received:', uri);
      setProfileImage(uri);
      
      // Create updated profile object while preserving the PIN
      const updatedProfile = {
        ...profile,
        avatarUri: uri, // Use avatarUri to match the property used in the store and ProfileImage component
      };
      
      // Make sure we're not accidentally clearing the PIN
      if (!updatedProfile.pin && profile.pin) {
        updatedProfile.pin = profile.pin;
      }
      
      console.log('Updating profile with avatarUri:', updatedProfile.avatarUri);
      console.log('Updating profile image with PIN preserved:', updatedProfile.pin ? 'PIN exists' : 'No PIN');
      
      // Save the image URI to the profile
      await setProfile(updatedProfile);
      
      // Verify the profile was updated
      console.log('Profile after update - avatarUri:', profile.avatarUri);
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Error', 'Failed to save profile picture');
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile with current PIN:', profile.pin ? 'PIN exists' : 'No PIN');
      console.log('Current profileImage state:', profileImage);
      
      // Ensure we preserve the existing PIN when updating the profile
      const updatedProfile = {
        ...profile,
        name: tempName,
        email: tempEmail,
        monthlyBudget: parseFloat(tempBudget) || 0,
        avatarUri: profileImage, // Save the profile image using avatarUri for consistency
      };
      
      // Make sure we're not accidentally clearing the PIN
      if (!updatedProfile.pin && profile.pin) {
        updatedProfile.pin = profile.pin;
      }
      
      console.log('Updating profile with avatarUri:', updatedProfile.avatarUri);
      console.log('Updating profile with PIN preserved:', updatedProfile.pin ? 'PIN exists' : 'No PIN');
      
      await setProfile(updatedProfile);
      
      // Verify the profile was updated
      console.log('Profile after update - avatarUri:', profile.avatarUri);
      
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      console.log('Changing currency with current PIN:', profile.pin ? 'PIN exists' : 'No PIN');
      
      // Create updated profile object while preserving the PIN
      const updatedProfile = {
        ...profile,
        currency: currencyCode,
      };
      
      // Make sure we're not accidentally clearing the PIN
      if (!updatedProfile.pin && profile.pin) {
        updatedProfile.pin = profile.pin;
      }
      
      console.log('Updating currency with PIN preserved:', updatedProfile.pin ? 'PIN exists' : 'No PIN');
      
      await setProfile(updatedProfile);
      setShowCurrencyModal(false);
      Alert.alert('Success', 'Currency updated successfully!');
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', 'Failed to update currency');
    }
  };

  // State for loading indicator and progress
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  // Enhanced safe number utility functions
// Helper functions - Add these at the top of your component or in a utils file
const safeMathNumber = (value: any): number => {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const safeHeight = (value: any, maxValue: any): number => {
  const safeValue = safeMathNumber(value);
  const safeMax = Math.max(safeMathNumber(maxValue), 1);
  const height = (safeValue / safeMax) * 120; // Max height of 120px
  return Math.max(2, Math.min(120, height)); // Ensure minimum 2px, maximum 120px
};

const safePercentageCalc = (value: any, total: any): number => {
  const safeValue = safeMathNumber(value);
  const safeTotal = Math.max(safeMathNumber(total), 1);
  return (safeValue / safeTotal) * 100;
};



const getCurrencySymbol = () => {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return currencySymbols[profile.currency] || profile.currency || '$';
};

const generateDetailedPDF = async (dateRange = 'complete', startDate = null, endDate = null) => {
  try {
    // Show loading animation
    Alert.alert('Generating PDF', 'Please wait while we prepare your detailed financial report...');
    
    // Set loading indicator
    setIsLoading(true);
    setProgress(0);
    setProgressText('Initializing report...');
    
    // Filter transactions based on date range
    let filteredTransactions = transactions;
    if (dateRange === 'monthly') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monthStart);
    } else if (dateRange === 'yearly') {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= yearStart);
    } else if (dateRange === 'custom' && startDate && endDate) {
      filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });
    }
    
    const monthlyStats = {
      income: filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0),
      expenses: filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0),
      borrowAmount: filteredTransactions
        .filter(t => t.type === 'borrow')
        .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0),
      lendAmount: filteredTransactions
        .filter(t => t.type === 'lend')
        .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0),
      cashflow: 0
    };
    monthlyStats.cashflow = monthlyStats.income - monthlyStats.expenses + monthlyStats.borrowAmount - monthlyStats.lendAmount;
    setProgress(10);
    setProgressText('Calculating account balances...');
    const netWorth = safeMathNumber(accounts.cash) + safeMathNumber(accounts.bank);
    const currencySymbol = getCurrencySymbol();
    
    setProgress(20);
    setProgressText('Calculating pending transactions...');
    
    const pendingBorrows = filteredTransactions
      .filter(t => t.type === 'borrow' && !t.settled)
      .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0);
    
    const pendingLends = filteredTransactions
      .filter(t => t.type === 'lend' && !t.settled)
      .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0);
    
    setProgress(30);
    setProgressText('Analyzing expense categories...');

    // Calculate category breakdowns
    const expensesByCategory: { [key: string]: number } = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = 0;
        }
        expensesByCategory[category] = safeMathNumber(expensesByCategory[category]) + safeMathNumber(t.amount);
      });
    
    setProgress(40);
    setProgressText('Analyzing income categories...');
    
    const incomeByCategory: { [key: string]: number } = {};
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        if (!incomeByCategory[category]) {
          incomeByCategory[category] = 0;
        }
        incomeByCategory[category] = safeMathNumber(incomeByCategory[category]) + safeMathNumber(t.amount);
      });

    setProgress(50);
    setProgressText('Calculating monthly trends...');
    
    // Calculate monthly trends for filtered data
    const monthlyTrends = [];
    if (filteredTransactions.length > 0) {
      // Get all unique months from filtered transactions
      const monthsSet = new Set();
      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthsSet.add(monthKey);
      });
      
      // Convert to sorted array
      const months = Array.from(monthsSet).sort().map(key => {
        const [year, month] = key.split('-').map(Number);
        return new Date(year, month, 1);
      });
      
      months.forEach(month => {
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const year = month.getFullYear();
        
        const monthTransactions = filteredTransactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear();
        });
        
        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0);
          
        const monthExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => safeMathNumber(sum) + safeMathNumber(t.amount), 0);
          
        monthlyTrends.push({
          month: monthName,
          year,
          income: safeMathNumber(monthIncome),
          expense: safeMathNumber(monthExpense),
          savings: safeMathNumber(monthIncome) - safeMathNumber(monthExpense)
        });
      });
    }

    setProgress(70);
    setProgressText('Building report...');

    // Simplified HTML content for better PDF generation
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MVault Financial Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #1a1a1a;
          font-size: 12px;
          background: white;
          padding: 20px;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          background: #1B263B;
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        
        .header h1 {
          font-size: 24px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .section {
          margin-bottom: 25px;
          background: white;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        
        .section h2 {
          font-size: 18px;
          color: #1B263B;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #1B263B;
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background: #1B263B;
          color: white;
          font-weight: bold;
        }
        
        .income { color: #28a745; font-weight: bold; }
        .expense { color: #dc3545; font-weight: bold; }
        .borrow { color: #fd7e14; font-weight: bold; }
        .lend { color: #007bff; font-weight: bold; }
        
        .status-settled {
          background: #d4edda;
          color: #155724;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .highlight-row {
          background: #e3f2fd !important;
          font-weight: bold;
        }
        
        .category-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .category-name {
          min-width: 120px;
          font-weight: bold;
          font-size: 11px;
        }
        
        .category-amount {
          min-width: 100px;
          text-align: right;
          font-weight: bold;
          font-size: 11px;
        }
        
        .chart-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
        }
        
        .chart-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #1B263B;
        }
        
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        
        .profile-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        
        .profile-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .profile-value {
          font-size: 12px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .footer {
          background: #1B263B;
          color: white;
          padding: 20px;
          text-align: center;
          margin-top: 30px;
          border-radius: 8px;
        }
        
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .no-data {
          padding: 40px;
          color: #666;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>MVault Financial Report</h1>
          <p>Comprehensive Financial Analysis</p>
          <p><strong>Report Period:</strong> ${dateRange === 'monthly' ? 'Current Month' : dateRange === 'yearly' ? 'Current Year' : dateRange === 'custom' ? `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}` : 'Complete Data'}</p>
        </div>

        <!-- Profile Section -->
        <div class="section">
          <h2>Account Overview</h2>
          <div class="profile-grid">
            <div class="profile-item">
              <div class="profile-label">Account Holder</div>
              <div class="profile-value">${profile.name || 'Not Set'}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">Email Address</div>
              <div class="profile-value">${profile.email || 'Not provided'}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">Base Currency</div>
              <div class="profile-value">${profile.currency || 'USD'}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">Monthly Budget</div>
              <div class="profile-value">${currencySymbol}${safeMathNumber(profile.monthlyBudget).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <!-- Account Balances -->
        <div class="section">
          <h2>💼 Portfolio Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">💵 Cash Holdings</td>
                <td class="font-bold">${currencySymbol}${safeMathNumber(accounts.cash).toLocaleString()}</td>
                <td><span class="status-settled">Liquid</span></td>
              </tr>
              <tr>
                <td class="font-bold">🏦 Bank Account</td>
                <td class="font-bold">${currencySymbol}${safeMathNumber(accounts.bank).toLocaleString()}</td>
                <td><span class="status-settled">Active</span></td>
              </tr>
              <tr class="highlight-row">
                <td class="font-bold">🎯 Total Net Worth</td>
                <td class="font-bold">${currencySymbol}${safeMathNumber(netWorth).toLocaleString()}</td>
                <td><span class="${safeMathNumber(netWorth) >= 0 ? 'status-settled' : 'status-pending'}">${safeMathNumber(netWorth) >= 0 ? 'Positive' : 'Negative'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Monthly Trends -->
        <div class="section">
          <h2>📈 Financial Trends Analysis</h2>
          <div class="chart-section">
            <div class="chart-title">Monthly Performance (All Available Data)</div>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Savings</th>
                  <th>Savings Rate</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyTrends.map(month => {
                  const savingsRate = safePercentageCalc(month.savings, month.income);
                  return `
                    <tr>
                      <td class="font-bold">${month.month} ${month.year}</td>
                      <td class="income">+${currencySymbol}${safeMathNumber(month.income).toLocaleString()}</td>
                      <td class="expense">-${currencySymbol}${safeMathNumber(month.expense).toLocaleString()}</td>
                      <td class="${safeMathNumber(month.savings) >= 0 ? 'income' : 'expense'}">${currencySymbol}${safeMathNumber(month.savings).toLocaleString()}</td>
                      <td class="font-bold">${safeMathNumber(savingsRate).toFixed(1)}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Expense Analysis -->
        <div class="section">
          <h2>💸 Expense Analysis</h2>
          ${Object.entries(expensesByCategory).length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>% of Total</th>
                  <th>Budget Impact</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const totalExpenses = Math.max(1, Object.values(expensesByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0));
                    const percentage = safePercentageCalc(amount, totalExpenses);
                    const budgetImpact = safePercentageCalc(amount, profile.monthlyBudget || 1);
                    return `
                      <tr>
                        <td class="font-bold">${category}</td>
                        <td class="expense font-bold">${currencySymbol}${safeMathNumber(amount).toLocaleString()}</td>
                        <td class="font-bold">${safeMathNumber(percentage).toFixed(1)}%</td>
                        <td class="font-bold">${safeMathNumber(budgetImpact).toFixed(1)}%</td>
                      </tr>
                    `;
                  }).join('')}
                <tr class="highlight-row">
                  <td class="font-bold">Total Expenses</td>
                  <td class="font-bold">${currencySymbol}${Object.values(expensesByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0).toLocaleString()}</td>
                  <td class="font-bold">100.0%</td>
                  <td class="font-bold">${safePercentageCalc(Object.values(expensesByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0), profile.monthlyBudget || 1).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              <p class="font-bold">No expense data available</p>
              <p>Start tracking expenses to see detailed analytics.</p>
            </div>
          `}
        </div>

        <!-- Income Analysis -->
        <div class="section">
          <h2>💰 Income Sources</h2>
          ${Object.entries(incomeByCategory).length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Income Source</th>
                  <th>Amount</th>
                  <th>% of Total</th>
                  <th>Monthly Avg</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(incomeByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const totalIncome = Math.max(1, Object.values(incomeByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0));
                    const percentage = safePercentageCalc(amount, totalIncome);
                    const monthlyAvg = safeMathNumber(amount) / Math.max(1, monthlyTrends.length);
                    return `
                      <tr>
                        <td class="font-bold">${category}</td>
                        <td class="income font-bold">${currencySymbol}${safeMathNumber(amount).toLocaleString()}</td>
                        <td class="font-bold">${safeMathNumber(percentage).toFixed(1)}%</td>
                        <td class="font-bold">${currencySymbol}${safeMathNumber(monthlyAvg).toLocaleString()}</td>
                      </tr>
                    `;
                  }).join('')}
                <tr class="highlight-row">
                  <td class="font-bold">Total Income</td>
                  <td class="font-bold">${currencySymbol}${Object.values(incomeByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0).toLocaleString()}</td>
                  <td class="font-bold">100.0%</td>
                  <td class="font-bold">${currencySymbol}${safeMathNumber(Object.values(incomeByCategory).reduce((sum, val) => safeMathNumber(sum) + safeMathNumber(val), 0) / Math.max(1, monthlyTrends.length)).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              <p class="font-bold">No income data available</p>
              <p>Start recording income to see detailed breakdowns.</p>
            </div>
          `}
        </div>

        <!-- Financial Health -->
        <div class="section">
          <h2>🎯 Financial Health Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current Value</th>
                <th>Status</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">Total Income</td>
                <td class="income font-bold">+${currencySymbol}${safeMathNumber(monthlyStats.income).toLocaleString()}</td>
                <td><span class="${safeMathNumber(monthlyStats.income) > 0 ? 'status-settled' : 'status-pending'}">${safeMathNumber(monthlyStats.income) > 0 ? 'Active' : 'Needs Focus'}</span></td>
                <td>${safeMathNumber(monthlyStats.income) > 0 ? 'Diversify income sources' : 'Focus on income generation'}</td>
              </tr>
              <tr>
                <td class="font-bold">Total Expenses</td>
                <td class="expense font-bold">-${currencySymbol}${safeMathNumber(monthlyStats.expenses).toLocaleString()}</td>
                <td><span class="${safeMathNumber(monthlyStats.expenses) <= safeMathNumber(profile.monthlyBudget) ? 'status-settled' : 'status-pending'}">${safeMathNumber(monthlyStats.expenses) <= safeMathNumber(profile.monthlyBudget) ? 'Within Budget' : 'Over Budget'}</span></td>
                <td>${safeMathNumber(monthlyStats.expenses) <= safeMathNumber(profile.monthlyBudget) ? 'Maintain discipline' : 'Review and cut expenses'}</td>
              </tr>
              <tr>
                <td class="font-bold">Amount Borrowed</td>
                <td class="borrow font-bold">+${currencySymbol}${safeMathNumber(monthlyStats.borrowAmount).toLocaleString()}</td>
                <td><span class="${safeMathNumber(monthlyStats.borrowAmount) === 0 ? 'status-settled' : 'status-pending'}">${safeMathNumber(monthlyStats.borrowAmount) === 0 ? 'Debt Free' : 'Has Debt'}</span></td>
                <td>${safeMathNumber(monthlyStats.borrowAmount) === 0 ? 'Excellent! Stay debt-free' : 'Plan repayment strategy'}</td>
              </tr>
              <tr>
                <td class="font-bold">Amount Lent</td>
                <td class="lend font-bold">-${currencySymbol}${safeMathNumber(monthlyStats.lendAmount).toLocaleString()}</td>
                <td><span class="${safeMathNumber(pendingLends) === 0 ? 'status-settled' : 'status-pending'}">${safeMathNumber(pendingLends) === 0 ? 'No Pending' : 'Outstanding'}</span></td>
                <td>${safeMathNumber(pendingLends) === 0 ? 'Good liquidity management' : 'Follow up on collections'}</td>
              </tr>
              <tr class="highlight-row">
                <td class="font-bold">Net Cashflow</td>
                <td class="font-bold">${currencySymbol}${safeMathNumber(monthlyStats.cashflow).toLocaleString()}</td>
                <td><span class="${safeMathNumber(monthlyStats.cashflow) >= 0 ? 'status-settled' : 'status-pending'}">${safeMathNumber(monthlyStats.cashflow) >= 0 ? 'Positive Flow' : 'Negative Flow'}</span></td>
                <td>${safeMathNumber(monthlyStats.cashflow) >= 0 ? 'Consider investing surplus' : 'Urgent: Balance finances'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Transactions -->
        <div class="section">
          <h2>📋 Recent Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.length > 0 ? 
                filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(t => `
                    <tr>
                      <td class="font-bold">${new Date(t.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}</td>
                      <td>
                        <span class="${t.type}">
                          ${t.type === 'income' ? '💰' : t.type === 'expense' ? '💸' : t.type === 'borrow' ? '🔄' : t.type === 'lend' ? '🤝' : '↔️'} 
                          ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                        </span>
                      </td>
                      <td class="font-bold">${t.category || 'Uncategorized'}</td>
                      <td class="${t.type} font-bold">
                        ${t.type === 'transfer' ? '' : (t.type === 'income' || t.type === 'borrow' ? '+' : '-')}${currencySymbol}${safeMathNumber(t.amount).toLocaleString()}${t.type === 'transfer' && t.toAccount ? ` (${t.account} → ${t.toAccount})` : ''}
                      </td>
                      <td style="text-transform: capitalize;">${t.account || 'Unknown'}</td>
                      <td>
                        ${(t.type === 'borrow' || t.type === 'lend') ? 
                          `<span class="${t.settled ? 'status-settled' : 'status-pending'}">
                            ${t.settled ? 'Settled' : 'Pending'}
                          </span>` : 
                          '<span style="color: #666;">—</span>'
                        }
                      </td>
                      <td style="max-width: 150px; word-wrap: break-word; font-size: 10px;">${(t.notes || '—').substring(0, 50)}${t.notes && t.notes.length > 50 ? '...' : ''}</td>
                    </tr>
                  `).join('') :
                '<tr><td colspan="7" class="text-center no-data"><strong>No transactions found</strong><br>Start recording transactions to see your activity here.</td></tr>'
              }
            </tbody>
          </table>
          ${filteredTransactions.length > 0 ? `
            <div class="text-center" style="padding: 10px; background: #e8f5e8; border-radius: 6px; border: 1px solid #81c784; margin-top: 10px;">
              <p style="color: #388e3c; font-size: 11px; font-weight: bold;">
                ✅ Showing ${filteredTransactions.length} transactions for selected period
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>
            <div><strong>Report Summary:</strong> ${filteredTransactions.length} transactions analyzed across ${monthlyTrends.length} months</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
            <div><strong>Report ID:</strong> #MVR-${Date.now().toString().slice(-6)}</div>
            <div style="margin-top: 10px; font-size: 10px; opacity: 0.8;">
              © ${new Date().getFullYear()} MVault Financial Solutions - Your Premium Financial Companion
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    setProgress(90);
    setProgressText('Generating PDF file...');
    
    let uri;
    
    // Define fileName before using it
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `${profile.name || 'MVault'}_financial_report_${currentDate}.pdf`;
    
    if (Platform.OS === 'web') {
      try {
        console.log('Web platform detected, using html2pdf.js for direct download');
        
        if (typeof html2pdf === 'undefined') {
          throw new Error('PDF generation library not loaded. Please ensure html2pdf.js is included in your project.');
        }
        
        // Wait a moment to ensure html2pdf is fully loaded
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create a temporary div to hold the HTML content
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.width = '210mm';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.backgroundColor = 'white';
        
        // Append to body temporarily (required for html2pdf)
        document.body.appendChild(element);
        
        // PDF generation options optimized for compatibility
        const options = {
          margin: [10, 10, 10, 10],
          filename: fileName,
          image: { 
            type: 'jpeg', 
            quality: 0.85 
          },
          html2canvas: { 
            scale: 1,
            useCORS: true,
            letterRendering: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: false,
            removeContainer: true,
            scrollX: 0,
            scrollY: 0,
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123 // A4 height in pixels at 96 DPI
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        };
        
        console.log('Starting PDF generation with options:', options);
        
        // Generate PDF with comprehensive error handling
        try {
          await html2pdf()
            .set(options)
            .from(element)
            .save();
          
          console.log('PDF generated successfully');
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          throw new Error(`PDF generation failed: ${pdfError.message}`);
        } finally {
          // Remove the temporary element
          if (document.body.contains(element)) {
            document.body.removeChild(element);
          }
        }
        
        // Set a fake URI to satisfy the rest of the code
        uri = 'web-download-completed';
      } catch (error) {
        console.error('Web PDF generation error:', error);
        throw new Error(`Web PDF generation failed: ${error.message}. Please ensure html2pdf.js library is properly loaded.`);
      }
    } else {
      // For mobile platforms, use expo-print
      console.log('Generating PDF for mobile platform');
      
      try {
        const result = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
          width: 595, // A4 width at 72 DPI
          height: 842, // A4 height at 72 DPI
          margins: {
            left: 20,
            top: 20,
            right: 20,
            bottom: 20
          },
          orientation: 'portrait'
        });
        
        console.log('Mobile PDF generation result:', result);
        
        if (!result || !result.uri) {
          throw new Error('Failed to generate PDF: Result URI is undefined');
        }
        
        // Verify the file exists and has content
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        console.log('Generated PDF file info:', fileInfo);
        
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error('Generated PDF file is empty or does not exist');
        }
        
        uri = result.uri;
      } catch (printError) {
        console.error('Mobile PDF generation error:', printError);
        throw new Error(`Mobile PDF generation failed: ${printError.message}`);
      }
    }

    setProgress(100);
    setProgressText('Completed!');
    
    // Hide loading indicator
    setIsLoading(false);
    
    if (Platform.OS === 'web') {
      // For web, the download should have been initiated
      Alert.alert(
        'Success ✅', 
        'Your comprehensive financial report has been generated and downloaded successfully! The PDF includes:\n\n• Account Overview\n• Portfolio Analysis\n• Monthly Trends\n• Expense Breakdown\n• Income Analysis\n• Financial Health Summary\n• Transaction History\n\nCheck your Downloads folder for the file.'
      );
    } else {
      // For mobile, share the generated file
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Your Financial Report',
            UTI: 'com.adobe.pdf'
          });
        }
        Alert.alert(
          'Success ✅', 
          'Your comprehensive financial report has been generated successfully! The PDF includes all sections:\n\n• Portfolio Overview\n• Financial Trends\n• Expense & Income Analysis\n• Health Summary\n• Transaction History'
        );
      } catch (shareError) {
        console.error('Error sharing PDF:', shareError);
        Alert.alert(
          'Success ✅', 
          'PDF report generated successfully! You can find your comprehensive financial report in your device storage.'
        );
      }
    }
  } catch (error) {
    // Hide loading indicator on error
    setIsLoading(false);
    
    console.error('Error generating PDF:', error);
    
    // Provide specific error message
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    Alert.alert(
      'PDF Generation Error ❌', 
      `Failed to generate your financial report:\n\n${errorMessage}\n\nPossible solutions:\n• Ensure you have sufficient storage space\n• Try closing other apps\n• Check your internet connection\n• For web: Ensure PDF library is loaded\n\nIf the problem persists, try exporting your data as JSON instead.`
    );
  }
};
  const encryptData = (data: string, password: string): string => {
    // Create key from password
    const key = password.split('').map(char => char.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
    
    // Encrypt with password-based key
    const base64 = btoa(data);
    return base64.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) + key + (index % 10))
    ).join('');
  };

  const decryptData = (encryptedData: string, password: string): string => {
    // Create same key from password
    const key = password.split('').map(char => char.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
    
    // Decrypt with password-based key
    const shifted = encryptedData.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) - key - (index % 10))
    ).join('');
    return atob(shifted);
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [passwordAction, setPasswordAction] = useState(''); // 'export' or 'import'
  const [pendingImportData, setPendingImportData] = useState(null);

  const handleExportData = async () => {
    setPasswordAction('export');
    setExportPassword('');
    setShowPasswordModal(true);
  };

  const performExport = async (password: string) => {
    try {
      const completeData = {
        profile: profile,
        accounts: accounts,
        transactions: transactions,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonData = JSON.stringify(completeData, null, 2);
      const encryptedData = encryptData(jsonData, password);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${profile.name}_mvault_backup_${currentDate}.txt`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Encrypted backup exported successfully!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, encryptedData);
        
        // Use sharing to save to device
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/octet-stream',
            dialogTitle: 'Save Backup File'
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleSecureAction = (action: string) => {
    setPendingAction(action);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (pin: string) => {
    try {
      console.log('Verifying PIN for action:', pendingAction);
      
      // Verify PIN before proceeding with secure action
      const isAuthenticated = await authenticate(pin);
      console.log('Authentication result:', isAuthenticated);
      
      if (!isAuthenticated) {
        Alert.alert('Error', 'Invalid PIN');
        setPendingAction('');
        return;
      }

      // Re-authenticate after PIN verification to ensure state is updated
      setAuthenticated(true);
      
      if (pendingAction === 'exportPDF') {
        setShowDateRangeModal(true);
      } else if (pendingAction === 'clearData') {
        Alert.alert(
          'Clear All Data',
          'This will permanently delete all your transactions, accounts, and profile data. This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete All', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await clearAllData();
                  Alert.alert('Success', 'All data has been cleared');
                } catch (error) {
                  console.error('Error clearing data:', error);
                  Alert.alert('Error', 'Failed to clear data');
                }
              }
            }
          ]
        );
      }
      setPendingAction('');
    } catch (error) {
      console.error('Error in secure action:', error);
      Alert.alert('Error', 'An error occurred while processing your request');
      setPendingAction('');
    }
  };

  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView style={themedStyles.container} showsVerticalScrollIndicator={false}>
      {isLoading && (
        <View style={themedStyles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={themedStyles.loadingText}>Generating your financial report...</Text>
          <View style={themedStyles.progressContainer}>
            <View style={[themedStyles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={themedStyles.progressText}>{progressText}</Text>
        </View>
      )}
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Settings</Text>
      </View>

      {/* Rest of the component remains the same */}
      {/* Profile Section */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Profile</Text>
        <View style={themedStyles.profileCard}>
          <View style={themedStyles.avatarContainer}>
            <ProfileImage
              uri={profile.avatarUri}
              name={profile.name}
              size={80}
              editable={true}
              onImageChange={handleImageChange}
            />
          </View>
          
          {editingProfile ? (
            <View style={themedStyles.editForm}>
              <TextInput
                style={themedStyles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
              />
              <TextInput
                style={themedStyles.input}
                value={tempEmail}
                onChangeText={setTempEmail}
                placeholder="Your email (optional)"
                keyboardType="email-address"
                placeholderTextColor={colors.muted}
              />
              <TextInput
                style={themedStyles.input}
                value={tempBudget}
                onChangeText={setTempBudget}
                placeholder="Monthly budget"
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
              />
              <View style={themedStyles.editButtons}>
                <TouchableOpacity 
                  style={[themedStyles.button, themedStyles.cancelButton]} 
                  onPress={() => {
                    setEditingProfile(false);
                    setTempName(profile.name);
                    setTempEmail(profile.email || '');
                    setTempBudget(profile.monthlyBudget.toString());
                  }}
                >
                  <Text style={themedStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[themedStyles.button, themedStyles.saveButton]} 
                  onPress={handleSaveProfile}
                >
                  <Text style={themedStyles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={themedStyles.profileInfo}>
              <Text style={themedStyles.profileName}>
                {profile.name || 'Set your name'}
              </Text>
              <Text style={themedStyles.profileEmail}>
                {profile.email || 'No email set'}
              </Text>
              <Text style={themedStyles.profileBudget}>
                Monthly Budget: {getCurrencySymbol()}{profile.monthlyBudget.toFixed(2)}
              </Text>
              <TouchableOpacity 
                style={themedStyles.editProfileButton}
                onPress={() => setEditingProfile(true)}
              >
                <Icon name="create-outline" size={16} style={themedStyles.editIcon} />
                <Text style={themedStyles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
 {/* Appearance Section */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Appearance</Text>
        <View style={themedStyles.settingItem}>
          <View style={themedStyles.settingLeft}>
            <Icon name="moon-outline" size={24} style={themedStyles.settingIcon} />
            <View>
              <Text style={themedStyles.settingTitle}>Dark Mode</Text>
              <Text style={themedStyles.settingSubtitle}>
                {theme === 'dark' ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e9ecef', true: '#667eea' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      {/* Currency Section */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Currency</Text>
        <TouchableOpacity style={themedStyles.settingItem} onPress={() => setShowCurrencyModal(true)}>
          <View style={themedStyles.settingLeft}>
            <Icon name="globe-outline" size={24} style={themedStyles.settingIcon} />
            <View>
              <Text style={themedStyles.settingTitle}>Currency</Text>
              <Text style={themedStyles.settingSubtitle}>
                {currencies.find(c => c.code === profile.currency)?.name} ({getCurrencySymbol()})
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} style={themedStyles.chevron} />
        </TouchableOpacity>
      </View>

      {/* Statistics Section */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Statistics</Text>
        <View style={themedStyles.statsGrid}>
          <View style={themedStyles.statCard}>
            <Icon name="receipt-outline" size={24} style={themedStyles.statIcon} />
            <Text style={themedStyles.statValue}>{totalTransactions}</Text>
            <Text style={themedStyles.statLabel}>Transactions</Text>
          </View>
          <View style={themedStyles.statCard}>
            <Icon name="trending-up" size={24} style={[themedStyles.statIcon, { color: colors.success }]} />
            <Text style={[themedStyles.statValue, { color: colors.success }]}>
              {getCurrencySymbol()}{totalIncome.toFixed(2)}
            </Text>
            <Text style={themedStyles.statLabel}>Total Income</Text>
          </View>
          <View style={themedStyles.statCard}>
            <Icon name="trending-down" size={24} style={[themedStyles.statIcon, { color: colors.error }]} />
            <Text style={[themedStyles.statValue, { color: colors.error }]}>
              {getCurrencySymbol()}{totalExpenses.toFixed(2)}
            </Text>
            <Text style={themedStyles.statLabel}>Total Expenses</Text>
          </View>
          <View style={themedStyles.statCard}>
            <Icon name="wallet-outline" size={24} style={[themedStyles.statIcon, { color: colors.primary }]} />
            <Text style={[themedStyles.statValue, { color: colors.primary }]}>
              {getCurrencySymbol()}{(accounts.cash + accounts.bank).toFixed(2)}
            </Text>
            <Text style={themedStyles.statLabel}>Net Worth</Text>
          </View>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={themedStyles.settingItem} onPress={() => handleSecureAction('exportPDF')}>
          <View style={themedStyles.settingLeft}>
            <Icon name="document-text-outline" size={24} style={themedStyles.settingIcon} />
            <View>
              <Text style={themedStyles.settingTitle}>Export Detailed PDF Report</Text>
              <Text style={themedStyles.settingSubtitle}>Complete report with all transactions</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} style={themedStyles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity style={themedStyles.settingItem} onPress={handleExportData}>
          <View style={themedStyles.settingLeft}>
            <Icon name="download-outline" size={24} style={themedStyles.settingIcon} />
            <View>
              <Text style={themedStyles.settingTitle}>Export Data</Text>
              <Text style={themedStyles.settingSubtitle}>Download your data as JSON</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} style={themedStyles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity 
           style={themedStyles.settingItem} 
           onPress={async () => {
             if (Platform.OS === 'web') {
               // For web, create a file input element
               const fileInput = document.createElement('input');
               fileInput.type = 'file';
               fileInput.accept = '.json,application/json';
               fileInput.style.display = 'none';
               document.body.appendChild(fileInput);
               
               fileInput.onchange = async (event) => {
                 try {
                   const file = event.target.files[0];
                   if (!file) return;
                   
                   // Check if file is MVault backup
                   if (!file.name.endsWith('.txt') || !file.name.includes('mvault_backup')) {
                     Alert.alert('Error', 'Please select a MVault backup file (.txt)');
                     return;
                   }
                   
                   const reader = new FileReader();
                   reader.onload = async (e) => {
                     setPendingImportData(e.target.result);
                     setPasswordAction('import');
                     setImportPassword('');
                     setShowPasswordModal(true);
                   };
                   reader.readAsText(file);
                 } catch (error) {
                   console.error('Import error:', error);
                   Alert.alert('Error', 'Failed to import data');
                 } finally {
                   document.body.removeChild(fileInput);
                 }
               };
               
               fileInput.click();
             } else {
               // For mobile, use DocumentPicker
               try {
                 const result = await DocumentPicker.getDocumentAsync({
                   type: '*/*',
                   copyToCacheDirectory: true
                 });
                 
                 if (result.canceled) return;
                 
                 // Check if file is MVault backup
                 const fileUri = result.assets[0].uri;
                 const fileName = result.assets[0].name;
                 
                 if (!fileName.endsWith('.txt') || !fileName.includes('mvault_backup')) {
                   Alert.alert('Error', 'Please select a MVault backup file (.txt)');
                   return;
                 }
                 
                 const encryptedContent = await FileSystem.readAsStringAsync(fileUri);
                 setPendingImportData(encryptedContent);
                 setPasswordAction('import');
                 setImportPassword('');
                 setShowPasswordModal(true);
               } catch (error) {
                 console.error('Import error:', error);
                 Alert.alert('Error', 'Failed to import data');
               }
             }
           }}
         >
          <View style={themedStyles.settingLeft}>
            <Icon name="cloud-upload-outline" size={24} style={themedStyles.settingIcon} />
            <View>
              <Text style={themedStyles.settingTitle}>Import Data</Text>
              <Text style={themedStyles.settingSubtitle}>Restore from JSON backup</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} style={themedStyles.chevron} />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Danger Zone</Text>
        <View style={themedStyles.dangerZone}>
          <TouchableOpacity style={themedStyles.dangerItem} onPress={() => {
          setPendingAction('clearData');
          setShowPinModal(true);
        }}>
            <View style={themedStyles.settingLeft}>
              <Icon name="trash-outline" size={24} style={[themedStyles.settingIcon, { color: colors.error }]} />
              <View>
                <Text style={[themedStyles.settingTitle, { color: colors.error }]}>Clear All Data</Text>
                <Text style={themedStyles.settingSubtitle}>Permanently delete everything</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} style={[themedStyles.chevron, { color: colors.error }]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={themedStyles.footer}>
        <Text style={themedStyles.footerText}>MVault v1.0</Text>
        <Text style={themedStyles.footerSubtext}>Made with ❤️ for offline-first expense tracking</Text>
      </View>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContainer}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Icon name="close" size={24} style={themedStyles.closeIcon} />
              </TouchableOpacity>
            </View>
            <ScrollView style={themedStyles.currencyList}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    themedStyles.currencyItem,
                    profile.currency === currency.code && themedStyles.currencyItemActive
                  ]}
                  onPress={() => handleCurrencyChange(currency.code)}
                >
                  <Text style={themedStyles.currencySymbol}>{currency.symbol}</Text>
                  <View style={themedStyles.currencyInfo}>
                    <Text style={themedStyles.currencyName}>{currency.name}</Text>
                    <Text style={themedStyles.currencyCode}>{currency.code}</Text>
                  </View>
                  {profile.currency === currency.code && (
                    <Icon name="checkmark" size={20} style={themedStyles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}



      {/* Date Range Modal */}
      {showDateRangeModal && (
        <Modal
          visible={showDateRangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDateRangeModal(false)}
        >
          <View style={themedStyles.modalOverlay}>
            <View style={themedStyles.dateRangeModal}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Select Report Period</Text>
              <TouchableOpacity onPress={() => setShowDateRangeModal(false)}>
                <Icon name="close" size={24} style={themedStyles.closeIcon} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[themedStyles.dateRangeOption, selectedDateRange === 'complete' && themedStyles.dateRangeOptionActive]}
              onPress={() => setSelectedDateRange('complete')}
            >
              <Text style={[themedStyles.dateRangeText, selectedDateRange === 'complete' && themedStyles.dateRangeTextActive]}>Complete Data</Text>
              <Text style={themedStyles.dateRangeSubtext}>All transactions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.dateRangeOption, selectedDateRange === 'yearly' && themedStyles.dateRangeOptionActive]}
              onPress={() => setSelectedDateRange('yearly')}
            >
              <Text style={[themedStyles.dateRangeText, selectedDateRange === 'yearly' && themedStyles.dateRangeTextActive]}>Current Year</Text>
              <Text style={themedStyles.dateRangeSubtext}>From January {new Date().getFullYear()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.dateRangeOption, selectedDateRange === 'monthly' && themedStyles.dateRangeOptionActive]}
              onPress={() => setSelectedDateRange('monthly')}
            >
              <Text style={[themedStyles.dateRangeText, selectedDateRange === 'monthly' && themedStyles.dateRangeTextActive]}>Current Month</Text>
              <Text style={themedStyles.dateRangeSubtext}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.dateRangeOption, selectedDateRange === 'custom' && themedStyles.dateRangeOptionActive]}
              onPress={() => setSelectedDateRange('custom')}
            >
              <Text style={[themedStyles.dateRangeText, selectedDateRange === 'custom' && themedStyles.dateRangeTextActive]}>Custom Range</Text>
              <Text style={themedStyles.dateRangeSubtext}>Select start and end dates</Text>
            </TouchableOpacity>
            
            {selectedDateRange === 'custom' && (
              <View style={{ marginTop: 16 }}>
                <TouchableOpacity 
                  style={themedStyles.datePickerButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={themedStyles.dateLabel}>Start Date:</Text>
                  <Text style={themedStyles.dateDisplay}>{customStartDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={themedStyles.datePickerButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={themedStyles.dateLabel}>End Date:</Text>
                  <Text style={themedStyles.dateDisplay}>{customEndDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                
                {showStartPicker && (
                  <DateTimePicker
                    value={customStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowStartPicker(false);
                      if (selectedDate) setCustomStartDate(selectedDate);
                    }}
                  />
                )}
                
                {showEndPicker && (
                  <DateTimePicker
                    value={customEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowEndPicker(false);
                      if (selectedDate) setCustomEndDate(selectedDate);
                    }}
                  />
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={themedStyles.generateButton}
              onPress={async () => {
                setShowDateRangeModal(false);
                if (selectedDateRange === 'custom') {
                  await generateDetailedPDF(selectedDateRange, customStartDate, customEndDate);
                } else {
                  await generateDetailedPDF(selectedDateRange);
                }
              }}
            >
              <Text style={themedStyles.generateButtonText}>Generate Report</Text>
            </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={themedStyles.modalOverlay}>
            <View style={themedStyles.dateRangeModal}>
              <View style={themedStyles.modalHeader}>
                <Text style={themedStyles.modalTitle}>
                  {passwordAction === 'export' ? 'Set Export Password' : 'Enter Import Password'}
                </Text>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <Icon name="close" size={24} style={themedStyles.closeIcon} />
                </TouchableOpacity>
              </View>
              
              <Text style={themedStyles.dateRangeSubtext}>
                {passwordAction === 'export' 
                  ? 'Create a password to encrypt your backup file'
                  : 'Enter the password used to encrypt this backup'
                }
              </Text>
              
              <TextInput
                style={themedStyles.passwordInput}
                placeholder="Enter password"
                value={passwordAction === 'export' ? exportPassword : importPassword}
                onChangeText={passwordAction === 'export' ? setExportPassword : setImportPassword}
                secureTextEntry
                autoFocus
              />
              
              <TouchableOpacity 
                style={themedStyles.generateButton}
                onPress={async () => {
                  const password = passwordAction === 'export' ? exportPassword : importPassword;
                  if (!password) {
                    Alert.alert('Error', 'Please enter a password');
                    return;
                  }
                  
                  setShowPasswordModal(false);
                  
                  if (passwordAction === 'export') {
                    await performExport(password);
                  } else {
                    try {
                      const decryptedText = decryptData(pendingImportData, password);
                      const backupData = JSON.parse(decryptedText);
                      
                      // Clear all data first
                      await clearAllData();
                      
                      // Import profile with all data
                      await setProfile(backupData.profile);
                      await updateAccounts(backupData.accounts);
                      
                      // Import transactions
                      for (const transaction of backupData.transactions) {
                        await useExpenseStore.getState().addTransaction(transaction);
                      }
                      
                      Alert.alert('Success', 'Complete backup restored successfully!');
                    } catch (error) {
                      console.error('Import error:', error);
                      Alert.alert('Error', 'Wrong password or corrupted file');
                    }
                  }
                  
                  setPendingImportData(null);
                }}
              >
                <Text style={themedStyles.generateButtonText}>
                  {passwordAction === 'export' ? 'Export' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingAction('');
        }}
        onSuccess={handlePinSuccess}
        onAuthenticate={authenticate}
        title="Security Verification"
        subtitle="Enter your PIN to continue"
      />
       {/* Continue with the rest of the sections... */}
      {/* The rest of your component code remains exactly the same */}
    </ScrollView>
  );
}

// Create themed styles function
const createStyles = (colors, isDark) => ({  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
     color: colors.white,
     marginTop: 12,
     fontSize: 16,
     fontWeight: '500',
   },
   progressContainer: {
     width: '80%',
     height: 10,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 5,
     marginTop: 20,
     overflow: 'hidden',
   },
   progressBar: {
     height: '100%',
     backgroundColor: colors.primary,
     borderRadius: 5,
   },
   progressText: {
     color: colors.white,
     marginTop: 8,
     fontSize: 14,
   },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profileBudget: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.card : colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editIcon: {
    color: colors.primary,
    marginRight: 6,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  editForm: {
    width: '100%',
  },
  input: {
    backgroundColor: isDark ? colors.card : colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: isDark ? colors.card : colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    color: colors.primary,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chevron: {
    color: colors.muted,
  },
  dangerZone: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dangerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  dateRangeModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeIcon: {
    color: colors.textSecondary,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: isDark ? colors.card : colors.background,
  },
  currencyItemActive: {
    backgroundColor: isDark ? colors.primary + '20' : colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
    textAlign: 'center',
    marginRight: 16,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  currencyCode: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkIcon: {
    color: colors.primary,
  },
  dateRangeOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: isDark ? colors.card : colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRangeOptionActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dateRangeTextActive: {
    color: colors.primary,
  },
  dateRangeSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  dateDisplay: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
    padding: 8,
    backgroundColor: isDark ? colors.card : colors.background,
    borderRadius: 8,
  },
  datePickerButton: {
    padding: 12,
    backgroundColor: isDark ? colors.card : colors.background,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  generateButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInput: {
    backgroundColor: isDark ? colors.card : colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// For backward compatibility
const styles = StyleSheet.create(createStyles(getThemeColors('light'), false));

export default SettingsScreen;