import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for lazy loading images with intersection observer
 * Provides better performance by only loading images when they're visible
 */
export const useLazyImage = (src, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackDelay = 100
  } = options;

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  // Handle image load error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Set up intersection observer
  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg) return;

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        },
        {
          threshold,
          rootMargin
        }
      );

      observerRef.current.observe(currentImg);
    } else {
      // Fallback for browsers without IntersectionObserver
      const fallbackTimer = setTimeout(() => {
        setIsInView(true);
      }, fallbackDelay);

      return () => clearTimeout(fallbackTimer);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, fallbackDelay]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    imgRef,
    isLoaded,
    isInView,
    hasError,
    shouldLoad: isInView && src,
    handleLoad,
    handleError
  };
};

export default useLazyImage;