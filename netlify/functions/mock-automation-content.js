// Mock content generation for development environment
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { keyword, anchorText, targetUrl } = JSON.parse(event.body);

    // Validate required parameters
    if (!keyword || !anchorText || !targetUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters: keyword, anchorText, and targetUrl are required' 
        })
      };
    }

    // Generate mock content for development
    const mockContent = generateMockContent(keyword, anchorText, targetUrl);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        content: [mockContent],
        mock: true // Indicate this is mock data
      })
    };

  } catch (error) {
    console.error('Mock content generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate mock content'
      })
    };
  }
};

function generateMockContent(keyword, anchorText, targetUrl) {
  const templates = [
    {
      type: 'article',
      title: `Understanding ${keyword}: A Comprehensive Guide`,
      content: `
<h1>Understanding ${keyword}: A Comprehensive Guide</h1>

<p>In today's digital landscape, ${keyword} has become increasingly important for businesses and individuals alike. This comprehensive guide will explore the key aspects, benefits, and best practices related to ${keyword}.</p>

<h2>What is ${keyword}?</h2>

<p>${keyword} represents a crucial element in modern technology and business strategies. Understanding its fundamentals is essential for anyone looking to stay competitive in their field.</p>

<h2>Key Benefits and Applications</h2>

<p>The implementation of ${keyword} offers numerous advantages:</p>

<ul>
<li>Enhanced efficiency and productivity</li>
<li>Improved user experience and satisfaction</li>
<li>Better scalability and performance</li>
<li>Cost-effective solutions for complex problems</li>
</ul>

<h2>Best Practices and Implementation</h2>

<p>When working with ${keyword}, it's important to follow industry best practices. For comprehensive resources and tools related to ${keyword}, you can explore <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> which provides valuable insights and solutions.</p>

<h2>Case Studies and Real-World Examples</h2>

<p>Many organizations have successfully implemented ${keyword} strategies, resulting in significant improvements in their operations. These case studies demonstrate the practical value and impact of proper ${keyword} implementation.</p>

<h2>Future Trends and Considerations</h2>

<p>Looking ahead, ${keyword} continues to evolve with new technologies and methodologies. Staying informed about these developments is crucial for maintaining a competitive edge.</p>

<h2>Conclusion</h2>

<p>In conclusion, ${keyword} plays a vital role in modern business and technology landscapes. By understanding its principles and implementing best practices, organizations can achieve significant improvements in their operations and outcomes. For additional resources and expert guidance on ${keyword}, consider visiting ${anchorText} for comprehensive solutions tailored to your specific needs.</p>
      `
    },
    {
      type: 'blog_post',
      title: `${keyword}: Tips, Tricks, and Best Practices`,
      content: `
<h1>${keyword}: Tips, Tricks, and Best Practices</h1>

<p>Hey there! If you're looking to master ${keyword}, you've come to the right place. Today, I'm sharing some insider tips and practical advice that will help you get the most out of your ${keyword} journey.</p>

<h2>Getting Started with ${keyword}</h2>

<p>When I first started working with ${keyword}, I wish someone had told me these essential tips. Whether you're a beginner or looking to level up your skills, these insights will save you time and effort.</p>

<h2>Top 5 Tips for ${keyword} Success</h2>

<ol>
<li><strong>Start with the basics</strong> - Don't jump into advanced concepts without mastering the fundamentals</li>
<li><strong>Practice regularly</strong> - Consistency is key when learning ${keyword}</li>
<li><strong>Learn from experts</strong> - Follow industry leaders and learn from their experiences</li>
<li><strong>Join communities</strong> - Connect with others who share your interest in ${keyword}</li>
<li><strong>Stay updated</strong> - The field of ${keyword} is constantly evolving</li>
</ol>

<h2>Common Mistakes to Avoid</h2>

<p>Through my experience with ${keyword}, I've seen people make the same mistakes over and over. Here are the most common pitfalls and how to avoid them.</p>

<h2>Tools and Resources</h2>

<p>Having the right tools makes all the difference when working with ${keyword}. One resource that I highly recommend is <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>, which offers comprehensive solutions and expert guidance.</p>

<h2>Real-World Applications</h2>

<p>Let me share some practical examples of how ${keyword} can be applied in real-world scenarios. These case studies show the tangible benefits and impact of proper implementation.</p>

<h2>What's Next?</h2>

<p>Ready to take your ${keyword} skills to the next level? Here are some actionable steps you can take today to start seeing results.</p>

<p>Remember, mastering ${keyword} is a journey, not a destination. Keep learning, keep practicing, and don't be afraid to experiment with new approaches. Good luck!</p>
      `
    }
  ];

  // Randomly select a template
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    type: template.type,
    content: template.content,
    wordCount: countWords(template.content)
  };
}

function countWords(text) {
  // Remove HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, '');
  return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
}
