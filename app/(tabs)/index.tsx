import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { formatCurrency } from '../../utils/helpers';
import Icon from '../../components/Icon';
import * as Animatable from 'react-native-animatable';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const getTransactionIcon = (type: string): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
  switch (type) {
    case 'income': return 'trending-up';
    case 'expense': return 'trending-down';
    case 'borrow': return 'arrow-down-circle';
    case 'lend': return 'arrow-up-circle';
    case 'transfer': return 'swap-horizontal';
    default: return 'help-circle';
  }
};

const getTransactionColor = (type: string): string => {
  switch (type) {
    case 'income': return '#4CAF50';
    case 'expense': return '#F44336';
    case 'borrow': return '#FF9800';
    case 'lend': return '#2196F3';
    case 'transfer': return '#9C27B0';
    default: return '#9E9E9E';
  }
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

function DashboardScreenComponent() {
  const { accounts, transactions, loadData, getMonthlyStats, profile, getTotalBalance, getAccountsList } = useExpenseStore();
  const isDark = profile.theme === 'dark';
  const styles = getStyles(isDark);
  
  // Animation values
  const netWorthScale = useSharedValue(0.9);
  const monthlyStatsOpacity = useSharedValue(0);
  const budgetProgressOpacity = useSharedValue(0);
  const borrowLendOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadData();
    // Trigger animations on component mount with staggered timing
    setTimeout(() => {
      netWorthScale.value = 1;
    }, 100);
    
    setTimeout(() => {
      monthlyStatsOpacity.value = 1;
    }, 300);
    
    setTimeout(() => {
      budgetProgressOpacity.value = 1;
    }, 500);
    
    setTimeout(() => {
      borrowLendOpacity.value = 1;
    }, 700);
  }, []);
  
  // Animation styles
  const netWorthAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(netWorthScale.value) }],
    };
  });

  const monthlyStatsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(monthlyStatsOpacity.value),
    };
  });
  
  const budgetProgressAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(budgetProgressOpacity.value),
      transform: [{ translateY: withSpring(budgetProgressOpacity.value * 20 - 20) }],
    };
  });
  
  const borrowLendAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(borrowLendOpacity.value),
      transform: [{ translateY: withSpring(borrowLendOpacity.value * 20 - 20) }],
    };
  });

  const netWorth = getTotalBalance();
  const accountsList = getAccountsList();
  const monthlyStats = getMonthlyStats();

  const pendingBorrows = transactions
    .filter(t => t.type === 'borrow' && !t.settled)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingLends = transactions
    .filter(t => t.type === 'lend' && !t.settled)
    .reduce((sum, t) => sum + t.amount, 0);

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
  
  const getAccountColor = (type: string) => {
    switch (type) {
      case 'cash': return '#4CAF50';
      case 'bank': return '#2196F3';
      case 'savings': return '#FF9800';
      case 'credit': return '#F44336';
      case 'investment': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  return (
    <Animatable.View animation="fadeIn" duration={1000} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
          <Animatable.Text 
            animation="pulse" 
            iterationCount={1} 
            duration={1500} 
            style={styles.headerTitle}
          >
            Dashboard
          </Animatable.Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Net Worth Card */}
        <Animated.View style={netWorthAnimatedStyle}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
          <View style={styles.cardHeader}>
            <Icon name="wallet" size={24} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Net Worth</Text>
          </View>
          <Text style={styles.cardAmount}>
            {getCurrencySymbol()}{formatCurrency(netWorth).replace('$', '')}
          </Text>
          <View style={styles.accountBreakdown}>
            {accountsList.length <= 3 ? (
              accountsList.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <Text style={styles.accountLabel}>{account.name}</Text>
                  <Text style={styles.accountValue}>
                    {getCurrencySymbol()}{formatCurrency(account.balance).replace('$', '')}
                  </Text>
                </View>
              ))
            ) : (
              <>
                {accountsList.slice(0, 2).map((account) => (
                  <View key={account.id} style={styles.accountItem}>
                    <Text style={styles.accountLabel}>{account.name}</Text>
                    <Text style={styles.accountValue}>
                      {getCurrencySymbol()}{formatCurrency(account.balance).replace('$', '')}
                    </Text>
                  </View>
                ))}
                <View style={styles.accountItem}>
                  <Text style={styles.accountLabel}>+{accountsList.length - 2} more</Text>
                  <Text style={styles.accountValue}>
                    {getCurrencySymbol()}{formatCurrency(accountsList.slice(2).reduce((sum, acc) => sum + acc.balance, 0)).replace('$', '')}
                  </Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
        </Animated.View>

        {/* Monthly Cashflow Card */}
        <Animated.View style={monthlyStatsAnimatedStyle}>
          <LinearGradient
            colors={monthlyStats.cashflow >= 0 ? ['#11998e', '#38ef7d'] : ['#fc4a1a', '#f7b733']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
          <View style={styles.cardHeader}>
            <Icon name={monthlyStats.cashflow >= 0 ? "trending-up" : "trending-down"} size={24} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Monthly Cashflow</Text>
          </View>
          <Text style={styles.cardAmount}>
            {getCurrencySymbol()}{formatCurrency(monthlyStats.cashflow).replace('$', '')}
          </Text>
          <View style={styles.accountBreakdown}>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Income</Text>
              <Text style={styles.accountValue}>
                {getCurrencySymbol()}{formatCurrency(monthlyStats.income).replace('$', '')}
              </Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Expenses</Text>
              <Text style={styles.accountValue}>
                {getCurrencySymbol()}{formatCurrency(monthlyStats.expenses).replace('$', '')}
              </Text>
            </View>
          </View>
          <View style={styles.accountBreakdown}>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Borrowed</Text>
              <Text style={styles.accountValue}>
                +{getCurrencySymbol()}{formatCurrency(monthlyStats.borrowAmount).replace('$', '')}
              </Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>Lent</Text>
              <Text style={styles.accountValue}>
                -{getCurrencySymbol()}{formatCurrency(monthlyStats.lendAmount).replace('$', '')}
              </Text>
            </View>
          </View>
        </LinearGradient>
        </Animated.View>

        {/* Budget Progress Card */}
          <Animated.View style={budgetProgressAnimatedStyle}>
            <LinearGradient
              colors={['#ffecd2', '#fcb69f']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
          <View style={styles.cardHeader}>
            <Icon name="pie-chart" size={24} style={[styles.cardIcon, { color: '#8B4513' }]} />
            <Text style={[styles.cardTitle, { color: '#8B4513' }]}>Monthly Budget</Text>
          </View>
          <Text style={[styles.cardAmount, { color: '#8B4513' }]}>
            {getCurrencySymbol()}{formatCurrency(profile.monthlyBudget - monthlyStats.expenses).replace('$', '')}
          </Text>
          <View style={styles.accountBreakdown}>
            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: '#8B4513' }]}>Budget</Text>
              <Text style={[styles.accountValue, { color: '#8B4513' }]}>
                {getCurrencySymbol()}{formatCurrency(profile.monthlyBudget).replace('$', '')}
              </Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: '#8B4513' }]}>Spent</Text>
              <Text style={[styles.accountValue, { color: '#8B4513' }]}>
                {getCurrencySymbol()}{formatCurrency(monthlyStats.expenses).replace('$', '')}
              </Text>
            </View>
          </View>
        </LinearGradient>
        </Animated.View>

        {/* Pending Borrow/Lend Card */}
        <Animated.View style={borrowLendAnimatedStyle}>
          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
          <View style={styles.cardHeader}>
            <Icon name="swap-horizontal" size={24} style={[styles.cardIcon, { color: '#2c3e50' }]} />
            <Text style={[styles.cardTitle, { color: '#2c3e50' }]}>Pending</Text>
          </View>
          <Text style={[styles.cardAmount, { color: '#2c3e50' }]}>
            {getCurrencySymbol()}{formatCurrency(Math.abs(pendingLends - pendingBorrows)).replace('$', '')}
          </Text>
          <View style={styles.accountBreakdown}>
            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: '#2c3e50' }]}>Lent</Text>
              <Text style={[styles.accountValue, { color: '#2c3e50' }]}>
                {getCurrencySymbol()}{formatCurrency(pendingLends).replace('$', '')}
              </Text>
            </View>
            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: '#2c3e50' }]}>Borrowed</Text>
              <Text style={[styles.accountValue, { color: '#2c3e50' }]}>
                {getCurrencySymbol()}{formatCurrency(pendingBorrows).replace('$', '')}
              </Text>
            </View>
          </View>
        </LinearGradient>
        </Animated.View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentSection}>
        <Animatable.Text 
          animation="fadeIn" 
          duration={800} 
          style={styles.sectionTitle}
        >
          Recent Transactions
        </Animatable.Text>
        {transactions.slice(-5).reverse().map((transaction, index) => (
          <Animatable.View 
            key={transaction.id} 
            animation="fadeInUp" 
            delay={index * 150} 
            duration={500} 
            style={styles.transactionItem}
          >
            <View style={styles.transactionLeft}>
              <Animatable.View
                animation="zoomIn"
                delay={index * 150 + 300}
                style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) }]}
              >
                <Icon name={getTransactionIcon(transaction.type)} size={16} style={{ color: 'white' }} />
              </Animatable.View>
              <View>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              </View>
            </View>
            <Animatable.Text
              animation="fadeIn"
              delay={index * 150 + 400}
              style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' || transaction.type === 'borrow' ? '#4CAF50' : transaction.type === 'transfer' ? '#9C27B0' : '#F44336' }
              ]}
            >
              {transaction.type === 'income' || transaction.type === 'borrow' ? '+' : transaction.type === 'transfer' ? '↔' : '-'}
              {getCurrencySymbol()}{formatCurrency(transaction.amount).replace('$', '')}
            </Animatable.Text>
          </Animatable.View>
        ))}
      </View>
    </ScrollView>
    </Animatable.View>
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
  cardsContainer: {
    paddingHorizontal: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    color: 'white',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  accountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  accountItem: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 16,
  },
  transactionItem: {
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
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  transactionDate: {
    fontSize: 12,
    color: isDark ? '#cccccc' : '#7f8c8d',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreenComponent;