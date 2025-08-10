/**
 * Environment Variables Service
 * Fetches environment variables from admin dashboard database
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForLogging } from '@/utils/errorUtils';

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

class EnvironmentVariablesService {
  private cache: Map<string, string> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get environment variable value by key
   */
  async getVariable(key: string): Promise<string | null> {
    // Priority: Environment variables (Edge Function Secrets) first
    const envValue = import.meta.env[key];
    if (envValue) {
      console.log('✅ Environment variable found:', envValue.substring(0, 15) + '...');
      return envValue;
    }

    // Fallback to localStorage cache for backwards compatibility
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (cached) {
        console.log('✅ Variable found in cache:', cached.substring(0, 15) + '...');
        return cached;
      }
    }

    // Load from localStorage if not in memory cache
    this.loadFromLocalStorage();
    const localValue = this.cache.get(key);
    if (localValue) {
      console.log('✅ Variable found in localStorage:', localValue.substring(0, 15) + '...');
      return localValue;
    }

    console.log('❌ No variable found for key:', key);
    return null;
  }

  /**
   * Get multiple environment variables
   */
  async getVariables(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    
    for (const key of keys) {
      result[key] = await this.getVariable(key);
    }
    
    return result;
  }

  /**
   * Refresh the cache with values from localStorage
   */
  async refreshCache(): Promise<void> {
    try {
      console.log('🔄 Refreshing environment variables cache from localStorage...');
      this.loadFromLocalStorage();
      this.lastFetch = Date.now();

      // Log what we have
      const keys = Array.from(this.cache.keys());
      console.log('📊 Cached variables:', keys.join(', '));

      // Check for OpenAI key specifically
      const apiKey = this.cache.get('OPENAI_API_KEY') || import.meta.env.OPENAI_API_KEY;
      if (apiKey) {
        console.log('🔑 OpenAI API key available:', apiKey.substring(0, 15) + '...');
      } else {
        console.log('❌ No OpenAI API key found');
      }
    } catch (error) {
      console.warn('Error refreshing cache:', error);
    }
  }

  /**
   * Load environment variables from localStorage fallback
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('admin_env_vars');
      if (stored) {
        const vars = JSON.parse(stored);
        this.cache.clear();
        vars.forEach((item: any) => {
          this.cache.set(item.key, item.value);
        });
        console.log('✅ Environment variables loaded from localStorage fallback');
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
  }

  /**
   * Get all environment variables (from cache/localStorage)
   */
  async getAllVariables(): Promise<EnvironmentVariable[]> {
    try {
      this.loadFromLocalStorage();
      const variables: EnvironmentVariable[] = [];

      for (const [key, value] of this.cache.entries()) {
        variables.push({
          id: key,
          key,
          value,
          description: `Environment variable for ${key}`,
          is_secret: key.includes('API_KEY') || key.includes('SECRET'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      return variables;
    } catch (error) {
      console.error('Error in getAllVariables:', formatErrorForLogging(error, 'getAllVariables'));
      return [];
    }
  }

  /**
   * Save environment variable (localStorage only)
   */
  async saveVariable(
    key: string,
    value: string,
    description?: string,
    isSecret: boolean = true
  ): Promise<boolean> {
    try {
      // Update cache
      this.cache.set(key, value);

      // Save to localStorage
      const stored = localStorage.getItem('admin_env_vars') || '[]';
      const vars = JSON.parse(stored);

      // Remove existing entry with same key
      const filtered = vars.filter((v: any) => v.key !== key);

      // Add new entry
      filtered.push({
        key,
        value,
        description,
        is_secret: isSecret,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      localStorage.setItem('admin_env_vars', JSON.stringify(filtered));
      console.log(`✅ Environment variable ${key} saved to localStorage`);
      return true;
    } catch (error) {
      console.error('Error in saveVariable:', formatErrorForLogging(error, 'saveVariable'));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to save environment variable: ${errorMessage}`);
    }
  }

  /**
   * Delete environment variable (localStorage only)
   */
  async deleteVariable(key: string): Promise<boolean> {
    try {
      // Remove from cache
      this.cache.delete(key);

      // Remove from localStorage
      const stored = localStorage.getItem('admin_env_vars') || '[]';
      const vars = JSON.parse(stored);
      const filtered = vars.filter((v: any) => v.key !== key);
      localStorage.setItem('admin_env_vars', JSON.stringify(filtered));

      console.log(`✅ Environment variable ${key} deleted from localStorage`);
      return true;
    } catch (error) {
      console.error('Error in deleteVariable:', formatErrorForLogging(error, 'deleteVariable'));
      return false;
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  async isOpenAIConfigured(): Promise<boolean> {
    const apiKey = await this.getVariable('OPENAI_API_KEY');
    return Boolean(apiKey && apiKey.startsWith('sk-'));
  }

  /**
   * Get OpenAI API key
   */
  async getOpenAIKey(): Promise<string | null> {
    return await this.getVariable('OPENAI_API_KEY');
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

export const environmentVariablesService = new EnvironmentVariablesService();
