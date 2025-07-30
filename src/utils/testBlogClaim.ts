/**
 * Simple test utility to verify blog claim functionality
 */

import { maskEmail, getDisplayEmailForPost } from './emailMasking';

export function testEmailMasking() {
  console.log('🧪 Testing Email Masking...');
  
  // Test email masking
  const testEmails = [
    'john.doe@gmail.com',
    'user123@example.com',
    'a@b.co',
    'verylongemail@domain.com'
  ];
  
  testEmails.forEach(email => {
    console.log(`${email} → ${maskEmail(email)}`);
  });
}

export function testEmailDisplay() {
  console.log('🧪 Testing Email Display for Posts...');
  
  const testCases = [
    {
      name: 'Unclaimed trial post',
      post: { user_id: null, is_trial_post: true },
      user: null
    },
    {
      name: 'Claimed post by current user',
      post: { user_id: 'user123', is_trial_post: false },
      user: { id: 'user123', email: 'user@example.com' }
    },
    {
      name: 'Claimed post by other user',
      post: { user_id: 'other123', is_trial_post: false },
      user: { id: 'user123', email: 'user@example.com' }
    }
  ];
  
  testCases.forEach(testCase => {
    const result = getDisplayEmailForPost(testCase.post, testCase.user, true);
    console.log(`${testCase.name}:`, result);
  });
}

// Run tests if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  (window as any).testBlogClaim = {
    testEmailMasking,
    testEmailDisplay
  };
}
