import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useExpenseStore, Transaction } from '../../stores/useExpenseStore';
import { formatCurrency, formatDate, getTransactionIcon, getTransactionColor } from '../../utils/helpers';
import PinModal from '../../components/PinModal';
import Icon from '../../components/Icon';

function HistoryScreen() {
  const { transactions, loadData, authenticate, settleBorrowLend, profile } = useExpenseStore();
  const isDark = profile.theme === 'dark';
  const styles = getStyles(isDark);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingSettlement, setPendingSettlement] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, selectedType]);

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

  const handleSettleTransaction = (transactionId: string) => {
    setPendingSettlement(transactionId);
    setShowPinModal(true);
  };

  const handlePinSuccess = async (pin: string) => {
    if (pendingSettlement) {
      try {
        // Verify PIN before settling transaction
        const isAuthenticated = await authenticate(pin);
        if (!isAuthenticated) {
          Alert.alert('Error', 'Invalid PIN');
          return;
        }
        
        await settleBorrowLend(pendingSettlement);
        setPendingSettlement(null);
        Alert.alert('Success', 'Transaction settled successfully!');
      } catch (error) {
        console.error('Error settling transaction:', error);
        Alert.alert('Error', 'Failed to settle transaction. Please check your PIN.');
      }
    }
  };

  const typeFilters = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'income', label: 'Income', icon: 'trending-up' },
    { key: 'expense', label: 'Expense', icon: 'trending-down' },
    { key: 'borrow', label: 'Borrow', icon: 'arrow-down-circle' },
    { key: 'lend', label: 'Lend', icon: 'arrow-up-circle' },
    { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#bdc3c7"
          />
        </View>
      </View>

      {/* Type Filters - Horizontal layout */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersContent}
        >
          {typeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedType === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType(filter.key)}
            >
              <Icon 
                name={filter.icon as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap} 
                size={16} 
                style={[
                  styles.filterIcon,
                  { color: selectedType === filter.key ? 'white' : '#7f8c8d' }
                ]} 
              />
              <Text style={[
                styles.filterText,
                selectedType === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="receipt-outline" size={64} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by adding your first transaction'
              }
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type) }
                ]}>
                  <Icon 
                    name={getTransactionIcon(transaction.type)} 
                    size={20} 
                    style={{ color: 'white' }} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  {transaction.notes ? (
                    <Text style={styles.transactionNotes} numberOfLines={1}>
                      {transaction.notes}
                    </Text>
                  ) : null}
                  <View style={styles.transactionMeta}>
                    <View style={styles.accountBadge}>
                      <Icon 
                        name={transaction.account === 'cash' ? 'cash' : 'card'} 
                        size={12} 
                        style={{ color: '#667eea', marginRight: 4 }} 
                      />
                      <Text style={styles.accountText}>
                        {transaction.account.charAt(0).toUpperCase() + transaction.account.slice(1)}
                      </Text>
                    </View>
                    {(transaction.type === 'borrow' || transaction.type === 'lend') && (
                      <TouchableOpacity
                        style={[
                          styles.statusBadge,
                          { backgroundColor: transaction.settled ? '#d4edda' : '#fff3cd' }
                        ]}
                        onPress={() => !transaction.settled && handleSettleTransaction(transaction.id)}
                        disabled={transaction.settled}
                      >
                        <Text style={[
                          styles.statusText,
                          { color: transaction.settled ? '#155724' : '#856404' }
                        ]}>
                          {transaction.settled ? 'Settled' : 'Tap to Settle'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  { 
                    color: transaction.type === 'income' || transaction.type === 'borrow' 
                      ? '#4CAF50' 
                      : transaction.type === 'transfer'
                      ? '#9C27B0'
                      : '#F44336' 
                  }
                ]}>
                  {transaction.type === 'income' || transaction.type === 'borrow' ? '+' : transaction.type === 'transfer' ? '↔' : '-'}
                  {getCurrencySymbol()}{formatCurrency(transaction.amount).replace('$', '')}
                </Text>
                <Text style={styles.transactionType}>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingSettlement(null);
        }}
        onSuccess={handlePinSuccess}
        onAuthenticate={authenticate}
        title="Settle Transaction"
        subtitle="Enter your PIN to mark this transaction as settled"
      />
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  searchIcon: {
    color: '#bdc3c7',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: isDark ? '#ffffff' : '#2c3e50',
    paddingVertical: 16,
  },
  filtersContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filtersContent: {
    gap: 8,
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#e9ecef',
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: isDark ? '#cccccc' : '#7f8c8d',
  },
  filterTextActive: {
    color: 'white',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    color: '#bdc3c7',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#cccccc' : '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: isDark ? '#999999' : '#bdc3c7',
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#2a2a2a' : 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: isDark ? '#cccccc' : '#7f8c8d',
    marginBottom: 4,
  },
  transactionNotes: {
    fontSize: 12,
    color: isDark ? '#aaaaaa' : '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  accountText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    color: isDark ? '#cccccc' : '#7f8c8d',
    textTransform: 'capitalize',
  },
});

export default HistoryScreen;