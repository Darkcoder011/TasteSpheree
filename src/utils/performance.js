/**
 * Performance monitoring utilities for TasteSphere
 * Provides tools for measuring and optimizing application performance
 */

// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing a performance metric
  startTiming(name) {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  // End timing and calculate duration
  endTiming(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // Log slow operations
      if (metric.duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  }

  // Get timing for a specific metric
  getTiming(name) {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  observeWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        // CLS not supported
      }
    }
  }

  // Monitor memory usage
  getMemoryUsage() {
    if (typeof window === 'undefined' || !window.performance?.memory) {
      return null;
    }

    const memory = window.performance.memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
    };
  }

  // Monitor bundle size and loading performance
  getBundleMetrics() {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const navigation = window.performance.getEntriesByType('navigation')[0];
    const resources = window.performance.getEntriesByType('resource');
    
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));
    
    return {
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
      loadComplete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
      jsSize: jsResources.reduce((total, r) => total + (r.transferSize || 0), 0),
      cssSize: cssResources.reduce((total, r) => total + (r.transferSize || 0), 0),
      totalResources: resources.length
    };
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React performance utilities
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  if (process.env.NODE_ENV !== 'development') {
    return WrappedComponent;
  }

  return function PerformanceTrackedComponent(props) {
    React.useEffect(() => {
      performanceMonitor.startTiming(`${componentName}-render`);
      return () => {
        performanceMonitor.endTiming(`${componentName}-render`);
      };
    });

    return React.createElement(WrappedComponent, props);
  };
};

// Hook for measuring component render performance
export const usePerformanceTracking = (componentName) => {
  if (process.env.NODE_ENV !== 'development') {
    return { startTiming: () => {}, endTiming: () => {} };
  }

  return {
    startTiming: (operation) => performanceMonitor.startTiming(`${componentName}-${operation}`),
    endTiming: (operation) => performanceMonitor.endTiming(`${componentName}-${operation}`)
  };
};

// Debounce utility for performance optimization
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility for performance optimization
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.observeWebVitals();
  
  // Log performance metrics on page unload
  window.addEventListener('beforeunload', () => {
    const metrics = performanceMonitor.getAllMetrics();
    const memory = performanceMonitor.getMemoryUsage();
    const bundle = performanceMonitor.getBundleMetrics();
    
    console.group('TasteSphere Performance Report');
    console.log('Timing Metrics:', metrics);
    console.log('Memory Usage:', memory);
    console.log('Bundle Metrics:', bundle);
    console.groupEnd();
    
    performanceMonitor.disconnect();
  });
}

export default performanceMonitor;