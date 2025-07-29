import { useEffect, useRef } from 'react';

/**
 * ScreenReader component provides live region for screen reader announcements
 * This component is visually hidden but provides important accessibility feedback
 */
const ScreenReader = ({ 
  message, 
  priority = 'polite', 
  clearDelay = 1000,
  className = '' 
}) => {
  const regionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set the message
      regionRef.current.textContent = message;

      // Clear the message after delay to allow for repeated announcements
      timeoutRef.current = setTimeout(() => {
        if (regionRef.current && regionRef.current.textContent === message) {
          regionRef.current.textContent = '';
        }
      }, clearDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearDelay]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    />
  );
};

export default ScreenReader;