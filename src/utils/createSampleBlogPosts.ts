/**
 * Utility to create sample blog posts for testing the blog display
 */

import { blogService } from '@/services/blogService';

export async function createSampleBlogPosts() {
  console.log('📝 Creating sample blog posts...');

  const samplePosts = [
    {
      title: "The Ultimate Guide to SEO Link Building in 2024",
      content: `# The Ultimate Guide to SEO Link Building in 2024

Link building remains one of the most crucial aspects of SEO strategy. In 2024, the landscape has evolved significantly, requiring more sophisticated approaches to build high-quality backlinks.

## Understanding Modern Link Building

Today's link building is about creating genuine value and establishing authentic relationships. Search engines have become increasingly sophisticated at detecting manipulative practices.

### Key Strategies for Success

1. **Content-Driven Approach**: Create exceptional content that naturally attracts links
2. **Relationship Building**: Foster genuine connections with industry influencers
3. **Guest Posting**: Contribute valuable content to authoritative sites
4. **Resource Page Outreach**: Get listed on relevant resource pages

## Best Practices

- Focus on domain authority and relevance over quantity
- Ensure anchor text diversity
- Monitor your backlink profile regularly
- Build links from multiple sources

Remember, sustainable link building is a marathon, not a sprint. Quality always trumps quantity in modern SEO.`,
      targetUrl: "https://example.com/seo-services",
      anchorText: "SEO services",
      primaryKeyword: "SEO link building",
      wordCount: 150,
      readingTime: 2,
      seoScore: 85
    },
    {
      title: "Digital Marketing Trends That Will Dominate 2024",
      content: `# Digital Marketing Trends That Will Dominate 2024

The digital marketing landscape is constantly evolving, and 2024 promises to bring exciting new developments that will reshape how businesses connect with their audiences.

## AI-Powered Personalization

Artificial intelligence is revolutionizing how brands deliver personalized experiences. From chatbots to predictive analytics, AI is becoming indispensable for modern marketers.

### The Rise of Video Content

Video content continues to dominate across all platforms:

- **Short-form videos** are driving engagement on social media
- **Live streaming** builds authentic connections with audiences
- **Interactive videos** increase viewer participation

## Voice Search Optimization

With the growing adoption of smart speakers and voice assistants, optimizing for voice search is no longer optional.

## Conclusion

Staying ahead of these trends will be crucial for businesses looking to maintain their competitive edge in the digital marketplace.`,
      targetUrl: "https://example.com/marketing-agency",
      anchorText: "digital marketing agency",
      primaryKeyword: "digital marketing trends",
      wordCount: 120,
      readingTime: 2,
      seoScore: 78
    },
    {
      title: "Content Marketing Strategy: A Complete Beginner's Guide",
      content: `# Content Marketing Strategy: A Complete Beginner's Guide

Content marketing is the practice of creating and distributing valuable, relevant content to attract and engage a target audience.

## Why Content Marketing Matters

In today's digital world, consumers are bombarded with advertisements. Content marketing offers a way to provide value first, building trust and authority.

### Components of Effective Content Marketing

1. **Audience Research**: Understanding your target market
2. **Content Planning**: Developing a strategic content calendar
3. **Quality Creation**: Producing valuable, engaging content
4. **Distribution**: Getting your content in front of the right people
5. **Measurement**: Tracking performance and ROI

## Content Types That Work

- **Blog posts** for educational content
- **Infographics** for visual learners
- **Videos** for engagement
- **Podcasts** for on-the-go consumption
- **Ebooks** for lead generation

## Getting Started

Begin with a clear understanding of your audience's pain points and create content that addresses these challenges directly.`,
      targetUrl: "https://example.com/content-marketing",
      anchorText: "content marketing services",
      primaryKeyword: "content marketing strategy",
      wordCount: 140,
      readingTime: 2,
      seoScore: 82
    }
  ];

  const createdPosts = [];

  for (const postData of samplePosts) {
    try {
      console.log(`Creating post: ${postData.title}`);
      const post = await blogService.createBlogPost(postData, undefined, false);
      createdPosts.push(post);
      console.log(`✅ Created: ${post.title} (slug: ${post.slug})`);
    } catch (error: any) {
      console.error(`❌ Failed to create post "${postData.title}":`, error.message);
    }
  }

  console.log(`✅ Sample blog posts creation complete: ${createdPosts.length}/${samplePosts.length} posts created`);
  
  if (createdPosts.length > 0) {
    console.log('🔄 Refreshing page to show new posts...');
    setTimeout(() => window.location.reload(), 1000);
  }

  return createdPosts;
}

// Add to window for manual testing
if (import.meta.env.DEV) {
  (window as any).createSampleBlogPosts = createSampleBlogPosts;
}
