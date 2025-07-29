import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useAppState } from '@contexts/AppStateContext';
import { useDebugData } from '@hooks/useDebugData';
import { useModalFocus } from '@hooks/useAccessibility';
import { ariaLabels } from '@utils/accessibility';

const DebugPanel = memo(() => {
  const {
    showDebugPanel,
    debugMode,
    toggleDebugPanel,
    toggleDebugMode,
    sessionDuration,
    sessionId
  } = useAppState();

  const {
    lastAnalysis,
    analysisHistory,
    processingStats,
    getCurrentStatus,
    getAnalysisBreakdown,
    getProcessingMetrics,
    exportDebugData: exportEnhancedDebugData,
    clearAnalysisHistory,
    isProcessing,
    hasRecentAnalysis
  } = useDebugData();

  const panelRef = useModalFocus(showDebugPanel, toggleDebugPanel);

  // Keyboard shortcuts for debug panel
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Toggle debug panel with Ctrl/Cmd + D
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        toggleDebugPanel();
      }
      
      // Toggle debug mode with Ctrl/Cmd + Shift + D
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebugMode();
      }

      // Close panel with Escape key when panel is focused
      if (event.key === 'Escape' && showDebugPanel) {
        toggleDebugPanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDebugPanel, toggleDebugPanel, toggleDebugMode]);



  // Memoized formatting functions
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  const formatDuration = useCallback((ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);

  const formatSessionDuration = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Enhanced export functionality for debugging data
  const handleExportDebugData = useCallback(() => {
    const debugData = exportEnhancedDebugData();
    const dataStr = JSON.stringify(debugData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tastesphere-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportEnhancedDebugData]);

  // Memoized EntityAnalysisSection component
  const EntityAnalysisSection = useMemo(() => {
    return ({ analysis }) => {
    if (!analysis) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-sm">No analysis data available</div>
          <div className="text-xs mt-1">Submit a message to see entity extraction results</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Analysis Metadata */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Analysis Metadata
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {formatTimestamp(analysis.timestamp)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {formatDuration(analysis.processingTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {analysis.confidence ? `${(analysis.confidence * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Original Input */}
        {analysis.originalInput && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Original Input
            </h4>
            <div className="text-xs text-blue-900 dark:text-blue-100 bg-white dark:bg-blue-900/30 rounded p-2 font-mono">
              "{analysis.originalInput}"
            </div>
          </div>
        )}

        {/* Extracted Entities */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
            Extracted Entities ({analysis.entities?.length || 0})
          </h4>
          {analysis.entities && analysis.entities.length > 0 ? (
            <div className="space-y-2">
              {analysis.entities.map((entity, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-green-900/30 rounded p-2 border-l-2 border-green-400"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-green-900 dark:text-green-100">
                      {entity.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                      {entity.type}
                    </span>
                  </div>
                  {entity.confidence && (
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Confidence: {(entity.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                  {entity.context && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Context: "{entity.context}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-green-600 dark:text-green-400 italic">
              No entities extracted
            </div>
          )}
        </div>

        {/* Raw Response */}
        {analysis.rawResponse && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Raw API Response
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded p-2 font-mono max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {typeof analysis.rawResponse === 'string' 
                  ? analysis.rawResponse 
                  : JSON.stringify(analysis.rawResponse, null, 2)
                }
              </pre>
            </div>
          </div>
        )}
      </div>
    );
    };
  }, [formatTimestamp, formatDuration]);

  // Memoized SessionInfoSection component
  const SessionInfoSection = useMemo(() => () => {
    const currentStatus = getCurrentStatus();
    const processingMetrics = getProcessingMetrics();

    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            Session Information
          </h4>
          {hasRecentAnalysis && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Recent analysis activity"></div>
          )}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Session ID:</span>
            <span className="text-purple-900 dark:text-purple-100 font-mono text-xs">
              {sessionId ? sessionId.slice(-8) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Duration:</span>
            <span className="text-purple-900 dark:text-purple-100 font-mono">
              {formatSessionDuration(sessionDuration)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Debug Mode:</span>
            <span className={`font-mono ${debugMode ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {debugMode ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Processing:</span>
            <span className={`font-mono ${isProcessing ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {isProcessing ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Messages:</span>
            <span className="text-purple-900 dark:text-purple-100 font-mono">
              {currentStatus.messageCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-600 dark:text-purple-400">Analyses:</span>
            <span className="text-purple-900 dark:text-purple-100 font-mono">
              {processingMetrics.totalAnalyses}
            </span>
          </div>
        </div>
      </div>
    );
  }, [sessionId, sessionDuration, debugMode, isProcessing, hasRecentAnalysis, getCurrentStatus, getProcessingMetrics, formatSessionDuration]);

  return (
    <>
      {/* Debug Panel Toggle Button - Always visible when debug mode is on */}
      {debugMode && (
        <button
          onClick={toggleDebugPanel}
          className={`fixed top-20 right-4 z-50 p-2 rounded-lg shadow-lg transition-all duration-300 ${
            showDebugPanel 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title={`${showDebugPanel ? 'Close' : 'Open'} Debug Panel (Ctrl+D)`}
          aria-label={`${showDebugPanel ? 'Close' : 'Open'} debug panel`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${showDebugPanel ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      )}

      {/* Debug Panel Overlay for Mobile */}
      {showDebugPanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleDebugPanel}
          aria-hidden="true"
        />
      )}

      {/* Debug Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`fixed lg:static top-0 right-0 h-full w-full max-w-sm lg:max-w-none lg:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl lg:shadow-none z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${
          showDebugPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${debugMode && showDebugPanel ? 'lg:block' : 'lg:hidden'}`}
        role="complementary"
        aria-label={ariaLabels.debugPanel(showDebugPanel, analysisHistory.length)}
        aria-hidden={!showDebugPanel}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Debug Panel
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {/* Debug Mode Toggle */}
            <button
              onClick={toggleDebugMode}
              className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                debugMode
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle Debug Mode (Ctrl+Shift+D)"
            >
              {debugMode ? 'ON' : 'OFF'}
            </button>
            {/* Close Button (Mobile) */}
            <button
              onClick={toggleDebugPanel}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close debug panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Keyboard Shortcuts Help */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-1 text-xs text-yellow-600 dark:text-yellow-400">
              <div><kbd className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Ctrl+D</kbd> Toggle Panel</div>
              <div><kbd className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Ctrl+Shift+D</kbd> Toggle Debug Mode</div>
              <div><kbd className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Esc</kbd> Close Panel</div>
            </div>
          </div>

          {/* Session Information */}
          <SessionInfoSection />

          {/* Processing Statistics */}
          {processingStats.totalAnalyses > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Processing Statistics
                </h4>
                <button
                  onClick={clearAnalysisHistory}
                  className="text-xs px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded hover:bg-indigo-300 dark:hover:bg-indigo-700 transition-colors duration-200"
                  title="Clear analysis history"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-indigo-600 dark:text-indigo-400">Success Rate:</span>
                  <span className="text-indigo-900 dark:text-indigo-100 font-mono">
                    {processingStats.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-600 dark:text-indigo-400">Avg Processing:</span>
                  <span className="text-indigo-900 dark:text-indigo-100 font-mono">
                    {formatDuration(processingStats.averageProcessingTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-600 dark:text-indigo-400">Errors:</span>
                  <span className="text-indigo-900 dark:text-indigo-100 font-mono">
                    {processingStats.errorCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-600 dark:text-indigo-400">History Size:</span>
                  <span className="text-indigo-900 dark:text-indigo-100 font-mono">
                    {analysisHistory.length}/10
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Entity Analysis */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Entity Analysis
            </h4>
            <EntityAnalysisSection analysis={lastAnalysis} />
          </div>
        </div>

        {/* Panel Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Debug panel • Real-time analysis
            </div>
            <button
              onClick={handleExportDebugData}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
              title="Export comprehensive debug data as JSON"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

DebugPanel.displayName = 'DebugPanel';

export default DebugPanel;