'use client';

import { useEffect, useState, useCallback } from 'react';

// Web Vitals monitoring
export function useWebVitals() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Import web-vitals dynamically
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        const sendToAnalytics = (metric) => {
          // Send to analytics service
          console.log('Web Vital:', metric);
          
          // Send to your analytics endpoint
          if (process.env.NODE_ENV === 'production') {
            fetch('/api/analytics/vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metric),
            }).catch(console.error);
          }
          
          setMetrics(prev => ({ ...prev, [metric.name]: metric.value }));
        };

        getCLS(sendToAnalytics);
        getFID(sendToAnalytics);
        getFCP(sendToAnalytics);
        getLCP(sendToAnalytics);
        getTTFB(sendToAnalytics);
      });
    }
  }, []);

  return metrics;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const [performanceData, setPerformanceData] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    errorCount: 0,
  });

  const trackLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      setPerformanceData(prev => ({ ...prev, loadTime }));
    }
  }, []);

  const trackRenderTime = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const renderTime = performance.now();
      setPerformanceData(prev => ({ ...prev, renderTime }));
    }
  }, []);

  const trackApiCall = useCallback(() => {
    setPerformanceData(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
  }, []);

  const trackError = useCallback(() => {
    setPerformanceData(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', trackLoadTime);
      return () => window.removeEventListener('load', trackLoadTime);
    }
  }, [trackLoadTime]);

  return {
    performanceData,
    trackRenderTime,
    trackApiCall,
    trackError,
  };
}

// API performance wrapper
export function withPerformanceTracking(apiFunction) {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await apiFunction(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      console.log(`API Call Duration: ${duration.toFixed(2)}ms`);
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/api-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: apiFunction.name || 'anonymous',
            duration,
            success: true,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log error performance
      console.error(`API Call Error (${duration.toFixed(2)}ms):`, error);
      
      // Send error analytics
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/api-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: apiFunction.name || 'anonymous',
            duration,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
      
      throw error;
    }
  };
}

// Resource timing monitoring
export function useResourceTiming() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const resourceData = entries.map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
        }));
        
        setResources(prev => [...prev, ...resourceData]);
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  return resources;
}

// Memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const updateMemoryInfo = () => {
        setMemoryInfo({
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
        });
      };

      updateMemoryInfo();
      const interval = setInterval(updateMemoryInfo, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return memoryInfo;
}

// Network monitoring
export function useNetworkMonitoring() {
  const [networkInfo, setNetworkInfo] = useState({
    online: true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const updateNetworkInfo = () => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        setNetworkInfo({
          online: navigator.onLine,
          effectiveType: connection?.effectiveType || '4g',
          downlink: connection?.downlink || 10,
          rtt: connection?.rtt || 100,
        });
      };

      updateNetworkInfo();

      window.addEventListener('online', updateNetworkInfo);
      window.addEventListener('offline', updateNetworkInfo);
      
      if (navigator.connection) {
        navigator.connection.addEventListener('change', updateNetworkInfo);
      }

      return () => {
        window.removeEventListener('online', updateNetworkInfo);
        window.removeEventListener('offline', updateNetworkInfo);
        if (navigator.connection) {
          navigator.connection.removeEventListener('change', updateNetworkInfo);
        }
      };
    }
  }, []);

  return networkInfo;
}

// Performance scoring
export function calculatePerformanceScore(metrics) {
  const scores = {
    LCP: metrics.LCP ? Math.max(0, 100 - (metrics.LCP - 2500) / 25) : 0,
    FID: metrics.FID ? Math.max(0, 100 - (metrics.FID - 100) / 5) : 0,
    CLS: metrics.CLS ? Math.max(0, 100 - metrics.CLS * 50) : 0,
    FCP: metrics.FCP ? Math.max(0, 100 - (metrics.FCP - 1800) / 18) : 0,
    TTFB: metrics.TTFB ? Math.max(0, 100 - (metrics.TTFB - 800) / 8) : 0,
  };

  const weights = {
    LCP: 0.25,
    FID: 0.20,
    CLS: 0.20,
    FCP: 0.20,
    TTFB: 0.15,
  };

  const weightedScore = Object.entries(scores).reduce((total, [metric, score]) => {
    return total + (score * weights[metric]);
  }, 0);

  return {
    score: Math.round(weightedScore),
    grades: {
      LCP: scores.LCP >= 90 ? 'good' : scores.LCP >= 50 ? 'needs-improvement' : 'poor',
      FID: scores.FID >= 90 ? 'good' : scores.FID >= 50 ? 'needs-improvement' : 'poor',
      CLS: scores.CLS >= 90 ? 'good' : scores.CLS >= 50 ? 'needs-improvement' : 'poor',
      FCP: scores.FCP >= 90 ? 'good' : scores.FCP >= 50 ? 'needs-improvement' : 'poor',
      TTFB: scores.TTFB >= 90 ? 'good' : scores.TTFB >= 50 ? 'needs-improvement' : 'poor',
    },
    overall: weightedScore >= 90 ? 'good' : weightedScore >= 50 ? 'needs-improvement' : 'poor',
  };
}

// Performance optimization suggestions
export function getOptimizationSuggestions(metrics) {
  const suggestions = [];

  if (metrics.LCP > 2500) {
    suggestions.push({
      metric: 'LCP',
      issue: 'Largest Contentful Paint is slow',
      suggestions: [
        'Optimize images with proper sizing and compression',
        'Preload critical resources',
        'Remove render-blocking JavaScript and CSS',
        'Improve server response time',
      ],
    });
  }

  if (metrics.FID > 100) {
    suggestions.push({
      metric: 'FID',
      issue: 'First Input Delay is high',
      suggestions: [
        'Reduce JavaScript execution time',
        'Split code into smaller chunks',
        'Use web workers for heavy computations',
        'Optimize third-party scripts',
      ],
    });
  }

  if (metrics.CLS > 0.1) {
    suggestions.push({
      metric: 'CLS',
      issue: 'Cumulative Layout Shift is high',
      suggestions: [
        'Include size attributes for images and videos',
        'Reserve space for dynamic content',
        'Avoid inserting content above existing content',
        'Use transform animations instead of changing properties',
      ],
    });
  }

  if (metrics.FCP > 1800) {
    suggestions.push({
      metric: 'FCP',
      issue: 'First Contentful Paint is slow',
      suggestions: [
        'Reduce server response time',
        'Minimize render-blocking resources',
        'Optimize resource loading',
        'Use CDN for static assets',
      ],
    });
  }

  return suggestions;
}
