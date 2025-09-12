import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useExpenseStore } from '../stores/useExpenseStore';
import Icon from '../components/Icon';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

function SetupScreen() {
  const { setProfile, addAccount, profile, accounts, getAccountsList } = useExpenseStore();
  const [step, setStep] = useState(profile.name ? 2 : 1); // Skip to PIN if data exists
  const [formData, setFormData] = useState({
    name: profile.name || '',
    pin: '',
    confirmPin: '',
    monthlyBudget: profile.monthlyBudget ? profile.monthlyBudget.toString() : '',
    currency: profile.currency || 'USD',
  });
  
  const [accountsData, setAccountsData] = useState([
    { name: 'Cash', type: 'cash', balance: '' },
    { name: 'Bank', type: 'bank', balance: '' },
  ]);
  
  // Load existing accounts on component mount
  useEffect(() => {
    const existingAccounts = getAccountsList();
    if (existingAccounts.length > 0) {
      setAccountsData(existingAccounts.map(acc => ({
        name: acc.name,
        type: acc.type,
        balance: acc.balance.toString()
      })));
    }
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.pin.length !== 4) {
        Alert.alert('Error', 'PIN must be 4 digits');
        return;
      }
      if (formData.pin !== formData.confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.monthlyBudget || parseFloat(formData.monthlyBudget) <= 0) {
        Alert.alert('Error', 'Please enter a valid monthly budget');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      // Save profile
      await setProfile({
        name: formData.name,
        pin: formData.pin,
        monthlyBudget: parseFloat(formData.monthlyBudget),
        currency: formData.currency,
        theme: 'light',
        isSetupComplete: true,
      });

      // Save initial accounts (only if no accounts exist)
      const existingAccounts = getAccountsList();
      if (existingAccounts.length === 0) {
        for (const accountData of accountsData) {
          if (accountData.name.trim()) {
            await addAccount({
              name: accountData.name.trim(),
              type: accountData.type as 'cash' | 'bank' | 'savings' | 'credit' | 'investment' | 'other',
              balance: parseFloat(accountData.balance) || 0,
            });
          }
        }
      }

      console.log('Setup completed successfully');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing setup:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handlePinInput = (value: string, field: 'pin' | 'confirmPin') => {
    // Only allow numbers and limit to 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  const selectedCurrency = currencies.find(c => c.code === formData.currency);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MVault</Text>
          <Text style={styles.subtitle}>Let&apos;s set up your profile</Text>
          
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((stepNumber) => (
              <View
                key={stepNumber}
                style={[
                  styles.progressDot,
                  step >= stepNumber && styles.progressDotActive
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.formContainer}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIcon}>
                <Icon name="person" size={32} style={styles.stepIconStyle} />
              </View>
              <Text style={styles.stepTitle}>What&apos;s your name?</Text>
              <Text style={styles.stepSubtitle}>This will be displayed in your profile</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                placeholderTextColor="#bdc3c7"
                autoFocus
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIcon}>
                <Icon name="lock-closed" size={32} style={styles.stepIconStyle} />
              </View>
              <Text style={styles.stepTitle}>{profile.name ? 'Set up your PIN' : 'Set up your PIN'}</Text>
              <Text style={styles.stepSubtitle}>{profile.name ? 'Enter your PIN to secure transactions' : 'This will secure your transactions'}</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter 4-digit PIN"
                value={formData.pin}
                onChangeText={(value) => handlePinInput(value, 'pin')}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholderTextColor="#bdc3c7"
                autoFocus
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                value={formData.confirmPin}
                onChangeText={(value) => handlePinInput(value, 'confirmPin')}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholderTextColor="#bdc3c7"
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIcon}>
                <Icon name="wallet" size={32} style={styles.stepIconStyle} />
              </View>
              <Text style={styles.stepTitle}>Set your monthly budget</Text>
              <Text style={styles.stepSubtitle}>This helps track your spending goals</Text>
              
              <View style={styles.currencyContainer}>
                <Text style={styles.currencyLabel}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                  {currencies.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.currencyOption,
                        formData.currency === currency.code && styles.currencyOptionActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, currency: currency.code }))}
                    >
                      <Text style={[
                        styles.currencySymbol,
                        formData.currency === currency.code && styles.currencySymbolActive
                      ]}>
                        {currency.symbol}
                      </Text>
                      <Text style={[
                        styles.currencyCode,
                        formData.currency === currency.code && styles.currencyCodeActive
                      ]}>
                        {currency.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.inputWithSymbol}>
                <Text style={styles.currencySymbolInput}>{selectedCurrency?.symbol}</Text>
                <TextInput
                  style={styles.inputWithCurrency}
                  placeholder="Enter budget"
                  value={formData.monthlyBudget}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, monthlyBudget: value }))}
                  keyboardType="numeric"
                  placeholderTextColor="#bdc3c7"
                  autoFocus
                />
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIcon}>
                <Icon name="card" size={32} style={styles.stepIconStyle} />
              </View>
              <Text style={styles.stepTitle}>Initial account balances</Text>
              <Text style={styles.stepSubtitle}>Enter your current cash and bank balances</Text>
              
              <Text style={styles.inputLabel}>Cash Balance</Text>
              <View style={styles.inputWithSymbol}>
                <Text style={styles.currencySymbolInput}>{selectedCurrency?.symbol}</Text>
                <TextInput
                  style={styles.inputWithCurrency}
                  placeholder="Enter amount"
                  value={accountsData[0]?.balance || ''}
                  onChangeText={(value) => {
                    const newAccounts = [...accountsData];
                    newAccounts[0] = { ...newAccounts[0], balance: value };
                    setAccountsData(newAccounts);
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#bdc3c7"
                />
              </View>
              
              <Text style={styles.inputLabel}>Bank Balance</Text>
              <View style={styles.inputWithSymbol}>
                <Text style={styles.currencySymbolInput}>{selectedCurrency?.symbol}</Text>
                <TextInput
                  style={styles.inputWithCurrency}
                  placeholder="Enter amount"
                  value={accountsData[1]?.balance || ''}
                  onChangeText={(value) => {
                    const newAccounts = [...accountsData];
                    newAccounts[1] = { ...newAccounts[1], balance: value };
                    setAccountsData(newAccounts);
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#bdc3c7"
                />
              </View>
              
              {accountsData.slice(2).map((account, index) => (
                <View key={index + 2}>
                  <View style={styles.accountHeader}>
                    <TextInput
                      style={styles.accountNameInput}
                      placeholder="Account name"
                      value={account.name}
                      onChangeText={(value) => {
                        const newAccounts = [...accountsData];
                        newAccounts[index + 2].name = value;
                        setAccountsData(newAccounts);
                      }}
                      placeholderTextColor="#bdc3c7"
                    />
                    <TouchableOpacity
                      style={styles.deleteAccountButton}
                      onPress={() => {
                        const newAccounts = accountsData.filter((_, i) => i !== index + 2);
                        setAccountsData(newAccounts);
                      }}
                    >
                      <Icon name="trash" size={16} style={styles.deleteIcon} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.inputWithSymbol}>
                    <Text style={styles.currencySymbolInput}>{selectedCurrency?.symbol}</Text>
                    <TextInput
                      style={styles.inputWithCurrency}
                      placeholder="Enter amount"
                      value={account.balance}
                      onChangeText={(value) => {
                        const newAccounts = [...accountsData];
                        newAccounts[index + 2].balance = value;
                        setAccountsData(newAccounts);
                      }}
                      keyboardType="numeric"
                      placeholderTextColor="#bdc3c7"
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={() => {
                  setAccountsData([...accountsData, { name: '', type: 'other', balance: '' }]);
                }}
              >
                <Icon name="add" size={20} style={styles.addAccountIcon} />
                <Text style={styles.addAccountText}>Add Another Account</Text>
              </TouchableOpacity>
            </View>
          )}



          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Complete Setup' : 'Next'}
            </Text>
            <Icon name="arrow-forward" size={20} style={styles.nextButtonIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    flex: 1,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconStyle: {
    color: '#667eea',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
  currencyContainer: {
    width: '100%',
    marginBottom: 24,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  currencyScroll: {
    marginBottom: 16,
  },
  currencyOption: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  currencyOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  currencySymbolActive: {
    color: 'white',
  },
  currencyCode: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  currencyCodeActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputWithSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
    width: '100%',
  },
  currencySymbolInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    paddingLeft: 16,
    paddingRight: 8,
  },
  inputWithCurrency: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#2c3e50',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  nextButtonIcon: {
    color: 'white',
  },

  accountItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountNameInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteAccountButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#dc3545',
    borderRadius: 6,
  },
  deleteIcon: {
    color: 'white',
  },
  accountTypeContainer: {
    marginBottom: 12,
  },
  accountTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  accountTypeButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  accountTypeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  accountTypeText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  accountTypeTextActive: {
    color: 'white',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addAccountIcon: {
    color: '#667eea',
    marginRight: 8,
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  reviewContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default SetupScreen;