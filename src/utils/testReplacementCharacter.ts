/**
 * Test utility to verify the replacement character (�) removal is working
 */

export function testReplacementCharacterRemoval() {
  console.log('🧪 Testing � character removal...');
  
  // Create a test element with problematic characters
  const testDiv = document.createElement('div');
  testDiv.id = 'test-replacement-chars';
  testDiv.style.display = 'none';
  testDiv.innerHTML = 'Test content with � replacement character and other issues\uFEFF\u0000';
  
  document.body.appendChild(testDiv);
  
  console.log('📝 Added test element with � character:', testDiv.textContent);
  
  // The autocleaner should detect and clean this within 1 second
  setTimeout(() => {
    const cleanedContent = testDiv.textContent;
    console.log('🔍 Content after autocleaner:', cleanedContent);
    
    if (cleanedContent && cleanedContent.includes('�')) {
      console.error('❌ AutoCleaner failed - � character still present!');
    } else {
      console.log('✅ AutoCleaner working - � character removed!');
    }
    
    // Clean up test element
    document.body.removeChild(testDiv);
  }, 2000);
}

// Auto-run test when in development
if (import.meta.env.DEV) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testReplacementCharacterRemoval, 3000);
    });
  } else {
    setTimeout(testReplacementCharacterRemoval, 3000);
  }
}
