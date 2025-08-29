import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useExpenseStore } from '../stores/useExpenseStore';

// Import html2pdf.js for web platform
let html2pdf;
if (Platform.OS === 'web') {
  import('html2pdf.js')
    .then(module => {
      html2pdf = module.default || module;
    })
    .catch(err => {
      console.error('Failed to load html2pdf.js:', err);
    });
}


export default function ExportScreen() {
  const router = useRouter();
  const { transactions, profile, accounts } = useExpenseStore();
  const [selectedRange, setSelectedRange] = useState('complete');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  // Helper functions
  const safeMathNumber = (value: any): number => {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return 0;
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
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

  const handleGenerate = async () => {
    try {
      let filteredTransactions = transactions;
      let periodText = 'Complete Data';

      if (selectedRange === 'year') {
        const currentYear = new Date().getFullYear();
        filteredTransactions = transactions.filter(t => 
          new Date(t.date).getFullYear() === currentYear
        );
        periodText = `Year ${currentYear}`;
      } else if (selectedRange === 'month') {
        const now = new Date();
        filteredTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === now.getMonth() && 
                 tDate.getFullYear() === now.getFullYear();
        });
        periodText = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
      } else if (selectedRange === 'custom' && startDate && endDate) {
        filteredTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= startDate && tDate <= endDate;
        });
        periodText = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
      }

      await generateDetailedPDF(selectedRange, startDate, endDate);
      Alert.alert('Success', 'PDF exported successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Export Report</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Generating your financial report...</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Date Range</Text>
        
        <TouchableOpacity 
          style={[styles.option, selectedRange === 'complete' && styles.selectedOption]}
          onPress={() => setSelectedRange('complete')}
        >
          <Text style={styles.optionText}>Complete Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, selectedRange === 'year' && styles.selectedOption]}
          onPress={() => setSelectedRange('year')}
        >
          <Text style={styles.optionText}>Current Year</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, selectedRange === 'month' && styles.selectedOption]}
          onPress={() => setSelectedRange('month')}
        >
          <Text style={styles.optionText}>Current Month</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, selectedRange === 'custom' && styles.selectedOption]}
          onPress={() => setSelectedRange('custom')}
        >
          <Text style={styles.optionText}>Custom Range</Text>
        </TouchableOpacity>

        {selectedRange === 'custom' && (
          <View style={styles.dateInputs}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>Start Date: {startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>End Date: {endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}
            
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}
          </View>
        )}

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Download Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 16,
  },
  dateInputs: {
    marginTop: 10,
  },
  dateInput: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
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
    color: 'white',
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
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  progressText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});