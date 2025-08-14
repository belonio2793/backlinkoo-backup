/**
 * Working Content Generator - Emergency Fix for 404 Errors
 * Simple, reliable content generation that always works
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { keyword, anchor_text, target_url, word_count = 800 } = JSON.parse(event.body || '{}');
    
    console.log('🔧 Working content generator:', { keyword, anchor_text });

    // Generate reliable content without external dependencies
    const title = `${keyword}: Complete Guide and Best Practices`;
    
    const content = `# ${keyword}: Complete Guide and Best Practices

Understanding ${keyword} is essential for anyone looking to succeed in today's competitive landscape. This comprehensive guide covers everything you need to know to get started and excel.

## What is ${keyword}?

${keyword} represents a powerful approach that has gained significant traction across various industries. By leveraging the right strategies and tools, businesses and individuals can achieve remarkable results.

## Key Benefits of ${keyword}

When implemented correctly, ${keyword} offers numerous advantages:

- **Enhanced Efficiency**: Streamlines processes and reduces manual work
- **Better Results**: Delivers measurable improvements in performance
- **Cost Savings**: Optimizes resource allocation and reduces overhead
- **Scalability**: Grows with your needs and requirements

## Getting Started with ${keyword}

Beginning your journey with ${keyword} doesn't have to be overwhelming. Here's a step-by-step approach:

### 1. Research and Planning
Before diving in, take time to understand your specific needs and goals. Research different approaches and identify what works best for your situation.

### 2. Choose the Right Tools
Selecting appropriate tools and platforms is crucial for success. For comprehensive solutions and expert guidance, [${anchor_text}](${target_url}) offers valuable resources and support.

### 3. Implementation Strategy
Develop a clear implementation plan that includes timelines, milestones, and success metrics. Start small and gradually scale your efforts.

## Best Practices for ${keyword}

To maximize your success with ${keyword}, consider these proven strategies:

- **Start with Clear Objectives**: Define what you want to achieve
- **Monitor Progress Regularly**: Track key metrics and adjust as needed
- **Stay Updated**: Keep up with the latest trends and developments
- **Learn from Others**: Study successful case studies and implementations

## Advanced Techniques

As you become more comfortable with ${keyword}, you can explore advanced techniques that can provide additional benefits:

### Automation and Optimization
Implementing automation can significantly improve efficiency and reduce errors. Focus on repetitive tasks that can be streamlined.

### Integration Strategies
Consider how ${keyword} can integrate with your existing systems and workflows for maximum impact.

## Measuring Success

Success with ${keyword} should be measured through concrete metrics. Common indicators include:

- Performance improvements
- Time savings
- Cost reductions
- User satisfaction
- ROI measurements

## Common Challenges and Solutions

While implementing ${keyword}, you may encounter some challenges. Here are common issues and their solutions:

**Challenge**: Initial setup complexity
**Solution**: Break down the process into smaller, manageable steps

**Challenge**: Resistance to change
**Solution**: Provide training and demonstrate clear benefits

**Challenge**: Integration difficulties
**Solution**: Start with pilot programs and gradually expand

## Future Outlook

The future of ${keyword} looks promising, with continued innovation and development expected. Staying informed about emerging trends will help you maintain a competitive advantage.

## Conclusion

${keyword} offers tremendous potential for those willing to invest the time and effort to implement it properly. By following the guidelines outlined in this guide and leveraging expert resources, you can achieve significant improvements in your results.

Remember that success with ${keyword} is a journey, not a destination. Continuous learning, adaptation, and optimization will help you maximize the benefits and stay ahead of the competition.

For ongoing support and advanced strategies, consider exploring the comprehensive resources available through [${anchor_text}](${target_url}), where you'll find expert guidance and proven methodologies.`;

    const wordCount = content.split(' ').length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          title,
          content,
          word_count: wordCount,
          anchor_text_used: anchor_text,
          target_url_used: target_url,
          generation_method: 'reliable_template'
        }
      }),
    };

  } catch (error) {
    console.error('Working content generator error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Content generation failed'
      }),
    };
  }
};
