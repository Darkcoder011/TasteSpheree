import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '@contexts/AppStateContext';

/**
 * Custom hook for managing debug data and real-time updates
 * Provides enhanced debugging information and analysis tracking
 */
export const useDebugData = () => {
  const {
    lastAnalysis,
    messages,
    isProcessing,
    debugMode,
    sessionId,
    sessionDuration
  } = useAppState();

  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [processingStats, setProcessingStats] = useState({
    totalAnalyses: 0,
    averageProcessingTime: 0,
    successRate: 0,
    errorCount: 0
  });

  // Track analysis history for debugging
  useEffect(() => {
    if (lastAnalysis) {
      setAnalysisHistory(prev => {
        const newHistory = [...prev, {
          ...lastAnalysis,
          id: `analysis_${Date.now()}`,
          receivedAt: new Date().toISOString()
        }].slice(-10); // Keep last 10 analyses
        
        return newHistory;
      });
    }
  }, [lastAnalysis]);

  // Calculate processing statistics
  useEffect(() => {
    if (analysisHistory.length > 0) {
      const totalAnalyses = analysisHistory.length;
      const successfulAnalyses = analysisHistory.filter(a => a.entities && a.entities.length > 0);
      const totalProcessingTime = analysisHistory.reduce((sum, a) => sum + (a.processingTime || 0), 0);
      const errorCount = analysisHistory.filter(a => a.error).length;

      setProcessingStats({
        totalAnalyses,
        averageProcessingTime: totalProcessingTime / totalAnalyses,
        successRate: (successfulAnalyses.length / totalAnalyses) * 100,
        errorCount
      });
    }
  }, [analysisHistory]);

  // Get current processing status
  const getCurrentStatus = useCallback(() => {
    return {
      isProcessing,
      hasAnalysis: !!lastAnalysis,
      messageCount: messages.length,
      lastAnalysisTime: lastAnalysis?.timestamp,
      sessionActive: !!sessionId,
      debugModeEnabled: debugMode
    };
  }, [isProcessing, lastAnalysis, messages.length, sessionId, debugMode]);

  // Get detailed analysis breakdown
  const getAnalysisBreakdown = useCallback(() => {
    if (!lastAnalysis) return null;

    const entityTypes = {};
    const confidenceRanges = { high: 0, medium: 0, low: 0 };

    lastAnalysis.entities?.forEach(entity => {
      // Count entity types
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;

      // Categorize confidence levels
      if (entity.confidence >= 0.8) {
        confidenceRanges.high++;
      } else if (entity.confidence >= 0.5) {
        confidenceRanges.medium++;
      } else {
        confidenceRanges.low++;
      }
    });

    return {
      entityTypes,
      confidenceRanges,
      totalEntities: lastAnalysis.entities?.length || 0,
      averageConfidence: lastAnalysis.confidence,
      processingTime: lastAnalysis.processingTime,
      inputLength: lastAnalysis.inputLength
    };
  }, [lastAnalysis]);

  // Export comprehensive debug data
  const exportDebugData = useCallback(() => {
    const debugData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        sessionId,
        sessionDuration,
        debugMode,
        version: '1.0.0'
      },
      currentAnalysis: lastAnalysis,
      analysisHistory,
      processingStats,
      currentStatus: getCurrentStatus(),
      analysisBreakdown: getAnalysisBreakdown(),
      messages: messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        timestamp: msg.timestamp,
        status: msg.status,
        hasRecommendations: !!(msg.recommendations && msg.recommendations.length > 0)
      }))
    };

    return debugData;
  }, [
    sessionId,
    sessionDuration,
    debugMode,
    lastAnalysis,
    analysisHistory,
    processingStats,
    getCurrentStatus,
    getAnalysisBreakdown,
    messages
  ]);

  // Clear analysis history
  const clearAnalysisHistory = useCallback(() => {
    setAnalysisHistory([]);
    setProcessingStats({
      totalAnalyses: 0,
      averageProcessingTime: 0,
      successRate: 0,
      errorCount: 0
    });
  }, []);

  // Get real-time processing metrics
  const getProcessingMetrics = useCallback(() => {
    return {
      ...processingStats,
      currentProcessingTime: isProcessing ? Date.now() : null,
      lastUpdateTime: new Date().toISOString(),
      historySize: analysisHistory.length
    };
  }, [processingStats, isProcessing, analysisHistory.length]);

  return {
    // Current data
    lastAnalysis,
    analysisHistory,
    processingStats,
    
    // Status functions
    getCurrentStatus,
    getAnalysisBreakdown,
    getProcessingMetrics,
    
    // Actions
    exportDebugData,
    clearAnalysisHistory,
    
    // Real-time indicators
    isProcessing,
    hasRecentAnalysis: !!lastAnalysis && 
      (Date.now() - new Date(lastAnalysis.timestamp).getTime()) < 30000 // Within 30 seconds
  };
};

export default useDebugData;