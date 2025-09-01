import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useExpenseStore } from '../stores/useExpenseStore';
import Icon from './Icon';

interface AccountManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountManager({ visible, onClose }: AccountManagerProps) {
  const { 
    getAccountsList, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    profile,
    transactions 
  } = useExpenseStore();
  
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    balance: '0'
  });

  const accountsList = getAccountsList();
  const isDark = profile.theme === 'dark';

  const getCurrencySymbol = () => {
    const currencies: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹', 'CAD': 'C$', 'AUD': 'A$'
    };
    return currencies[profile.currency] || '$';
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

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'other', balance: '0' });
    setShowForm(true);
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString()
    });
    setShowForm(true);
  };

  const handleSaveAccount = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: formData.name.trim(),
          type: formData.type as any,
          balance: parseFloat(formData.balance) || 0,
        });
        Alert.alert('Success', 'Account updated successfully!');
      } else {
        await addAccount({
          name: formData.name.trim(),
          type: formData.type as any,
          balance: parseFloat(formData.balance) || 0,
        });
        Alert.alert('Success', 'Account added successfully!');
      }
      setShowForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save account');
    }
  };

  const handleDeleteAccount = async (account: any) => {
    // Check if account has transactions
    const accountTransactions = transactions.filter(t => 
      t.account === account.id || t.toAccount === account.id
    );
    
    if (accountTransactions.length > 0) {
      Alert.alert(
        'Cannot Delete Account',
        `This account has ${accountTransactions.length} transaction(s). Please delete or move these transactions first.`
      );
      return;
    }

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              Alert.alert('Success', 'Account deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  const styles = getStyles(isDark);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} style={styles.closeIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Accounts</Text>
          <TouchableOpacity onPress={handleAddAccount} style={styles.addButton}>
            <Icon name="add" size={24} style={styles.addIcon} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {accountsList.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={styles.accountIconContainer}>
                  <Icon 
                    name={getAccountIcon(account.type) as any} 
                    size={24} 
                    style={styles.accountIcon} 
                  />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </Text>
                  <Text style={styles.accountBalance}>
                    {getCurrencySymbol()}{account.balance.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.accountActions}>
                <TouchableOpacity 
                  onPress={() => handleEditAccount(account)}
                  style={styles.actionButton}
                >
                  <Icon name="create-outline" size={20} style={styles.editIcon} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteAccount(account)}
                  style={styles.actionButton}
                >
                  <Icon name="trash-outline" size={20} style={styles.deleteIcon} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {accountsList.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="wallet-outline" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Accounts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first account to start tracking your finances
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Account Form Modal */}
        {showForm && (
          <Modal visible={showForm} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.formModal}>
                <Text style={styles.formTitle}>
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </Text>

                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account name"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  autoFocus
                />

                <Text style={styles.inputLabel}>Account Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  {['cash', 'bank', 'savings', 'credit', 'investment', 'other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        formData.type === type && styles.typeChipActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeChipText,
                        formData.type === type && styles.typeChipTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Initial Balance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={formData.balance}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, balance: text }))}
                  keyboardType="numeric"
                />

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveAccount}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingAccount ? 'Update' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#444444' : '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  addButton: {
    padding: 8,
  },
  addIcon: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  accountCard: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? '#444444' : '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountIcon: {
    color: '#667eea',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: isDark ? '#cccccc' : '#7f8c8d',
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: isDark ? '#444444' : '#f8f9fa',
  },
  editIcon: {
    color: '#667eea',
  },
  deleteIcon: {
    color: '#dc3545',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    color: isDark ? '#666666' : '#bdc3c7',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#7f8c8d',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formModal: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: isDark ? '#444444' : '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#555555' : '#e9ecef',
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeChip: {
    backgroundColor: isDark ? '#444444' : '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: isDark ? '#555555' : '#e9ecef',
  },
  typeChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeChipText: {
    fontSize: 14,
    color: isDark ? '#ffffff' : '#2c3e50',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: isDark ? '#444444' : '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#2c3e50',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});