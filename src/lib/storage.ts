import type { Cell, TransformConfig } from './types';

// Storage keys
const STORAGE_KEYS = {
  CODE: 'table-transformer-code',
  LANGUAGE: 'table-transformer-language',
  TABLE_DATA: 'table-transformer-table-data',
  TABLE_DIMENSIONS: 'table-transformer-table-dimensions',
  CONFIG: 'table-transformer-config',
} as const;

// Storage utility functions
export const storage = {
  // Save data to localStorage with error handling
  save: <T>(key: string, data: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn(`Failed to save to localStorage (${key}):`, error);
      return false;
    }
  },

  // Load data from localStorage with error handling
  load: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  // Remove data from localStorage
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  },

  // Clear all app data
  clear: (): boolean => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },
};

// Specific storage functions for our app data
export const appStorage = {
  // Code persistence
  saveCode: (code: string): boolean => storage.save(STORAGE_KEYS.CODE, code),
  loadCode: (defaultCode: string): string => storage.load(STORAGE_KEYS.CODE, defaultCode),

  // Language persistence
  saveLanguage: (isTypeScript: boolean): boolean => storage.save(STORAGE_KEYS.LANGUAGE, isTypeScript),
  loadLanguage: (defaultLanguage: boolean = true): boolean => storage.load(STORAGE_KEYS.LANGUAGE, defaultLanguage),

  // Table data persistence
  saveTableData: (table: Cell[][]): boolean => storage.save(STORAGE_KEYS.TABLE_DATA, table),
  loadTableData: (defaultTable: Cell[][]): Cell[][] => storage.load(STORAGE_KEYS.TABLE_DATA, defaultTable),

  // Table dimensions persistence
  saveTableDimensions: (rows: number, cols: number): boolean => 
    storage.save(STORAGE_KEYS.TABLE_DIMENSIONS, { rows, cols }),
  loadTableDimensions: (defaultRows: number = 3, defaultCols: number = 3): { rows: number; cols: number } => 
    storage.load(STORAGE_KEYS.TABLE_DIMENSIONS, { rows: defaultRows, cols: defaultCols }),

  // Config persistence
  saveConfig: (config: TransformConfig): boolean => storage.save(STORAGE_KEYS.CONFIG, config),
  loadConfig: (defaultConfig: TransformConfig): TransformConfig => storage.load(STORAGE_KEYS.CONFIG, defaultConfig),

  // Clear all app data
  clearAll: (): boolean => storage.clear(),
};
