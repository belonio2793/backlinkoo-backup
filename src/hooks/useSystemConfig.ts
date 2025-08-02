import { useState, useEffect } from 'react';
import { systemConfig } from '@/services/systemConfigService';

interface SystemConfigState {
  openaiApiKey: string | null;
  keyStatus: 'loading' | 'available' | 'missing' | 'invalid';
  lastUpdated: Date | null;
  error?: string;
}

interface UseSystemConfigResult extends SystemConfigState {
  refresh: () => Promise<void>;
  testOpenAI: () => Promise<{ success: boolean; error?: string; model?: string }>;
  makeOpenAIRequest: (endpoint: string, payload: any) => Promise<any>;
}

export function useSystemConfig(): UseSystemConfigResult {
  const [config, setConfig] = useState<SystemConfigState>(() => systemConfig.getConfig());

  useEffect(() => {
    // Subscribe to configuration changes
    const unsubscribe = systemConfig.subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  const refresh = async () => {
    await systemConfig.refresh();
  };

  const testOpenAI = async () => {
    return await systemConfig.testOpenAIKey();
  };

  const makeOpenAIRequest = async (endpoint: string, payload: any) => {
    return await systemConfig.makeOpenAIRequest(endpoint, payload);
  };

  return {
    ...config,
    refresh,
    testOpenAI,
    makeOpenAIRequest
  };
}
