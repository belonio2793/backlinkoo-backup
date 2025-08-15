/**
 * Mock Content Generator for Development Environment
 * Provides realistic content generation without external API dependencies
 */

export interface MockContentResult {
  success: boolean;
  data: {
    title: string;
    content: string;
    wordCount: number;
    keyword: string;
    anchorText: string;
    targetUrl: string;
    generatedAt: string;
  };
  mock: boolean;
}

export class MockContentGenerator {
  private static contentTemplates = [
    {
      template: `
<h3>Understanding {keyword}: A Comprehensive Guide</h3>

<p>In today's digital landscape, {keyword} has become increasingly important for businesses and individuals alike. This comprehensive guide will explore the various aspects of {keyword} and how it can benefit your operations.</p>

<p>The fundamentals of {keyword} are rooted in proven methodologies that have been tested across multiple industries. When implementing {keyword} strategies, it's essential to understand the core principles that drive success.</p>

<h4>Key Benefits of {keyword}</h4>

<p>There are numerous advantages to incorporating {keyword} into your workflow:</p>

<p>• Enhanced efficiency and productivity</p>
<p>• Improved decision-making capabilities</p>
<p>• Better resource allocation and management</p>
<p>• Increased competitive advantage in the market</p>

<h4>Best Practices for Implementation</h4>

<p>When you're ready to implement {keyword} solutions, consider working with experienced professionals who understand the nuances of this field. For comprehensive {keyword} services, many businesses turn to trusted providers who can offer expert guidance.</p>

<p>The implementation process typically involves several key phases. First, you'll need to assess your current situation and identify areas where {keyword} can provide the most value. This assessment helps create a roadmap for successful deployment.</p>

<p>For those looking to explore advanced {keyword} techniques, {anchorText} represents an excellent starting point for learning more about industry best practices and proven methodologies.</p>

<h4>Measuring Success and ROI</h4>

<p>To ensure your {keyword} initiatives are delivering the expected results, it's crucial to establish clear metrics and key performance indicators (KPIs). Regular monitoring and analysis will help you optimize your approach and maximize return on investment.</p>

<p>Industry research shows that organizations implementing {keyword} strategies typically see measurable improvements within the first quarter of deployment. These improvements often compound over time, leading to significant long-term benefits.</p>

<h4>Future Trends and Considerations</h4>

<p>The {keyword} landscape continues to evolve rapidly. Staying informed about emerging trends and technologies is essential for maintaining a competitive edge. Consider subscribing to industry publications and participating in professional development opportunities.</p>

<p>As we look toward the future, {keyword} will likely play an even more significant role in business operations. Early adopters who invest in comprehensive {keyword} strategies today will be well-positioned to capitalize on future opportunities.</p>

<p>Whether you're just getting started with {keyword} or looking to enhance your existing capabilities, the key is to approach implementation strategically and with proper planning. Success in this area requires both technical expertise and a clear understanding of your specific business objectives.</p>
      `,
      baseWordCount: 420
    },
    {
      template: `
<h3>The Ultimate {keyword} Strategy for Modern Businesses</h3>

<p>The world of {keyword} is rapidly evolving, presenting both opportunities and challenges for forward-thinking organizations. Understanding how to leverage {keyword} effectively can be the difference between thriving and merely surviving in today's competitive marketplace.</p>

<p>Recent studies indicate that companies implementing robust {keyword} strategies experience significantly higher growth rates compared to their competitors. This correlation isn't coincidental – {keyword} provides the foundation for sustainable business development and innovation.</p>

<h4>Core Components of Effective {keyword}</h4>

<p>Successful {keyword} implementation requires attention to several critical elements:</p>

<p>• Strategic planning and goal alignment</p>
<p>• Resource allocation and budget management</p>
<p>• Technology integration and optimization</p>
<p>• Team training and skill development</p>
<p>• Continuous monitoring and improvement</p>

<h4>Industry Applications and Use Cases</h4>

<p>The versatility of {keyword} makes it applicable across various industries and business models. From startups to enterprise-level organizations, {keyword} principles can be adapted to meet specific needs and objectives.</p>

<p>Small and medium-sized businesses often find that {keyword} provides them with tools to compete more effectively against larger competitors. By implementing smart {keyword} strategies, these companies can achieve operational efficiency that rivals much larger organizations.</p>

<p>For businesses seeking to enhance their {keyword} capabilities, partnering with experienced providers can accelerate results. Resources like {anchorText} offer valuable insights and proven methodologies that can help organizations achieve their goals more efficiently.</p>

<h4>Common Challenges and Solutions</h4>

<p>While {keyword} offers tremendous potential, implementation isn't without its challenges. Organizations often encounter obstacles related to change management, technology integration, and resource constraints.</p>

<p>The most successful {keyword} implementations are those that anticipate these challenges and develop comprehensive mitigation strategies. This proactive approach helps ensure smooth transitions and minimizes potential disruptions to business operations.</p>

<h4>Measuring Impact and Performance</h4>

<p>Establishing clear metrics is essential for evaluating the success of your {keyword} initiatives. Key performance indicators should align with broader business objectives and provide actionable insights for continuous improvement.</p>

<p>Regular performance reviews help identify areas where {keyword} strategies are excelling and where adjustments may be needed. This iterative approach ensures that your {keyword} implementation remains aligned with evolving business needs and market conditions.</p>

<p>The investment in {keyword} capabilities pays dividends over time. Organizations that commit to comprehensive {keyword} strategies often report improved efficiency, reduced costs, and enhanced competitive positioning within their respective markets.</p>
      `,
      baseWordCount: 445
    },
    {
      template: `
<h3>Mastering {keyword}: Essential Insights for Success</h3>

<p>In an era where digital transformation is reshaping entire industries, {keyword} has emerged as a critical success factor for organizations worldwide. The ability to effectively implement and manage {keyword} initiatives often determines long-term business viability and growth potential.</p>

<p>The landscape of {keyword} continues to evolve at an unprecedented pace. New technologies, methodologies, and best practices are constantly emerging, creating both opportunities for innovation and challenges for implementation.</p>

<h4>Strategic Approaches to {keyword}</h4>

<p>Developing a comprehensive {keyword} strategy requires careful consideration of multiple factors:</p>

<p>• Current market conditions and competitive landscape</p>
<p>• Organizational capabilities and resource availability</p>
<p>• Technology infrastructure and integration requirements</p>
<p>• Regulatory compliance and risk management considerations</p>
<p>• Long-term business objectives and growth plans</p>

<h4>Technology Integration and Innovation</h4>

<p>Modern {keyword} solutions increasingly rely on advanced technologies to deliver optimal results. Organizations that embrace technological innovation in their {keyword} approach often achieve superior outcomes compared to those using traditional methods.</p>

<p>The integration of artificial intelligence, machine learning, and automation technologies has revolutionized how businesses approach {keyword}. These tools enable more sophisticated analysis, faster decision-making, and improved operational efficiency.</p>

<p>Companies looking to stay ahead of the curve in {keyword} implementation often benefit from expert guidance and proven methodologies. Resources such as {anchorText} provide access to cutting-edge strategies and industry best practices that can accelerate success.</p>

<h4>Building Organizational Capability</h4>

<p>Successful {keyword} implementation extends beyond technology and processes – it requires building organizational capability at all levels. This includes developing skills, knowledge, and competencies that support long-term success.</p>

<p>Investment in team development and training is essential for maximizing the value of {keyword} initiatives. Organizations that prioritize capability building often see faster adoption rates and better overall results from their {keyword} investments.</p>

<h4>Risk Management and Compliance</h4>

<p>As {keyword} becomes more sophisticated, organizations must also consider risk management and compliance implications. Developing robust governance frameworks helps ensure that {keyword} initiatives align with regulatory requirements and organizational risk tolerance.</p>

<p>The most successful {keyword} implementations incorporate comprehensive risk assessment and mitigation strategies from the outset. This proactive approach helps prevent potential issues and ensures sustainable long-term success.</p>

<p>Looking ahead, {keyword} will continue to play an increasingly important role in business strategy and operations. Organizations that invest in comprehensive {keyword} capabilities today will be well-positioned to capitalize on future opportunities and navigate emerging challenges successfully.</p>
      `,
      baseWordCount: 468
    }
  ];

  private static titleTemplates = [
    "The Complete Guide to {keyword}",
    "Mastering {keyword}: Expert Tips and Strategies", 
    "{keyword}: Everything You Need to Know",
    "Professional {keyword} Techniques That Work",
    "{keyword} Best Practices for Success",
    "Advanced {keyword} Strategies and Insights",
    "{keyword}: A Comprehensive Overview",
    "Essential {keyword} Tips for Beginners",
    "The Ultimate {keyword} Strategy Guide",
    "{keyword} Implementation: A Step-by-Step Approach"
  ];

  /**
   * Generate mock content with realistic structure and anchor text integration
   */
  static async generateContent(params: {
    keyword: string;
    anchorText: string;
    targetUrl: string;
  }): Promise<MockContentResult> {
    const { keyword, anchorText, targetUrl } = params;

    // Add realistic processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Select random template
    const templateIndex = Math.floor(Math.random() * this.contentTemplates.length);
    const selectedTemplate = this.contentTemplates[templateIndex];

    // Generate title
    const titleTemplate = this.titleTemplates[Math.floor(Math.random() * this.titleTemplates.length)];
    const title = titleTemplate.replace(/{keyword}/g, this.capitalizeFirstLetter(keyword));

    // Process content template
    let content = selectedTemplate.template
      .replace(/{keyword}/g, keyword)
      .replace(/{anchorText}/g, `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`)
      .trim();

    // Add some randomization to make content unique
    const additionalParagraphs = this.generateAdditionalContent(keyword, anchorText);
    if (Math.random() > 0.5) {
      content += '\n\n' + additionalParagraphs;
    }

    // Calculate word count
    const wordCount = this.countWords(content) + Math.floor(Math.random() * 100) + 50;

    console.log(`🎭 Mock content generated: ${wordCount} words for "${keyword}"`);

    return {
      success: true,
      data: {
        title,
        content,
        wordCount,
        keyword,
        anchorText,
        targetUrl,
        generatedAt: new Date().toISOString()
      },
      mock: true
    };
  }

  /**
   * Generate additional content paragraphs for variation
   */
  private static generateAdditionalContent(keyword: string, anchorText: string): string {
    const additionalParagraphs = [
      `<h4>Getting Started with ${keyword}</h4>\n\n<p>For beginners, the journey into ${keyword} can seem overwhelming at first. However, with the right approach and resources, anyone can master the fundamentals and start seeing results quickly.</p>`,
      
      `<h4>Advanced Techniques</h4>\n\n<p>Once you've mastered the basics of ${keyword}, exploring advanced techniques can help you achieve even better results. These methods have been tested by industry professionals and proven to deliver exceptional outcomes.</p>`,
      
      `<h4>Common Mistakes to Avoid</h4>\n\n<p>Learning from the mistakes of others can save valuable time and resources in your ${keyword} journey. Understanding these common pitfalls helps ensure your implementation stays on track from the beginning.</p>`,
      
      `<h4>Tools and Resources</h4>\n\n<p>The right tools can make a significant difference in your ${keyword} success. From basic utilities to comprehensive platforms, having access to quality resources accelerates progress and improves outcomes.</p>`
    ];

    return additionalParagraphs[Math.floor(Math.random() * additionalParagraphs.length)];
  }

  /**
   * Count words in HTML content
   */
  private static countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  }

  /**
   * Capitalize first letter of a string
   */
  private static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Check if we're in development environment
   */
  static isDevelopmentEnvironment(): boolean {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('.netlify.app') ||
      window.location.hostname.includes('.dev') ||
      import.meta.env.DEV
    );
  }

  /**
   * Simulate OpenAI API errors for testing
   */
  static async generateContentWithErrors(params: {
    keyword: string;
    anchorText: string;
    targetUrl: string;
    simulateError?: boolean;
  }): Promise<MockContentResult> {
    if (params.simulateError && Math.random() > 0.7) {
      throw new Error('Mock OpenAI API Error: Rate limit exceeded');
    }

    return this.generateContent(params);
  }
}

export default MockContentGenerator;
