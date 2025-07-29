import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@contexts/AppStateContext';
import { LoadingSpinner } from './ui';
import { generateId } from '@utils/accessibility';

const InputBox = ({ onSubmit, placeholder = "Tell me about your interests..." }) => {
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const errorId = useRef(generateId('input-error'));
  const helpId = useRef(generateId('input-help'));
  
  const { 
    isLoading, 
    isProcessing, 
    error,
    setCurrentInput,
    setLastUserInput,
    addMessage,
    clearError
  } = useAppState();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Clear validation error when user starts typing
  useEffect(() => {
    if (validationError && input.trim()) {
      setValidationError('');
    }
  }, [input, validationError]);

  // Clear error when component mounts or input changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [input, error, clearError]);

  const validateInput = (value) => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return 'Please enter your interests or preferences';
    }
    
    if (trimmedValue.length < 3) {
      return 'Please enter at least 3 characters';
    }
    
    if (trimmedValue.length > 500) {
      return 'Please keep your input under 500 characters';
    }
    
    // Check for potentially harmful content (basic validation)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(trimmedValue))) {
      return 'Invalid characters detected in input';
    }
    
    return '';
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setCurrentInput(value);
    
    // Clear validation error if input becomes valid
    if (validationError) {
      const error = validateInput(value);
      if (!error) {
        setValidationError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    const validationResult = validateInput(trimmedInput);
    
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }
    
    if (isLoading || isProcessing || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      
      // Store the input for potential retry
      setLastUserInput(trimmedInput);
      
      // Add user message to chat
      addMessage(trimmedInput, 'user', { status: 'sent' });
      
      // Clear input
      setInput('');
      setCurrentInput('');
      
      // Call the onSubmit handler if provided
      if (onSubmit) {
        await onSubmit(trimmedInput);
      }
      
    } catch (error) {
      console.error('Error submitting input:', error);
      setValidationError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Clear error on Escape
    if (e.key === 'Escape' && validationError) {
      setValidationError('');
    }
  };

  const isDisabled = isLoading || isProcessing || isSubmitting;
  const showError = validationError || error;
  const characterCount = input.length;
  const isNearLimit = characterCount > 400;

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <motion.div 
          className="flex-1 relative"
          whileHover={{ scale: 1.01 }}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <motion.textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 ${
              showError
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows="1"
            style={{ 
              minHeight: '48px', 
              maxHeight: '120px',
              overflow: 'hidden'
            }}
            disabled={isDisabled}
            maxLength={500}
            aria-label="Enter your interests and preferences"
            aria-describedby={showError ? errorId.current : helpId.current}
            aria-invalid={showError ? 'true' : 'false'}
            aria-required="true"
            whileFocus={{ 
              boxShadow: showError 
                ? "0 0 0 3px rgba(239, 68, 68, 0.1)" 
                : "0 0 0 3px rgba(59, 130, 246, 0.1)"
            }}
          />
          
          {/* Character counter */}
          <motion.div 
            className={`absolute bottom-2 right-2 text-xs transition-colors duration-200 ${
              isNearLimit 
                ? 'text-orange-500 dark:text-orange-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}
            animate={{ 
              scale: isNearLimit ? 1.1 : 1,
              color: isNearLimit ? '#f59e0b' : undefined
            }}
            transition={{ duration: 0.2 }}
          >
            {characterCount}/500
          </motion.div>
        </motion.div>
        
        <motion.button
          type="submit"
          disabled={!input.trim() || isDisabled}
          className="px-6 py-3 bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center min-w-[80px] sm:min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label={isSubmitting || isLoading || isProcessing ? "Sending message..." : "Send message"}
          aria-describedby={helpId.current}
          whileHover={!isDisabled ? { 
            scale: 1.05,
            backgroundColor: "#1d4ed8",
            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)"
          } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isSubmitting || isLoading || isProcessing ? (
              <motion.div 
                key="loading"
                className="flex items-center space-x-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <LoadingSpinner size="sm" color="text-white" />
                <span className="hidden sm:inline">Sending...</span>
              </motion.div>
            ) : (
              <motion.div
                key="send"
                className="flex items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <span>Send</span>
                <motion.span 
                  className="ml-2 text-xs opacity-75 hidden sm:inline"
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⏎
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
      
      {/* Error message */}
      <AnimatePresence>
        {showError && (
          <motion.div 
            id={errorId.current}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ x: [0, -5, 5, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {validationError || error}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Help text */}
      <AnimatePresence>
        {!showError && (
          <motion.div 
            id={helpId.current}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Press Enter to send, Shift+Enter for new line. Character limit: 500
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InputBox;