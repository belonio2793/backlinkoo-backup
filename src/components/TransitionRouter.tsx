import React, { Suspense, startTransition } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrapper component that handles transitions
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
};

// Enhanced BrowserRouter that handles transitions
export const TransitionBrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Enhanced Route component that wraps with Suspense
export const TransitionRoute: React.FC<{
  path: string;
  element: React.ReactElement;
}> = ({ path, element }) => {
  return (
    <Route
      path={path}
      element={
        <RouteWrapper>
          {element}
        </RouteWrapper>
      }
    />
  );
};

// Export the wrapper for easy use
export { RouteWrapper, LoadingFallback };
