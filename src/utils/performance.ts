/**
 * Performance monitoring utilities for web vitals and load times
 */

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Track First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        console.log('🎨 First Contentful Paint:', Math.round(entry.startTime), 'ms');
      }
    }
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // Paint timing not supported
  }

  // Track Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('🖼️ Largest Contentful Paint:', Math.round(lastEntry.startTime), 'ms');
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }

  // Track Cumulative Layout Shift
  try {
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      if (clsValue > 0.1) {
        console.warn('⚠️ High Cumulative Layout Shift detected:', clsValue.toFixed(4));
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // CLS not supported
  }
};

// Bundle size monitoring
export const logBundleInfo = () => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  console.log('📦 Bundle Analysis:');
  console.log('Scripts loaded:', scripts.length);
  console.log('Stylesheets loaded:', stylesheets.length);
  
  // Track navigation timing
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    console.log('⏱️ Navigation Timing:');
    console.log('  DNS lookup:', Math.round(navigation.domainLookupEnd - navigation.domainLookupStart), 'ms');
    console.log('  Connection:', Math.round(navigation.connectEnd - navigation.connectStart), 'ms');
    console.log('  Request:', Math.round(navigation.responseStart - navigation.requestStart), 'ms');
    console.log('  Response:', Math.round(navigation.responseEnd - navigation.responseStart), 'ms');
    console.log('  DOM Ready:', Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart), 'ms');
    console.log('  Load Complete:', Math.round(navigation.loadEventEnd - navigation.navigationStart), 'ms');
  }
};

// Memory usage monitoring
export const trackMemoryUsage = () => {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  console.log('🧠 Memory Usage:');
  console.log('  Used:', Math.round(memory.usedJSHeapSize / 1024 / 1024), 'MB');
  console.log('  Total:', Math.round(memory.totalJSHeapSize / 1024 / 1024), 'MB');
  console.log('  Limit:', Math.round(memory.jsHeapSizeLimit / 1024 / 1024), 'MB');
  
  if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
    console.warn('⚠️ High memory usage detected - consider optimizing');
  }
};

// Initialize performance monitoring in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    trackWebVitals();
    logBundleInfo();
    trackMemoryUsage();
  }, 1000);
}
