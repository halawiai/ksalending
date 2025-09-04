'use client';

import { useState, useEffect } from 'react';

interface OfflineStorageOptions {
  dbName: string;
  version: number;
  stores: { name: string; keyPath: string }[];
}

export function useOfflineStorage(options: OfflineStorageOptions) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async () => {
    try {
      const database = await openIndexedDB(options);
      setDb(database);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize offline storage');
    }
  };

  const openIndexedDB = (options: OfflineStorageOptions): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(options.dbName, options.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        options.stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, { keyPath: store.keyPath });
          }
        });
      };
    });
  };

  const saveData = async (storeName: string, data: any): Promise<void> => {
    if (!db) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const getData = async (storeName: string, key: string): Promise<any> => {
    if (!db) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getAllData = async (storeName: string): Promise<any[]> => {
    if (!db) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const deleteData = async (storeName: string, key: string): Promise<void> => {
    if (!db) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const clearStore = async (storeName: string): Promise<void> => {
    if (!db) throw new Error('Database not ready');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  // Queue data for background sync
  const queueForSync = async (storeName: string, data: any): Promise<void> => {
    await saveData(storeName, {
      ...data,
      _syncPending: true,
      _syncTimestamp: Date.now(),
    });

    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in (registration as any) && typeof (registration as any).sync.register === 'function') {
          await (registration as any).sync.register(`sync-${storeName}`);
        }
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  };

  return {
    isReady,
    error,
    saveData,
    getData,
    getAllData,
    deleteData,
    clearStore,
    queueForSync,
  };
}

// Default configuration for KSA Lending app
export const KSA_LENDING_DB_CONFIG: OfflineStorageOptions = {
  dbName: 'KSALendingDB',
  version: 1,
  stores: [
    { name: 'assessments', keyPath: 'id' },
    { name: 'entities', keyPath: 'id' },
    { name: 'pendingSubmissions', keyPath: 'id' },
    { name: 'pendingUpdates', keyPath: 'id' },
    { name: 'userPreferences', keyPath: 'key' },
    { name: 'cachedImages', keyPath: 'id' },
  ],
};

// Hook for KSA Lending specific offline storage
export function useKSALendingStorage() {
  return useOfflineStorage(KSA_LENDING_DB_CONFIG);
}