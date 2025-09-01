import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useExpenseStore } from '../stores/useExpenseStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setProfile, addAccount, clearAllData, importTransaction } = useExpenseStore();

  const importOldJsonData = async (jsonData: any) => {
    try {
      await clearAllData();
      
      // Import profile (without PIN)
      if (jsonData.profile) {
        await setProfile({ ...jsonData.profile, pin: undefined });
      }
      
      const accountMapping = {}; // Map old account names to new IDs
      
      // Import accounts - handle both old and new format
      if (jsonData.accounts) {
        // Check if it's old format (cash/bank) or new format (dynamic accounts)
        if (typeof jsonData.accounts.cash !== 'undefined' || typeof jsonData.accounts.bank !== 'undefined') {
          // Old format - convert to new format
          if (jsonData.accounts.cash !== undefined) {
            await addAccount({
              name: 'Cash',
              type: 'cash',
              balance: jsonData.accounts.cash || 0,
            });
          }
          if (jsonData.accounts.bank !== undefined) {
            await addAccount({
              name: 'Bank',
              type: 'bank', 
              balance: jsonData.accounts.bank || 0,
            });
          }
        } else {
          // New format - import accounts directly
          for (const accountId in jsonData.accounts) {
            const account = jsonData.accounts[accountId];
            await addAccount({
              name: account.name,
              type: account.type,
              balance: account.balance,
            });
          }
        }
      }
      
      // Import transactions and map old account names to new IDs
      if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
        // Wait a bit for accounts to be created
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { getAccountsList } = useExpenseStore.getState();
        const accounts = getAccountsList();
        
        // Create mapping for old account names to new IDs
        accounts.forEach(account => {
          if (account.name === 'Cash') accountMapping['cash'] = account.id;
          if (account.name === 'Bank') accountMapping['bank'] = account.id;
        });
        
        console.log('Account mapping:', accountMapping);
        console.log('Available accounts:', accounts.map(a => ({ id: a.id, name: a.name })));
        
        for (const transaction of jsonData.transactions) {
          const updatedTransaction = { ...transaction };
          
          // Map old account names to new IDs
          if (accountMapping[transaction.account]) {
            updatedTransaction.account = accountMapping[transaction.account];
            console.log(`Mapped ${transaction.account} to ${accountMapping[transaction.account]}`);
          }
          if (transaction.toAccount && accountMapping[transaction.toAccount]) {
            updatedTransaction.toAccount = accountMapping[transaction.toAccount];
          }
          
          await importTransaction(updatedTransaction);
        }
      }
    } catch (error) {
      throw error;
    }
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [pendingImportData, setPendingImportData] = useState(null);

  const decryptData = (encryptedData: string, password: string): string => {
    const key = password.split('').map(char => char.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
    const shifted = encryptedData.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) - key - (index % 10))
    ).join('');
    return atob(shifted);
  };

  const handleNewUser = () => {
    router.push('/setup');
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) return;
      
      const fileName = result.assets[0].name;
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      
      // Check if it's old JSON format
      if (fileName.endsWith('.json')) {
        try {
          console.log('JSON file content:', fileContent.substring(0, 200));
          const jsonData = JSON.parse(fileContent);
          console.log('Parsed JSON keys:', Object.keys(jsonData));
          await importOldJsonData(jsonData);
          Alert.alert('Success', 'Old JSON data imported successfully! Please set up your PIN.');
          router.push('/setup');
          return;
        } catch (error) {
          console.error('JSON parse error:', error);
          Alert.alert('Error', `Invalid JSON file: ${error.message}`);
          return;
        }
      }
      
      // Check if it's new encrypted format
      if (!fileName.endsWith('.txt') || !fileName.includes('mvault_backup')) {
        Alert.alert('Error', 'Please select a MVault backup file (.txt) or old JSON export (.json)');
        return;
      }
      
      setPendingImportData(fileContent);
      setShowImportModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const performImport = async () => {
    if (!importPassword) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    try {
      const decryptedText = decryptData(pendingImportData, importPassword);
      const backupData = JSON.parse(decryptedText);
      
      await clearAllData();
      await setProfile(backupData.profile);
      
      // Import accounts
      if (backupData.accounts) {
        for (const accountId in backupData.accounts) {
          const account = backupData.accounts[accountId];
          await addAccount({
            name: account.name,
            type: account.type,
            balance: account.balance,
          });
        }
      }
      
      // Import transactions without updating balances
      if (backupData.transactions) {
        for (const transaction of backupData.transactions) {
          await importTransaction(transaction);
        }
      }
      
      Alert.alert('Success', 'Data imported successfully! Please set up your PIN.');
      router.push('/setup');
    } catch (error) {
      Alert.alert('Error', 'Wrong password or corrupted file');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>💰 MVault</Text>
        <Text style={styles.subtitle}>Your Personal Finance Tracker</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to MVault!</Text>
        <Text style={styles.description}>
          Choose how you'd like to get started
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleNewUser}>
          <Ionicons name="person-add" size={24} color="white" />
          <Text style={styles.primaryButtonText}>I'm a New User</Text>
          <Text style={styles.buttonSubtext}>Set up fresh account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleImportData}>
          <Ionicons name="cloud-download" size={24} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Import My Data</Text>
          <Text style={styles.buttonSubtext}>Restore from backup</Text>
        </TouchableOpacity>
      </View>

      {showImportModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter Import Password</Text>
            <Text style={styles.modalSubtext}>
              Enter the password used to encrypt this backup
            </Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              value={importPassword}
              onChangeText={setImportPassword}
              secureTextEntry
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowImportModal(false);
                  setImportPassword('');
                  setPendingImportData(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.importButton} onPress={performImport}>
                <Text style={styles.importButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 50,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  importButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});