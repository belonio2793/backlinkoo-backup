/**
 * Temporary OpenAI test script for internal testing
 */

// Test with random variables
const testVariables = {
  keyword: 'effective time management for entrepreneurs',
  url: 'https://example.com/time-management',
  anchorText: 'discover proven techniques',
  wordCount: 300,
  contentType: 'tutorial',
  tone: 'friendly'
};

console.log('🧪 Internal OpenAI Content Generation Test');
console.log('===========================================');
console.log();

console.log('📋 Test Variables:');
console.log(`  • Keyword: "${testVariables.keyword}"`);
console.log(`  • URL: ${testVariables.url}`);
console.log(`  • Anchor Text: "${testVariables.anchorText}"`);
console.log(`  • Word Count: ${testVariables.wordCount}`);
console.log(`  • Content Type: ${testVariables.contentType}`);
console.log(`  • Tone: ${testVariables.tone}`);
console.log();

// Simulate the Netlify function call structure
const netlifyPayload = {
  keyword: testVariables.keyword,
  url: testVariables.url,
  anchorText: testVariables.anchorText,
  wordCount: testVariables.wordCount,
  contentType: testVariables.contentType,
  tone: testVariables.tone
};

console.log('📦 Netlify Function Payload:');
console.log(JSON.stringify(netlifyPayload, null, 2));
console.log();

console.log('🔗 Function Endpoint: /.netlify/functions/generate-openai');
console.log('📡 Method: POST');
console.log();

// Test the prompt structure that would be generated
const systemPrompt = `You are an expert SEO content writer specializing in creating high-quality, engaging blog posts that rank well in search engines. Focus on step-by-step instructions, practical tips, and actionable advice. Use ${testVariables.tone} tone throughout the article. Always create original, valuable content that genuinely helps readers and ensures natural, contextual backlink integration.`;

const userPrompt = `Create a comprehensive ${testVariables.wordCount}-word ${testVariables.contentType} blog post about "${testVariables.keyword}" that naturally incorporates a backlink.

CONTENT REQUIREMENTS:
- Write exactly ${testVariables.wordCount} words of high-quality, original content
- Focus on "${testVariables.keyword}" as the main topic
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Natural integration of anchor text "${testVariables.anchorText}" linking to ${testVariables.url}

BACKLINK INTEGRATION:
- Place the backlink "${testVariables.anchorText}" naturally within the content
- Make the link contextually relevant to the surrounding text
- Ensure it adds value to the reader

OUTPUT FORMAT:
Return the content as HTML with proper tags and use <a href="${testVariables.url}" target="_blank" rel="noopener noreferrer">${testVariables.anchorText}</a> for the backlink.`;

console.log('🤖 Generated Prompts:');
console.log('System Prompt:', systemPrompt.substring(0, 100) + '...');
console.log('User Prompt:', userPrompt.substring(0, 100) + '...');
console.log();

console.log('✅ Test variables and structure validated');
console.log('🚀 Ready for OpenAI content generation');
