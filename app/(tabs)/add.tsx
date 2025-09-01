import React, { useState, Platform } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { categories } from '../../utils/helpers';
import { useExpenseStore } from '../../stores/useExpenseStore';
import PinModal from '../../components/PinModal';
import SuccessModal from '../../components/SuccessModal';
import Icon from '../../components/Icon';

type TransactionType = 'income' | 'expense' | 'borrow' | 'lend' | 'transfer';
// Remove AccountType as we'll use dynamic accounts

const getTypeIcon = (type: TransactionType): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
  switch (type) {
    case 'income': return 'trending-up';
    case 'expense': return 'trending-down';
    case 'borrow': return 'arrow-down-circle';
    case 'lend': return 'arrow-up-circle';
    case 'transfer': return 'swap-horizontal';
  }
};

function AddTransactionScreen() {
  const { addTransaction, authenticate, profile, getAccountsList } = useExpenseStore();
  const isDark = profile.theme === 'dark';
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<string>('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [person, setPerson] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  const getCurrencySymbol = () => {
    const currencies: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
    };
    return currencies[profile.currency] || '$';
  };

  const handleSubmit = () => {
    if (type !== 'transfer' && !category.trim()) {
      Alert.alert('Error', 'Please enter a category');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (type === 'transfer') {
      const { accounts } = useExpenseStore.getState();
      const transferAmount = parseFloat(amount);
      const selectedAccount = accounts[account];
      if (selectedAccount && selectedAccount.balance < transferAmount) {
        Alert.alert('Error', `Insufficient funds in ${selectedAccount.name} account`);
        return;
      }
    }

    if ((type === 'borrow' || type === 'lend') && !person.trim()) {
      Alert.alert('Error', `Please enter who you ${type === 'borrow' ? 'borrowed from' : 'lent to'}`);
      return;
    }

    const transactionData = {
      type,
      category: type === 'transfer' ? `Transfer from ${accounts[account]?.name || account} to ${getToAccountName()}` : category.trim(),
      amount: parseFloat(amount),
      account,
      toAccount: type === 'transfer' ? getToAccount() : undefined,
      date: date.toISOString().split('T')[0],
      notes: notes.trim(),
      settled: false,
      person: (type === 'borrow' || type === 'lend') ? person.trim() : undefined,
    };

    // Store transaction data and show PIN modal
    setPendingTransaction(transactionData);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (pin: string) => {
    if (pendingTransaction) {
      try {
        // Verify PIN before adding transaction
        const isAuthenticated = authenticate(pin);
        if (!isAuthenticated) {
          Alert.alert('Error', 'Invalid PIN');
          return;
        }
        
        await addTransaction(pendingTransaction);
        
        // Reset form
        setCategory('');
        setAmount('');
        setNotes('');
        setDate(new Date());
        setPerson('');
        setPendingTransaction(null);
        
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error adding transaction:', error);
        Alert.alert('Error', 'Failed to add transaction');
      }
    }
  };

  const transactionTypes = [
    { key: 'income', label: 'Income', color: '#4CAF50' },
    { key: 'expense', label: 'Expense', color: '#F44336' },
    { key: 'borrow', label: 'Borrow', color: '#FF9800' },
    { key: 'lend', label: 'Lend', color: '#2196F3' },
    { key: 'transfer', label: 'Transfer', color: '#9C27B0' },
  ];

  const accountsList = getAccountsList();
  
  // Set default account if none selected
  React.useEffect(() => {
    if (!account && accountsList.length > 0) {
      setAccount(accountsList[0].id);
    }
  }, [accountsList, account]);
  
  const getToAccount = () => {
    const availableAccounts = accountsList.filter(acc => acc.id !== account);
    return availableAccounts.length > 0 ? availableAccounts[0].id : '';
  };
  
  const getToAccountName = () => {
    const toAccountId = getToAccount();
    const toAccount = accountsList.find(acc => acc.id === toAccountId);
    return toAccount?.name || 'Other Account';
  };
  
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return 'cash';
      case 'bank': return 'card';
      case 'savings': return 'wallet';
      case 'credit': return 'card-outline';
      case 'investment': return 'trending-up';
      default: return 'wallet-outline';
    }
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <Text style={styles.headerSubtitle}>Record your financial activity</Text>
        </View>

        {/* Transaction Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeGrid}>
            {transactionTypes.map((typeOption) => (
              <TouchableOpacity
                key={typeOption.key}
                style={[
                  styles.typeButton,
                  type === typeOption.key && { backgroundColor: typeOption.color }
                ]}
                onPress={() => setType(typeOption.key as TransactionType)}
              >
                <Icon 
                  name={getTypeIcon(typeOption.key as TransactionType)} 
                  size={24} 
                  style={[
                    styles.typeIcon,
                    { color: type === typeOption.key ? 'white' : typeOption.color }
                  ]} 
                />
                <Text style={[
                  styles.typeLabel,
                  { color: type === typeOption.key ? 'white' : '#2c3e50' }
                ]}>
                  {typeOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#bdc3c7"
            />
          </View>
        </View>

        {/* Category Input */}
        {type !== 'transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Food, Transport, Salary"
              value={category}
              onChangeText={setCategory}
              placeholderTextColor="#bdc3c7"
            />
            
            {/* Quick Category Suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySuggestions}>
              {categories[type]?.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryChip}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryChipText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{type === 'transfer' ? 'From Account' : 'Account'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
            {accountsList.map((accountOption) => (
              <TouchableOpacity
                key={accountOption.id}
                style={[
                  styles.accountButton,
                  account === accountOption.id && styles.accountButtonActive,
                  account === accountOption.id && {
                    backgroundColor: '#667eea'
                  }
                ]}
                onPress={() => setAccount(accountOption.id)}
              >
                <Icon 
                  name={getAccountIcon(accountOption.type) as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap} 
                  size={24} 
                  style={[
                    styles.accountIcon,
                    { color: account === accountOption.id ? 'white' : '#667eea' }
                  ]} 
                />
                <Text style={[
                  styles.accountLabel,
                  { color: account === accountOption.id ? 'white' : '#2c3e50' }
                ]}>
                  {accountOption.name}
                </Text>
                <Text style={[
                  styles.accountBalance,
                  { color: account === accountOption.id ? 'rgba(255,255,255,0.8)' : '#7f8c8d' }
                ]}>
                  {getCurrencySymbol()}{accountOption.balance.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transfer Info */}
        {type === 'transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transfer To</Text>
            <View style={[styles.input, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 16, color: '#2c3e50', fontWeight: '500' }}>
                {getToAccountName()}
              </Text>
            </View>
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Icon name="calendar" size={20} style={styles.dateIcon} />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Person Field (for Borrow/Lend) */}
        {(type === 'borrow' || type === 'lend') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {type === 'borrow' ? 'Borrowed From' : 'Lent To'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={type === 'borrow' ? "Who did you borrow from?" : "Who did you lend to?"}
              value={person}
              onChangeText={setPerson}
              placeholderTextColor="#bdc3c7"
            />
          </View>
        )}

        {/* Notes Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add any additional details..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor="#bdc3c7"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="add" size={24} style={styles.submitIcon} />
            <Text style={styles.submitText}>Add Transaction</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingTransaction(null);
        }}
        onSuccess={handlePinSuccess}
        onAuthenticate={authenticate}
        title="Confirm Transaction"
        subtitle="Enter your PIN to add this transaction"
      />
      
      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message="Transaction added successfully!"
      />
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#7f8c8d',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  typeIcon: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    paddingLeft: 20,
    paddingRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    paddingVertical: 20,
    paddingRight: 20,
  },
  input: {
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: isDark ? '#ffffff' : '#2c3e50',
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySuggestions: {
    marginTop: 12,
  },
  categoryChip: {
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  accountScroll: {
    marginBottom: 12,
  },
  accountButton: {
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    marginRight: 12,
    minWidth: 120,
  },
  accountButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  accountIcon: {
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  dateIcon: {
    color: '#667eea',
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#2c3e50',
    fontWeight: '500',
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  submitIcon: {
    color: 'white',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AddTransactionScreen;