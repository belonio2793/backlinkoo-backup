import { useState, useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  error: string | null;
  cleanDomain: string;
}

export const useDomainValidation = (existingDomains: string[] = []) => {
  const [validationCache, setValidationCache] = useState<Map<string, ValidationResult>>(new Map());

  const validateDomain = useCallback((domain: string): ValidationResult => {
    // Check cache first
    if (validationCache.has(domain)) {
      return validationCache.get(domain)!;
    }

    const result = performValidation(domain, existingDomains);
    
    // Cache result
    setValidationCache(prev => new Map(prev).set(domain, result));
    
    return result;
  }, [existingDomains, validationCache]);

  const clearCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  return {
    validateDomain,
    clearCache
  };
};

function performValidation(domain: string, existingDomains: string[]): ValidationResult {
  // Empty check
  if (!domain.trim()) {
    return {
      isValid: false,
      error: 'Domain cannot be empty',
      cleanDomain: ''
    };
  }

  // Clean the domain
  const cleanDomain = domain.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

  // Length check
  if (cleanDomain.length > 253) {
    return {
      isValid: false,
      error: 'Domain name is too long (max 253 characters)',
      cleanDomain
    };
  }

  // Basic format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(cleanDomain)) {
    return {
      isValid: false,
      error: 'Invalid domain format. Use format: example.com',
      cleanDomain
    };
  }

  // Check for invalid characters
  if (cleanDomain.includes('..') || cleanDomain.startsWith('-') || cleanDomain.endsWith('-')) {
    return {
      isValid: false,
      error: 'Invalid domain format. Cannot contain consecutive dots or start/end with hyphens',
      cleanDomain
    };
  }

  // Check against existing domains
  if (existingDomains.includes(cleanDomain)) {
    return {
      isValid: false,
      error: 'Domain already exists in your list',
      cleanDomain
    };
  }

  // Reserved/special domains check
  const reservedDomains = [
    'localhost',
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'invalid',
    'local'
  ];

  if (reservedDomains.includes(cleanDomain)) {
    return {
      isValid: false,
      error: 'Cannot use reserved or example domains',
      cleanDomain
    };
  }

  // TLD validation - ensure at least 2 characters
  const parts = cleanDomain.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'Top-level domain must be at least 2 characters',
      cleanDomain
    };
  }

  return {
    isValid: true,
    error: null,
    cleanDomain
  };
}

// Utility function for real-time validation as user types
export const useRealTimeValidation = (existingDomains: string[] = []) => {
  const [currentDomain, setCurrentDomain] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { validateDomain } = useDomainValidation(existingDomains);

  const handleDomainChange = useCallback((domain: string) => {
    setCurrentDomain(domain);
    
    if (domain.trim()) {
      const result = validateDomain(domain);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [validateDomain]);

  const reset = useCallback(() => {
    setCurrentDomain('');
    setValidation(null);
  }, []);

  return {
    currentDomain,
    validation,
    handleDomainChange,
    reset,
    isValid: validation?.isValid ?? false,
    error: validation?.error ?? null,
    cleanDomain: validation?.cleanDomain ?? ''
  };
};
