# 💰 MVault-Secure

**A 100% offline personal expense tracker for students and minimalists, featuring PIN protection, comprehensive transaction management, and data export capabilities.**

---

## ✨ Features

### 🔐 Security & Privacy
- **PIN Protection**: 4-digit PIN authentication for all transactions
- **100% Offline**: No internet required, all data stored locally
- **No Registration**: No accounts, logins, or personal data collection
- **Local Storage**: Uses AsyncStorage for secure local data persistence

### 💳 Transaction Management
- **Income Tracking**: Salary, freelance, investments, gifts
- **Expense Tracking**: Food, transport, bills, entertainment, health
- **Borrowing & Lending**: Track money borrowed from/lent to others
- **Account Transfers**: Move money between cash, bank, and custom accounts
- **Settlement System**: Mark borrow/lend transactions as settled

### 📊 Analytics & Insights
- **Visual Charts**: Pie charts for expense and income breakdown
- **Date Filtering**: Week, month, year, all-time, and custom date ranges
- **Category Analysis**: Detailed breakdown by transaction categories
- **Account Filtering**: Filter analytics by specific accounts
- **Net Savings**: Track income vs expenses with progress indicators

### 🏦 Account Management
- **Multiple Accounts**: Cash, bank, savings, credit, investment accounts
- **Real-time Balances**: Automatic balance updates with transactions
- **Custom Accounts**: Add unlimited custom account types
- **Account Icons**: Visual indicators for different account types

### 🎨 User Experience
- **Dark/Light Theme**: Toggle between themes
- **Multi-currency Support**: USD, EUR, GBP, JPY, INR, CAD, AUD
- **Responsive Design**: Optimized for mobile devices
- **Intuitive Navigation**: Tab-based navigation with floating action button

### 📤 Data Management
- **JSON Export**: Export all data for backup
- **Data Import**: Restore from JSON backups
- **Clear Data**: Reset all data when needed
- **Auto-backup**: Automatic local data persistence

---

## 🛠️ Tech Stack

- **React Native (Expo)** – Cross-platform mobile development
- **TypeScript** – Type-safe development
- **Zustand** – Lightweight state management
- **AsyncStorage** – Local data persistence
- **React Native Chart Kit** – Data visualization
- **Expo Router** – File-based navigation
- **React Native Paper** – UI components
- **Expo Linear Gradient** – Beautiful gradients

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Steps

```bash
# Clone the repository
git clone https://github.com/vanditbarola/mvault-secure.git
cd mvault-secure

# Install dependencies
npm install

# Start the development server
npx expo start
```

### 📱 Run on Device
Scan the QR code with the **Expo Go app** (Android/iOS) to run the app on your device.

---

## 📂 Project Structure

```
mvault-secure/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Dashboard/Home
│   │   ├── add.tsx        # Add Transaction
│   │   ├── analytics.tsx  # Analytics & Charts
│   │   ├── history.tsx    # Transaction History
│   │   └── settings.tsx   # Settings & Profile
│   ├── setup.tsx          # Initial setup wizard
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── Button.tsx         # Custom button component
│   ├── Icon.tsx           # Icon wrapper
│   ├── PinModal.tsx       # PIN authentication modal
│   ├── AccountManager.tsx # Account management
│   └── SuccessModal.tsx   # Success feedback
├── stores/                # State management
│   └── useExpenseStore.ts # Main Zustand store
├── utils/                 # Helper functions
│   ├── helpers.ts         # Utility functions
│   ├── errorLogger.ts     # Error handling
│   └── autoBackup.ts      # Backup utilities
├── styles/                # Styling
│   └── commonStyles.ts    # Theme and common styles
├── contexts/              # React contexts
│   └── ThemeContext.tsx   # Theme management
└── hooks/                 # Custom hooks
    └── useThemedStyles.ts # Theme-aware styling
```

---

## 🎯 Key Features Explained

### 🔒 PIN Authentication
- 4-digit PIN setup during initial configuration
- PIN required for all transaction operations
- Secure hash-based PIN storage
- PIN verification modal for sensitive operations

### 💰 Transaction Types
1. **Income**: Add money to accounts (salary, gifts, etc.)
2. **Expense**: Subtract money from accounts (food, bills, etc.)
3. **Borrow**: Track money borrowed (doesn't affect account balance)
4. **Lend**: Track money lent (doesn't affect account balance)
5. **Transfer**: Move money between accounts

### 📊 Analytics Dashboard
- **Summary Cards**: Quick overview of income, expenses, borrowing, lending
- **Pie Charts**: Visual breakdown of expenses and income by category
- **Progress Bars**: Category-wise spending analysis
- **Date Filters**: Flexible date range selection
- **Account Filters**: Filter by specific accounts

### 🏦 Account System
- **Default Accounts**: Cash and Bank accounts
- **Custom Accounts**: Add savings, credit, investment accounts
- **Balance Tracking**: Real-time balance updates
- **Account Types**: Visual icons for different account types

---

## 🚀 Getting Started

### First Time Setup
1. **Launch the app** and complete the setup wizard
2. **Enter your name** and basic information
3. **Set up a 4-digit PIN** for security
4. **Configure monthly budget** and currency
5. **Set initial account balances** (cash, bank, etc.)

### Adding Transactions
1. **Tap the "+" button** on the dashboard
2. **Select transaction type** (income, expense, borrow, lend, transfer)
3. **Enter amount and category**
4. **Choose account** and add notes if needed
5. **Confirm with PIN** to save the transaction

### Viewing Analytics
1. **Navigate to Analytics tab**
2. **Filter by date range** (week, month, year, custom)
3. **Filter by transaction type** or account
4. **View pie charts** and category breakdowns
5. **Track net savings** and spending patterns

---

## 🔧 Configuration

### Supported Currencies
- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- JPY (¥) - Japanese Yen
- INR (₹) - Indian Rupee
- CAD (C$) - Canadian Dollar
- AUD (A$) - Australian Dollar

### Account Types
- **Cash**: Physical cash
- **Bank**: Bank account
- **Savings**: Savings account
- **Credit**: Credit card
- **Investment**: Investment account
- **Other**: Custom account type

---

## 📱 Screenshots & Demo

The app features a clean, modern interface with:
- **Dashboard**: Overview of accounts and recent transactions
- **Add Transaction**: Intuitive form with category suggestions
- **Analytics**: Beautiful charts and spending insights
- **History**: Searchable transaction history
- **Settings**: Profile management and data export

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨💻 Author

**Vandit Barola**  
- 📧 [barolavandit@gmail.com](mailto:barolavandit@gmail.com)  
- 🔗 [LinkedIn](https://www.linkedin.com/in/drvanditbarola/)  
- 🌍 [Portfolio](https://bwtechh.in)  
- 💻 [GitHub](https://github.com/vanditbarola)  

---

## 🎯 Why Choose MVault-Secure?

### ✅ Privacy First
- **No data collection** or tracking
- **No internet required** for operation
- **Local storage only** - your data stays with you
- **No ads or premium walls**

### ✅ Perfect For
- 🎓 **Students** - Track pocket money and expenses
- 🏠 **Bachelors** - Manage daily spending without complexity
- 💼 **Minimalists** - Simple, clean expense tracking
- 🔒 **Privacy-conscious users** - Complete offline operation

### ✅ Key Advantages
- **Instant setup** - no registration required
- **Comprehensive tracking** - income, expenses, borrowing, lending
- **Visual insights** - charts and analytics
- **Secure** - PIN protection for all operations
- **Portable** - export/import data as needed

---

⭐ **Star this repo if you find it helpful!**

✨ *MVault-Secure — Track your money, your way. 100% Offline. 100% Private.*