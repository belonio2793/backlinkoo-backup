/**
 * Test utilities for error handling
 * These help debug and test the Symbol conversion fixes
 */

import { getErrorMessage, formatErrorForUser } from './errorUtils';

/**
 * Test the error handling with various problematic inputs
 */
export function testErrorHandling() {
  console.log('🧪 Testing error handling with problematic inputs...');

  const testCases = [
    // Symbol test
    { name: 'Symbol', error: Symbol('test-symbol') },
    
    // Object with Symbol property
    { name: 'Object with Symbol', error: { [Symbol('test')]: 'value', message: 'test' } },
    
    // Mixed object
    { name: 'Mixed object', error: { 
      message: 'test message',
      [Symbol.iterator]: function*() { yield 1; },
      data: { nested: true }
    }},
    
    // Regular cases that should still work
    { name: 'String error', error: 'Simple string error' },
    { name: 'Error object', error: new Error('Test error') },
    { name: 'Object with message', error: { message: 'Object message' } },
    
    // Edge cases
    { name: 'Null', error: null },
    { name: 'Undefined', error: undefined },
    { name: 'Function', error: function() { return 'error'; } },
  ];

  testCases.forEach(({ name, error }) => {
    try {
      const message = getErrorMessage(error);
      const userMessage = formatErrorForUser(error, 'Test context');
      
      console.log(`✅ ${name}:`, {
        original: error,
        message,
        userMessage
      });
    } catch (testError) {
      console.error(`❌ ${name} failed:`, testError);
    }
  });

  console.log('🧪 Error handling test complete');
}

/**
 * Simulate the problematic error that was causing the Symbol conversion issue
 */
export function simulateSymbolError() {
  console.log('🔬 Simulating Symbol conversion error...');
  
  try {
    // Create an object that might have Symbol properties (like React internal objects)
    const problematicObject = {
      message: 'This object has symbol properties',
      [Symbol.for('react.element')]: true,
      [Symbol.iterator]: function*() { yield 1; },
      stack: 'fake stack trace'
    };

    // Test the error handling
    const result = formatErrorForUser(problematicObject);
    console.log('✅ Symbol error handled successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Symbol error simulation failed:', error);
    throw error;
  }
}

// Make these available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testErrorHandling = testErrorHandling;
  (window as any).simulateSymbolError = simulateSymbolError;
  console.log('🛠️ Error test utilities available: testErrorHandling(), simulateSymbolError()');
}
