/**
 * Simple test to verify BacklinkAutomation module loads correctly
 * Run in browser console: testBacklinkAutomationLoad()
 */

export async function testBacklinkAutomationLoad() {
  console.log('🧪 Testing BacklinkAutomation module loading...');
  
  try {
    // Try to dynamically import the module
    const module = await import('@/pages/BacklinkAutomation');
    
    if (module.default) {
      console.log('✅ BacklinkAutomation module loaded successfully!');
      console.log('✅ Module exports:', Object.keys(module));
      return true;
    } else {
      console.error('❌ BacklinkAutomation module loaded but no default export found');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to load BacklinkAutomation module:', error);
    return false;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testBacklinkAutomationLoad = testBacklinkAutomationLoad;
  console.log('🔧 Module test available: testBacklinkAutomationLoad()');
}
