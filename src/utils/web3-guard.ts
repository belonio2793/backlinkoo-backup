/**
 * Web3 Guard Utility
 * Prevents ethereum object conflicts from browser extensions
 */

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const safeEthereumAccess = (): any | null => {
  try {
    // Handle cases where ethereum might be accessed during redefinition conflicts
    if (typeof window !== 'undefined') {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
      if (descriptor && descriptor.value) {
        return descriptor.value;
      }
      return window.ethereum || null;
    }
    return null;
  } catch (error) {
    console.warn('Ethereum object access blocked:', error);
    return null;
  }
};

export const isWeb3Available = (): boolean => {
  try {
    return Boolean(window.ethereum);
  } catch (error) {
    return false;
  }
};

export const waitForEthereum = (timeout = 3000): Promise<any> => {
  return new Promise((resolve) => {
    const ethereum = safeEthereumAccess();
    if (ethereum) {
      resolve(ethereum);
      return;
    }

    const checkEthereum = () => {
      const current = safeEthereumAccess();
      if (current) {
        resolve(current);
      } else {
        setTimeout(checkEthereum, 100);
      }
    };

    setTimeout(() => resolve(null), timeout);
    checkEthereum();
  });
};
