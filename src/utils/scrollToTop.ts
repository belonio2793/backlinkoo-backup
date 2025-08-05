import React from 'react';

/**
 * Utility function to smoothly scroll to the top of the page
 * @param behavior - 'smooth' or 'auto' for scroll behavior
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: behavior
  });
};

/**
 * Hook to automatically scroll to top when component mounts or route changes
 */
export const useScrollToTop = () => {
  const scrollToTopOnMount = () => {
    scrollToTop();
  };

  return scrollToTopOnMount;
};

/**
 * Higher-order component to wrap components with scroll-to-top behavior
 */
export const withScrollToTop = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    React.useEffect(() => {
      scrollToTop();
    }, []);

    return React.createElement(Component, props);
  };
};
