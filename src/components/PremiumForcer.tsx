import { useState, useEffect } from 'react';
import { forcePremiumStatus } from '@/utils/forcePremium';

export function PremiumForcer() {
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    const execute = async () => {
      if (!executed) {
        const result = await forcePremiumStatus('labindalawamaryrose@gmail.com');
        console.log('Premium forcing result:', result);
        setExecuted(true);
      }
    };
    execute();
  }, [executed]);

  return null; // Don't render anything
}
