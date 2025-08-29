import { Platform } from "react-native";

interface ErrorData {
  message: string;
  stack?: string;
  timestamp: number;
  platform: string;
}

const errorQueue: ErrorData[] = [];

export const clearErrorAfterDelay = (errorKey: string) => {
  setTimeout(() => {
    console.log(`Clearing error: ${errorKey}`);
  }, 5000);
};

export const sendErrorToParent = (level: string, message: string, data?: any) => {
  const errorData: ErrorData = {
    message,
    stack: data?.stack,
    timestamp: Date.now(),
    platform: Platform.OS,
  };
  
  errorQueue.push(errorData);
  
  // Log to console for debugging
  console.log(`[${level.toUpperCase()}] ${message}`, data);
  
  // In a real app, you might send this to a crash reporting service
  if (level === 'error') {
    // Use originalConsoleError to avoid recursion
    originalConsoleError('Error logged:', errorData);
  }
};

export const extractSourceLocation = (stack: string): string => {
  if (!stack) return 'Unknown location';
  
  const lines = stack.split('\n');
  for (const line of lines) {
    if (line.includes('.tsx') || line.includes('.ts') || line.includes('.js')) {
      return line.trim();
    }
  }
  return 'Unknown location';
};

export const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack;
    return extractSourceLocation(stack || '');
  } catch (error) {
    return 'Unable to get caller info';
  }
};

// Store the original console.error globally so it can be used in sendErrorToParent
let originalConsoleError = console.error;

export const setupErrorLogging = () => {
  // Set up global error handlers
  originalConsoleError = console.error;
  console.error = (...args) => {
    sendErrorToParent('error', args.join(' '));
    originalConsoleError(...args);
  };

  // Handle unhandled promise rejections
  if (typeof global !== 'undefined' && global.Promise) {
    const originalUnhandledRejection = global.Promise.prototype.catch;
    global.Promise.prototype.catch = function(onRejected) {
      return originalUnhandledRejection.call(this, (error) => {
        sendErrorToParent('error', 'Unhandled Promise Rejection', error);
        if (onRejected) {
          return onRejected(error);
        }
        throw error;
      });
    };
  }

  console.log('Error logging setup complete');
};