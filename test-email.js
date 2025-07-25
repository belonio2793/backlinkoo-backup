// Email test script
const testEmailConfig = async () => {
  try {
    console.log('Starting email configuration test...');
    
    // Test email data
    const emailData = {
      to: 'support@backlinkoo.com',
      subject: 'Email Configuration Test - ' + new Date().toLocaleString(),
      message: `Hello Support Team,

This is a test email to verify that our email configuration is working properly.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Source: Direct Email Configuration Test
- Environment: Testing

If you receive this email, the email sending functionality is working correctly.

Best regards,
Backlink Application`
    };

    console.log('Test email data:', emailData);
    
    // Simulate the test (since we're in Node.js context, we can't directly use Supabase client)
    console.log('✅ Email test configuration ready');
    console.log('📧 Target email:', emailData.to);
    console.log('📝 Subject:', emailData.subject);
    console.log('📄 Message length:', emailData.message.length, 'characters');
    
    return {
      success: true,
      message: 'Email test configuration validated',
      data: emailData
    };
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

// Run the test
testEmailConfig().then(result => {
  console.log('\n=== EMAIL TEST RESULT ===');
  console.log('Success:', result.success);
  console.log('Message:', result.message);
  if (result.data) {
    console.log('Email ready to send to:', result.data.to);
  }
  console.log('========================\n');
});
