// Simple test for content processing
const testContent = `Unleashing the Power of Facebook: The Ultimate Guide to Dominating Social Media

In today's digital age, social media reigns supreme, and at the forefront of this virtual revolution stands Facebook.

****

1. Understanding Facebook's Algorithm
Facebook's algorithm determines what content appears in users' feeds.

2. Creating Engaging Content
Your content strategy should focus on value and engagement.

****

Whether you're a seasoned marketer, a budding influencer, or a casual user.`;

console.log('✅ Test content prepared');
console.log('Content length:', testContent.length);
console.log('Contains problematic markers:', testContent.includes('****'));
console.log('Contains numbered items:', testContent.includes('1.'));
