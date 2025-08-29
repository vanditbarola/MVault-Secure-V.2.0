import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Platform, Alert } from 'react-native';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { formatCurrency, getCurrencySymbol, getTransactionColor, categories } from '../../utils/helpers';
import Icon from '../../components/Icon';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

function AnalyticsScreen() {
  const { transactions, profile, getMonthlyStats } = useExpenseStore();
  const isDark = profile.theme === 'dark';
  const styles = getStyles(isDark);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year', 'all'
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [chartType, setChartType] = useState('pie'); // Only pie chart is available
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'income', 'expense', 'borrow', 'lend'
  
  useEffect(() => {
    // Set date range based on selection
    const now = new Date();
    let start = new Date();
    
    if (dateRange === 'week') {
      // Start from beginning of week (Sunday)
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      start.setDate(now.getDate() - day);
    } else if (dateRange === 'month') {
      // Start from beginning of month
      start.setDate(1);
    } else if (dateRange === 'year') {
      // Start from beginning of year
      start = new Date(now.getFullYear(), 0, 1);
    } else if (dateRange === 'all') {
      // Use the earliest transaction date or default to 1 year ago
      if (transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date).getTime());
        const earliestDate = new Date(Math.min(...dates));
        start = earliestDate;
      } else {
        start.setFullYear(start.getFullYear() - 1);
      }
    } else if (dateRange === 'custom') {
      // Custom date range - don't change the dates
      return;
    }
    
    setStartDate(start);
    setEndDate(now);
  }, [dateRange, transactions]);
  
  // Filter transactions based on date range and category filter
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const dateInRange = transactionDate >= startDate && transactionDate <= endDate;
    
    if (categoryFilter === 'all') {
      return dateInRange;
    } else {
      return dateInRange && t.type === categoryFilter;
    }
  });
  
  // Calculate statistics
  const incomeTotal = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseTotal = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const borrowTotal = filteredTransactions
    .filter(t => t.type === 'borrow')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const lendTotal = filteredTransactions
    .filter(t => t.type === 'lend')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate category breakdowns
  const expensesByCategory = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += t.amount;
    });
  
  const incomeByCategory = {};
  filteredTransactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      if (!incomeByCategory[t.category]) {
        incomeByCategory[t.category] = 0;
      }
      incomeByCategory[t.category] += t.amount;
    });

  // No monthly data needed as we only use pie charts
  
  // Prepare data for pie chart
  const getPieChartData = (dataType = 'expense') => {
    const data = [];
    const sourceData = dataType === 'expense' ? expensesByCategory : incomeByCategory;
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#8AC24A', '#607D8B', '#E91E63', '#2196F3', '#FFC107', '#009688'
    ];
    
    Object.entries(sourceData).forEach(([category, amount], index) => {
      data.push({
        name: category,
        amount: amount as number,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      });
    });
    
    return data;
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (dateRange === 'custom') {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
    const options = { month: 'short', day: 'numeric' };
    if (dateRange === 'year' || dateRange === 'all') {
      Object.assign(options, { year: 'numeric' });
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };
  
  const currencySymbol = getCurrencySymbol(profile.currency);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  // No line or bar chart data needed as we only use pie charts
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>
      
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('all')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'income' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('income')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'income' && styles.filterButtonTextActive]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'expense' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('expense')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'expense' && styles.filterButtonTextActive]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'borrow' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('borrow')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'borrow' && styles.filterButtonTextActive]}>Borrow</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'lend' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('lend')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'lend' && styles.filterButtonTextActive]}>Lend</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, categoryFilter === 'transfer' && styles.filterButtonActive]}
            onPress={() => setCategoryFilter('transfer')}
          >
            <Text style={[styles.filterButtonText, categoryFilter === 'transfer' && styles.filterButtonTextActive]}>Transfer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
        <View style={styles.dateRangeButtons}>
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'week' && styles.dateRangeButtonActive]}
            onPress={() => setDateRange('week')}
          >
            <Text style={[styles.dateRangeButtonText, dateRange === 'week' && styles.dateRangeButtonTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'month' && styles.dateRangeButtonActive]}
            onPress={() => setDateRange('month')}
          >
            <Text style={[styles.dateRangeButtonText, dateRange === 'month' && styles.dateRangeButtonTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'year' && styles.dateRangeButtonActive]}
            onPress={() => setDateRange('year')}
          >
            <Text style={[styles.dateRangeButtonText, dateRange === 'year' && styles.dateRangeButtonTextActive]}>Year</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'all' && styles.dateRangeButtonActive]}
            onPress={() => setDateRange('all')}
          >
            <Text style={[styles.dateRangeButtonText, dateRange === 'all' && styles.dateRangeButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'custom' && styles.dateRangeButtonActive]}
            onPress={() => {
              setDateRange('custom');
            }}
          >
            <Text style={[styles.dateRangeButtonText, dateRange === 'custom' && styles.dateRangeButtonTextActive]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {dateRange === 'custom' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity 
              style={styles.customDateButton} 
              onPress={() => setShowStartDatePicker(true)}
            >
              <Icon name="calendar" size={16} style={styles.customDateIcon} />
              <Text style={styles.customDateText}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.customDateSeparator}>to</Text>
            <TouchableOpacity 
              style={styles.customDateButton} 
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="calendar" size={16} style={styles.customDateIcon} />
              <Text style={styles.customDateText}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.summaryIconContainer}>
            <Icon name="trending-up" size={24} style={{ color: '#4CAF50' }} />
          </View>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>{currencySymbol}{incomeTotal.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <View style={styles.summaryIconContainer}>
            <Icon name="trending-down" size={24} style={{ color: '#F44336' }} />
          </View>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>{currencySymbol}{expenseTotal.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <View style={styles.summaryIconContainer}>
            <Icon name="arrow-down-circle" size={24} style={{ color: '#FF9800' }} />
          </View>
          <Text style={styles.summaryLabel}>Borrowed</Text>
          <Text style={[styles.summaryAmount, { color: '#FF9800' }]}>{currencySymbol}{borrowTotal.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
          <View style={styles.summaryIconContainer}>
            <Icon name="arrow-up-circle" size={24} style={{ color: '#2196F3' }} />
          </View>
          <Text style={styles.summaryLabel}>Lent</Text>
          <Text style={[styles.summaryAmount, { color: '#2196F3' }]}>{currencySymbol}{lendTotal.toFixed(2)}</Text>
        </View>
      </View>
      
      {/* Net Savings */}
      <View style={styles.netSavingsContainer}>
        <Text style={styles.sectionTitle}>Net Savings</Text>
        <Text style={styles.netSavingsAmount}>
          {currencySymbol}{(incomeTotal - expenseTotal).toFixed(2)}
        </Text>
        <View style={styles.savingsProgressContainer}>
          <View 
            style={[styles.savingsProgressBar, { 
              width: `${Math.min(100, (incomeTotal / (expenseTotal || 1)) * 100)}%`,
              backgroundColor: incomeTotal >= expenseTotal ? '#4CAF50' : '#F44336'
            }]}
          />
        </View>
        <View style={styles.savingsLegend}>
          <Text style={styles.savingsLegendText}>
            {incomeTotal >= expenseTotal 
              ? `You saved ${currencySymbol}${(incomeTotal - expenseTotal).toFixed(2)}` 
              : `You overspent by ${currencySymbol}${(expenseTotal - incomeTotal).toFixed(2)}`}
          </Text>
        </View>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.chartTypeContainer}>
        <Text style={styles.sectionTitle}>Charts</Text>
        <View style={styles.chartTypeButtons}>
          <TouchableOpacity 
            style={[styles.chartTypeButton, styles.chartTypeButtonActive]}
            onPress={() => setChartType('pie')}
          >
            <Text style={[styles.chartTypeButtonText, styles.chartTypeButtonTextActive]}>Pie</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Charts */}
      <View style={styles.chartContainer}>
        <View>
          <Text style={styles.chartTitle}>Expense Breakdown</Text>
          {Object.keys(expensesByCategory).length > 0 ? (
            <PieChart
              data={getPieChartData('expense')}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No expense data for this period</Text>
          )}

          <Text style={[styles.chartTitle, { marginTop: 20 }]}>Income Breakdown</Text>
          {Object.keys(incomeByCategory).length > 0 ? (
            <PieChart
              data={getPieChartData('income')}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No income data for this period</Text>
          )}
        </View>
      </View>
      
      {/* Expense Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        {Object.entries(expensesByCategory).length > 0 ? (
          Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1]) // Sort by amount (highest first)
            .map(([category, amount]) => {
              const percentage = (amount / expenseTotal) * 100;
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>{currencySymbol}{amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.categoryProgressContainer}>
                    <View 
                      style={[styles.categoryProgressBar, { 
                        width: `${percentage}%`,
                        backgroundColor: '#F44336'
                      }]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })
        ) : (
          <Text style={styles.noDataText}>No expense data for this period</Text>
        )}
      </View>
      
      {/* Income Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Income Breakdown</Text>
        {Object.entries(incomeByCategory).length > 0 ? (
          Object.entries(incomeByCategory)
            .sort((a, b) => b[1] - a[1]) // Sort by amount (highest first)
            .map(([category, amount]) => {
              const percentage = (amount / incomeTotal) * 100;
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>{currencySymbol}{amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.categoryProgressContainer}>
                    <View 
                      style={[styles.categoryProgressBar, { 
                        width: `${percentage}%`,
                        backgroundColor: '#4CAF50'
                      }]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })
        ) : (
          <Text style={styles.noDataText}>No income data for this period</Text>
        )}
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              // Ensure start date is not after end date
              if (selectedDate <= endDate) {
                setStartDate(selectedDate);
              } else {
                Alert.alert('Invalid Date Range', 'Start date cannot be after end date');
              }
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              // Ensure end date is not before start date
              if (selectedDate >= startDate) {
                setEndDate(selectedDate);
              } else {
                Alert.alert('Invalid Date Range', 'End date cannot be before start date');
              }
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#444444' : '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  filterContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#444444' : '#e9ecef',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  dateRangeContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#444444' : '#e9ecef',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  dateRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dateRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  dateRangeButtonActive: {
    backgroundColor: '#667eea',
  },
  dateRangeButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  dateRangeButtonTextActive: {
    color: '#ffffff',
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  customDateIcon: {
    color: '#667eea',
    marginRight: 5,
  },
  customDateText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  customDateSeparator: {
    marginHorizontal: 10,
    color: '#7f8c8d',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  netSavingsContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 15,
  },
  netSavingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 10,
  },
  savingsProgressContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  savingsProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  savingsLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  savingsLegendText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  chartTypeContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  chartTypeButtonActive: {
    backgroundColor: '#667eea',
  },
  chartTypeButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  chartTypeButtonTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryRow: {
    marginBottom: 15,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#ffffff' : '#2c3e50',
  },
  categoryProgressContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 30,
  },
});

export default AnalyticsScreen;