import { AppState, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useExpenseStore } from '../stores/useExpenseStore';

class AutoBackupManager {
  private appStateSubscription: any;
  private lastBackupTime: number = 0;
  private backupInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  init() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  private handleAppStateChange = (nextAppState: string) => {
    // Only trigger on app termination (going from active to background permanently)
    if (nextAppState === 'background') {
      // Check if app is being terminated (not just minimized)
      setTimeout(() => {
        this.checkIfAppTerminating();
      }, 5000); // Wait 5 seconds to see if app comes back
    }
  };

  private async checkIfAppTerminating() {
    // If app is still in background after 5 seconds, likely being terminated
    if (AppState.currentState === 'background') {
      this.performAutoBackup();
    }
  }

  private async performAutoBackup() {
    try {
      const now = Date.now();
      
      // Only backup if 24 hours have passed since last backup
      if (now - this.lastBackupTime < this.backupInterval) {
        return;
      }

      const { exportData, profile } = useExpenseStore.getState();
      
      // Only backup if user has data
      if (!profile.isSetupComplete) {
        return;
      }

      const data = exportData();
      const encryptedData = this.encryptData(data, 'mvault123'); // Default password
      
      const fileName = `mvault_auto_backup_${new Date().toISOString().split('T')[0]}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, encryptedData);
      
      // Save to Downloads folder if possible
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Auto Backup Created - Save to keep your data safe'
        });
      }

      this.lastBackupTime = now;
      console.log('Auto backup created successfully');
      
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  private encryptData(data: string, password: string): string {
    const key = password.split('').map(char => char.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
    const encrypted = data.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) + key + (index % 10))
    ).join('');
    return btoa(encrypted);
  }

  // Manual backup trigger
  async createManualBackup() {
    await this.performAutoBackup();
  }
}

export const autoBackupManager = new AutoBackupManager();