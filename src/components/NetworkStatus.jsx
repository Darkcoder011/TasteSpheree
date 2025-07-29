import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * NetworkStatus component displays network connectivity status and provides
 * connectivity testing functionality
 */
const NetworkStatus = ({ 
  showDetails = false,
  className = '',
  onConnectivityTest = null
}) => {
  const {
    isOnline,
    connectionInfo,
    isConnectivityTesting,
    testConnectivity
  } = useNetworkStatus();

  const handleConnectivityTest = async () => {
    const result = await testConnectivity();
    if (onConnectivityTest) {
      onConnectivityTest(result);
    }
  };

  const getConnectionQuality = () => {
    if (!connectionInfo) return 'unknown';
    
    const { effectiveType, downlink, rtt } = connectionInfo;
    
    if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
      return 'excellent';
    } else if (effectiveType === '4g' || (downlink > 2 && rtt < 200)) {
      return 'good';
    } else if (effectiveType === '3g' || (downlink > 0.5 && rtt < 500)) {
      return 'fair';
    } else {
      return 'poor';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    if (isConnectivityTesting) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.div>
      );
    }

    if (isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12" />
        </svg>
      );
    }
  };

  const connectionQuality = getConnectionQuality();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      {/* Status Indicator */}
      <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Connection Quality */}
      {showDetails && isOnline && connectionInfo && (
        <div className={`text-sm ${getQualityColor(connectionQuality)}`}>
          ({connectionQuality})
        </div>
      )}

      {/* Connectivity Test Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConnectivityTest}
        disabled={isConnectivityTesting}
        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
      >
        {isConnectivityTesting ? 'Testing...' : 'Test'}
      </motion.button>

      {/* Detailed Connection Info */}
      <AnimatePresence>
        {showDetails && isOnline && connectionInfo && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs text-gray-500 dark:text-gray-400 ml-2"
          >
            <div className="flex space-x-3">
              <span>{connectionInfo.effectiveType?.toUpperCase()}</span>
              {connectionInfo.downlink && (
                <span>{connectionInfo.downlink.toFixed(1)} Mbps</span>
              )}
              {connectionInfo.rtt && (
                <span>{connectionInfo.rtt}ms</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NetworkStatus;