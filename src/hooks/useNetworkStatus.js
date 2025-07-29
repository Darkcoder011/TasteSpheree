import { useState, useEffect, useCallback } from 'react';
import networkService from '../services/networkService';

/**
 * Hook for monitoring network status and handling network-related operations
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(networkService.isOnline);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isConnectivityTesting, setIsConnectivityTesting] = useState(false);

  useEffect(() => {
    // Update initial connection info
    const status = networkService.getNetworkStatus();
    setConnectionInfo(status.connection);

    // Listen for network status changes
    const unsubscribe = networkService.addListener((status, online) => {
      setIsOnline(online);
      
      if (online) {
        // Update connection info when coming back online
        const newStatus = networkService.getNetworkStatus();
        setConnectionInfo(newStatus.connection);
      }
    });

    return unsubscribe;
  }, []);

  const testConnectivity = useCallback(async () => {
    setIsConnectivityTesting(true);
    try {
      const isConnected = await networkService.testConnectivity();
      setIsOnline(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    } finally {
      setIsConnectivityTesting(false);
    }
  }, []);

  const executeWithRetry = useCallback(async (requestFn, url, method = 'GET', options = {}) => {
    return networkService.executeWithRetry(requestFn, url, method, options);
  }, []);

  const fetchWithRetry = useCallback(async (url, options = {}) => {
    return networkService.fetch(url, options);
  }, []);

  const getErrorMessage = useCallback((error) => {
    return networkService.getErrorMessage(error);
  }, []);

  const getRetryCount = useCallback((url, method = 'GET') => {
    return networkService.getRetryCount(url, method);
  }, []);

  const resetRetryCount = useCallback((url, method = 'GET') => {
    return networkService.resetRetryCount(url, method);
  }, []);

  return {
    isOnline,
    connectionInfo,
    isConnectivityTesting,
    testConnectivity,
    executeWithRetry,
    fetchWithRetry,
    getErrorMessage,
    getRetryCount,
    resetRetryCount
  };
};

export default useNetworkStatus;