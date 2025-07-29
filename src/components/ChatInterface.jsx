import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@contexts/AppStateContext';
import { chatService } from '@services/chatService';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import ControlButtons from './ControlButtons';
import ScreenReader from './ScreenReader';
import FilteredRecommendationView from './FilteredRecommendationView';
import { useAccessibility } from '@hooks/useAccessibility';
import { announcements } from '@utils/accessibility';

const ChatInterface = memo(() => {
  const {
    messages,
    isLoading,
    isProcessing,
    error,
    lastUserInput,
    addMessage,
    updateMessage,
    setLoading,
    setProcessing,
    setError,
    clearError,
    setLastAnalysis,
    setRecommendations,
    clearMessages,
    resetState
  } = useAppState();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const currentProcessingId = useRef(null);
  const { announce } = useAccessibility();

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle input submission and message processing
  const handleInputSubmit = useCallback(async (input) => {
    try {
      clearError();
      setProcessing(true);

      // Announce processing start
      announce(announcements.loading('processing your request'));

      // Create AI message placeholder
      const aiMessageId = `ai_${Date.now()}`;
      addMessage('', 'ai', {
        id: aiMessageId,
        status: 'processing',
        isLoading: true
      });

      // Process input through chat service
      const result = await chatService.processUserInput(input, {
        onAnalysisStart: ({ processingId }) => {
          currentProcessingId.current = processingId;
          updateMessage(aiMessageId, {
            content: 'Analyzing your interests...',
            status: 'analyzing'
          });
        },

        onAnalysisComplete: ({ analysis }) => {
          // Enhanced analysis data for debug panel
          const enhancedAnalysis = {
            ...analysis,
            debugInfo: {
              stage: 'analysis_complete',
              timestamp: new Date().toISOString(),
              entitiesFound: analysis.entities.length,
              averageConfidence: analysis.confidence,
              processingSteps: analysis.rawResponse?.processingSteps || []
            }
          };
          setLastAnalysis(enhancedAnalysis);
          updateMessage(aiMessageId, {
            content: 'Finding recommendations...',
            status: 'fetching'
          });
        },

        onAnalysisError: ({ error }) => {
          console.error('Analysis failed:', error);
          updateMessage(aiMessageId, {
            content: 'Sorry, I had trouble understanding your message. Could you try rephrasing it?',
            status: 'error',
            isLoading: false
          });
        },

        onRecommendationsStart: () => {
          updateMessage(aiMessageId, {
            content: 'Getting personalized recommendations...',
            status: 'fetching'
          });
        },

        onRecommendationsComplete: ({ recommendations }) => {
          if (recommendations.length > 0) {
            setRecommendations(recommendations);
          }
        },

        onRecommendationsError: ({ error }) => {
          console.warn('Recommendations failed:', error);
          // Continue with AI response even if recommendations fail
        },

        onComplete: (result) => {
          updateMessage(aiMessageId, {
            content: result.aiResponse,
            status: 'sent',
            isLoading: false,
            recommendations: result.recommendations
          });

          // Announce completion
          const recommendationCount = result.recommendations?.length || 0;
          announce(announcements.complete('recommendation processing', recommendationCount));
        },

        onError: ({ error }) => {
          console.error('Processing failed:', error);
          updateMessage(aiMessageId, {
            content: 'I encountered an error processing your request. Please try again.',
            status: 'error',
            isLoading: false
          });
          setError(error);

          // Announce error
          announce(announcements.error('processing your request', error.message || 'Unknown error'), 'assertive');
        }
      });

    } catch (error) {
      console.error('Input processing error:', error);
      setError(error.message || 'An unexpected error occurred');
      announce(announcements.error('processing your request', error.message || 'An unexpected error occurred'), 'assertive');
    } finally {
      setProcessing(false);
      setLoading(false);
      currentProcessingId.current = null;
    }
  }, [
    addMessage,
    updateMessage,
    setLoading,
    setProcessing,
    setError,
    clearError,
    setLastAnalysis,
    setRecommendations,
    announce
  ]);

  // Handle retry functionality - re-process last user input
  const handleRetry = useCallback(async () => {
    if (lastUserInput) {
      await handleInputSubmit(lastUserInput);
    }
  }, [lastUserInput, handleInputSubmit]);

  // Handle clear chat functionality
  const handleClearChat = useCallback(() => {
    clearMessages();
    clearError();
    announce('Chat cleared');
  }, [clearMessages, clearError, announce]);

  // Memoize welcome message content to prevent re-renders
  const welcomeContent = useMemo(() => (
    <motion.div
      key="welcome"
      className="flex flex-col items-center justify-center h-full text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-md mx-auto">
        <motion.h2
          className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Welcome to TasteSphere
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-300 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Tell me about your interests and I'll recommend movies, books, music, destinations, and more!
        </motion.p>
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Try something like:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            "I love sci-fi movies and indie music"
          </p>
        </motion.div>
      </div>
    </motion.div>
  ), []);

  // Memoize input placeholder to prevent re-renders
  const inputPlaceholder = useMemo(() =>
    messages.length === 0
      ? "Tell me about your interests..."
      : "What else would you like recommendations for?",
    [messages.length]
  );

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Screen reader announcements */}
      <ScreenReader
        message={isProcessing ? 'Processing your request...' : ''}
        priority="polite"
      />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            // Welcome message when no messages
            welcomeContent
          ) : (
            // Message list
            <motion.div
              key="messages"
              className="max-w-4xl mx-auto w-full space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    type={message.type}
                    timestamp={message.timestamp}
                    isLoading={message.isLoading || message.status === 'processing'}
                    status={message.status}
                    recommendations={message.recommendations}
                    onRetry={message.status === 'error' ? handleRetry : undefined}
                  />
                ))}
              </AnimatePresence>

              {/* Recommendations Section */}
              <FilteredRecommendationView />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="max-w-4xl mx-auto w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <motion.svg
                      className="w-5 h-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </motion.svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Something went wrong
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                    <div className="mt-3">
                      <motion.button
                        onClick={handleRetry}
                        className="text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Try Again
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300"
        role="region"
        aria-label="Chat input area"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Control buttons */}
          <div className="mb-3">
            <ControlButtons
              onTryAgain={handleRetry}
              onClearChat={handleClearChat}
            />
          </div>

          <div id="chat-input">
            <InputBox
              onSubmit={handleInputSubmit}
              placeholder={inputPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;