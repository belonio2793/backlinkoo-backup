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
    return window.ethereum || null;
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
    if (safeEthereumAccess()) {
      resolve(window.ethereum);
      return;
    }

    const checkEthereum = () => {
      if (safeEthereumAccess()) {
        resolve(window.ethereum);
      } else {
        setTimeout(checkEthereum, 100);
      }
    };

    setTimeout(() => resolve(null), timeout);
    checkEthereum();
  });
};
