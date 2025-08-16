// Test script for emergency blog service fix
// Run this in browser console

console.log('🧪 Testing Emergency Blog Service Fix');

async function testEmergencyBlogFix() {
    console.log('1. Testing blogService with stream protection...');
    
    try {
        // Test with a known slug
        const testSlug = 'the-ultimate-guide-to-pastebin-mee3h6rh';
        console.log(`Testing slug: ${testSlug}`);
        
        const startTime = Date.now();
        const result = await blogService.getBlogPostBySlug(testSlug);
        const endTime = Date.now();
        
        console.log(`Query completed in ${endTime - startTime}ms`);
        
        if (result) {
            console.log('✅ Success! Blog post loaded:', {
                id: result.id,
                title: result.title,
                slug: result.slug,
                status: result.status
            });
        } else {
            console.log('ℹ️ No post found (but no error thrown)');
        }
        
        console.log('2. Testing emergency service directly...');
        
        // Test emergency service directly
        const emergencyResult = await emergencyBlogService.emergencyFetchBySlug(testSlug);
        
        if (emergencyResult) {
            console.log('✅ Emergency service working:', emergencyResult.title);
        } else {
            console.log('ℹ️ Emergency service: No post found');
        }
        
        console.log('3. Testing with non-existent slug...');
        
        const nonExistentResult = await blogService.getBlogPostBySlug('non-existent-' + Date.now());
        
        if (nonExistentResult === null) {
            console.log('✅ Non-existent slug handled correctly');
        } else {
            console.log('❓ Unexpected result for non-existent slug');
        }
        
        console.log('🎉 All tests completed - no stream errors!');
        
    } catch (error) {
        if (error.message.includes('body stream already read')) {
            console.error('❌ Stream error still occurring:', error.message);
            console.log('💡 Trying manual emergency service test...');
            
            // Manual emergency test
            try {
                const manualResult = await emergencyBlogService.createSamplePost('test-emergency');
                console.log('✅ Emergency fallback created:', manualResult.title);
            } catch (manualError) {
                console.error('❌ Even emergency fallback failed:', manualError.message);
            }
        } else {
            console.error('❌ Other error occurred:', error.message);
        }
    }
}

// Test configuration info
console.log('📋 Fix Summary:');
console.log('- Implemented multi-approach fetch strategy');
console.log('- Added completely isolated emergency client');
console.log('- Disabled retry mechanisms that could cause stream conflicts');
console.log('- Created fallback content generation');

// Run the test
testEmergencyBlogFix();
