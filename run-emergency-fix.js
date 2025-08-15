/**
 * Automatically run emergency schema fix
 */

async function runEmergencyFix() {
  console.log('🚨 Running Emergency Schema Fix...\n');
  
  try {
    const response = await fetch('/.netlify/functions/emergency-schema-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Emergency schema fix completed successfully!');
      console.log('Results:', result);
      
      if (result.results) {
        console.log('\nDetailed Results:');
        result.results.forEach(r => console.log(`  ${r}`));
      }
    } else {
      const error = await response.text();
      console.log('❌ Emergency schema fix failed:');
      console.log('Status:', response.status);
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the fix
if (typeof window !== 'undefined') {
  // Browser environment
  runEmergencyFix();
  window.runEmergencyFix = runEmergencyFix;
} else {
  // Node environment  
  runEmergencyFix();
}
