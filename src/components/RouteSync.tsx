import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * RouteSync component handles synchronization between /report and /backlink-report routes
 * Ensures consistent user experience and proper route management
 */
export function RouteSync() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const hash = location.hash;

    // Handle /report without reportId - redirect to /backlink-report
    if (currentPath === '/report' || currentPath === '/report/') {
      // Preserve any query parameters and hash
      const newUrl = `/backlink-report${location.search}${hash}`;
      navigate(newUrl, { replace: true });
      return;
    }

    // Handle /backlink-report with specific report navigation
    if (currentPath === '/backlink-report') {
      const reportId = searchParams.get('reportId') || searchParams.get('id');
      
      if (reportId) {
        // If there's a reportId parameter, redirect to the specific report view
        const newUrl = `/report/${reportId}${hash}`;
        navigate(newUrl, { replace: true });
        return;
      }
    }

    // Store current route state for potential back navigation
    if (currentPath.startsWith('/report/') || currentPath === '/backlink-report') {
      sessionStorage.setItem('lastReportRoute', JSON.stringify({
        path: currentPath,
        search: location.search,
        hash: hash,
        timestamp: Date.now()
      }));
    }
  }, [location, navigate]);

  return null; // This component doesn't render anything
}

/**
 * Utility function to navigate between report routes with proper synchronization
 */
export const navigateToReport = (reportId?: string, searchParams?: URLSearchParams) => {
  const baseUrl = reportId ? `/report/${reportId}` : '/backlink-report';
  const queryString = searchParams ? `?${searchParams.toString()}` : '';
  return `${baseUrl}${queryString}`;
};

/**
 * Get the last visited report route from session storage
 */
export const getLastReportRoute = () => {
  try {
    const stored = sessionStorage.getItem('lastReportRoute');
    if (stored) {
      const route = JSON.parse(stored);
      // Only return if it's recent (within 1 hour)
      if (Date.now() - route.timestamp < 3600000) {
        return route;
      }
    }
  } catch (error) {
    console.warn('Failed to parse last report route:', error);
  }
  return null;
};

/**
 * Clear the stored route information
 */
export const clearLastReportRoute = () => {
  sessionStorage.removeItem('lastReportRoute');
};
