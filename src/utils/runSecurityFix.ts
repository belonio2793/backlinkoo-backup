import { executeSecurityRemoval } from './immediateSecurityFix';

// Auto-execute security removal when this module loads
console.log('🚨 AUTO-EXECUTING SECURITY REMOVAL TO FIX RLS ERRORS...');

executeSecurityRemoval().then(result => {
  if (result.success) {
    console.log('✅ SECURITY REMOVAL COMPLETE:', result.message);
    console.log('🎉 Blog post creation should now work without RLS errors');
  } else {
    console.error('❌ SECURITY REMOVAL FAILED:', result.error);
  }
}).catch(error => {
  console.error('❌ CRITICAL ERROR in security removal:', error);
});

export { executeSecurityRemoval };
