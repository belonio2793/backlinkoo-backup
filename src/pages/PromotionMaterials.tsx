import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { 
  Infinity,
  ArrowLeft,
  Download,
  Copy,
  Mail,
  Image,
  MessageSquare,
  Share2,
  Globe,
  Video,
  FileText,
  Smartphone,
  Monitor,
  Palette,
  ExternalLink
} from 'lucide-react';

const PromotionMaterials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const downloadAsset = (filename: string) => {
    toast({
      title: 'Download Started',
      description: `${filename} is being downloaded.`,
    });
  };

  const emailTemplates = [
    {
      title: "Welcome & Introduction",
      subject: "Boost Your SEO Rankings with Premium Backlinks",
      content: `Hi [Name],

I wanted to share something that's been a game-changer for my website's SEO performance.

I've been using Backlink ∞ for building high-quality backlinks, and the results have been incredible. They offer:

✓ 50% higher domain authority links than competitors

✓ High indexing rate

✓ Real-time campaign tracking

✓ Competitive pricing at $1.40 per link


If you're serious about improving your search rankings, I highly recommend checking them out.

[Your Affiliate Link]


Best regards,
[Your Name]`
    },
    {
      title: "Case Study Follow-up",
      subject: "How I Increased My Rankings by 147% in 60 Days",
      content: `Hi [Name],

Following up on our conversation about SEO - I mentioned how I dramatically improved my website rankings.

Here's exactly what I did:

📈 Used Backlink ∞ for high-quality link building

🎯 Focused on relevant, high-DA domains

📊 Tracked progress with their real-time dashboard

💰 Spent only $210 for 300 premium backlinks


The results? 147% increase in organic traffic in just 60 days.

Want to see the same results? Check out Backlink ∞:
[Your Affiliate Link]

Questions? Just reply to this email.


[Your Name]`
    }
  ];

  const socialPosts = {
    facebook: [
      {
        title: "Success Story Post",
        content: `🚀 SEO SUCCESS STORY 🚀

Just hit a major milestone with my website rankings! Here's what worked:

✅ High-quality backlinks from Backlink ∞
✅ High indexing rate
✅ Real-time tracking dashboard
✅ Only $1.40 per premium link

If you're struggling with SEO, this platform is a game-changer. The ROI has been phenomenal.

Check it out: [Your Affiliate Link]

#SEO #DigitalMarketing #BacklinkBuilding #WebsiteTraffic`
      },
      {
        title: "Educational Post",
        content: `💡 SEO TIP: Quality > Quantity with Backlinks

Many people think more backlinks = better rankings. That's not true!

What matters:
🎯 Domain Authority (DA) of linking sites
🔗 Relevance to your niche
📈 Natural link placement
⚡ Indexing rate

That's why I use Backlink ∞ - they focus on HIGH-QUALITY links that actually move the needle.

Learn more: [Your Affiliate Link]

#SEOTips #LinkBuilding #DigitalMarketing`
      }
    ],
    twitter: [
      {
        title: "Quick Win Tweet",
        content: `��� SEO professionals: Stop wasting money on low-quality backlinks

What you need:
✅ High DA domains
✅ High indexing rate
✅ Real-time tracking
✅ Fair pricing ($1.40/link)

Found all of this at Backlink ∞ 

[Your Affiliate Link]

#SEO #BacklinkBuilding`
      },
      {
        title: "Results Tweet",
        content: `📊 Update: 60 days of using Backlink ∞

Results:
• 147% increase in organic traffic
• 23 keywords now ranking in top 10
• $210 investment = $3,400 extra revenue

Best ROI I've seen for link building 💰

[Your Affiliate Link]

#SEOResults #LinkBuilding`
      }
    ],
    linkedin: [
      {
        title: "Professional Case Study",
        content: `SEO Case Study: How Strategic Link Building Drove 147% Traffic Growth

As a digital marketer, I'm always testing new strategies. Here's what worked:

🎯 Challenge: Improve organic rankings for competitive keywords
📈 Solution: High-quality backlink acquisition through Backlink ∞
⏱️ Timeline: 60 days
💰 Investment: $420 (300 premium backlinks at $1.40 each)

Results:
• 147% increase in organic traffic
• 23 keywords ranking in top 10
• $3,400 additional monthly revenue

Key success factors:
✅ High domain authority link sources (average DA 70+)
✅ High indexing rate
✅ Real-time campaign tracking
✅ Relevant, contextual link placement

For fellow marketers looking to scale their SEO efforts, I recommend checking out their platform: [Your Affiliate Link]

#SEO #DigitalMarketing #LinkBuilding #MarketingStrategy`
      }
    ]
  };

  const bannerAds = [
    {
      title: "Leaderboard Banner (728x90)",
      description: "Perfect for website headers and blog tops",
      sizes: "728x90px",
      formats: ["JPG", "PNG", "GIF"],
      preview: "🎯 PREMIUM BACKLINKS • HIGH INDEXING RATE • $1.40/LINK • GET STARTED →"
    },
    {
      title: "Medium Rectangle (300x250)",
      description: "Ideal for sidebar placements",
      sizes: "300x250px", 
      formats: ["JPG", "PNG", "GIF"],
      preview: "🚀 Backlink ∞\nPremium SEO Links\n$1.40 per link\nHigh Indexing Rate\n[GET STARTED]"
    },
    {
      title: "Skyscraper (160x600)",
      description: "Great for vertical sidebar spaces",
      sizes: "160x600px",
      formats: ["JPG", "PNG", "GIF"],
      preview: "Backlink ∞\n\n🎯 Premium\nBacklinks\n\n💰 $1.40\nper link\n\n📈 High\nIndexing\n\n[START]"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/affiliate')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Infinity className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold">Promotion Materials</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketing Materials</h1>
          <p className="text-muted-foreground">Ready-to-use promotional content for your affiliate campaigns</p>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>

          {/* Email Templates */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Templates
                </CardTitle>
                <CardDescription>Professional email templates for affiliate promotion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {emailTemplates.map((template, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Subject:</Badge>
                          <span className="text-sm">{template.subject}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {template.content}
                          </pre>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(template.content, 'Email template')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Template
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(template.subject, 'Email subject')}
                          >
                            Copy Subject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banner Ads */}
          <TabsContent value="banners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Banner Advertisements
                </CardTitle>
                <CardDescription>Professional banner ads in multiple sizes and formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {bannerAds.map((banner, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{banner.title}</CardTitle>
                            <CardDescription>{banner.description}</CardDescription>
                          </div>
                          <Badge variant="outline">{banner.sizes}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gradient-to-r from-primary/10 to-blue-50 p-4 rounded-lg mb-4 border-2 border-dashed border-primary/20">
                          <div className="text-center text-sm font-mono whitespace-pre-line">
                            {banner.preview}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm text-muted-foreground">Available formats:</span>
                          {banner.formats.map((format) => (
                            <Badge key={format} variant="secondary">{format}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {banner.formats.map((format) => (
                            <Button
                              key={format}
                              variant="outline"
                              onClick={() => downloadAsset(`${banner.title.toLowerCase().replace(/\s+/g, '-')}.${format.toLowerCase()}`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download {format}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid gap-6">
              {/* Facebook Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Facebook Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {socialPosts.facebook.map((post, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-base">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-4 rounded-lg mb-3">
                            <pre className="whitespace-pre-wrap text-sm">{post.content}</pre>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(post.content, 'Facebook post')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Post
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Twitter Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-black" />
                    X.com (Twitter) Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {socialPosts.twitter.map((post, index) => (
                      <Card key={index} className="border-l-4 border-l-black">
                        <CardHeader>
                          <CardTitle className="text-base">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-4 rounded-lg mb-3">
                            <pre className="whitespace-pre-wrap text-sm">{post.content}</pre>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(post.content, 'Twitter post')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Tweet
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-700" />
                    LinkedIn Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {socialPosts.linkedin.map((post, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-700">
                        <CardHeader>
                          <CardTitle className="text-base">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-4 rounded-lg mb-3">
                            <pre className="whitespace-pre-wrap text-sm">{post.content}</pre>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(post.content, 'LinkedIn post')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Post
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Marketing */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Content Marketing Materials
                </CardTitle>
                <CardDescription>Blog posts, articles, and content templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Blog Post: "The Ultimate Guide to High-Quality Backlinks"</CardTitle>
                      <CardDescription>SEO-optimized article template</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download Article
                        </Button>
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Case Study Template</CardTitle>
                      <CardDescription>Customizable success story template</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Materials */}
          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Video Content
                </CardTitle>
                <CardDescription>Video templates and promotional clips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Video Materials Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    We're creating professional video content including:
                  </p>
                  <div className="text-sm text-left max-w-md mx-auto space-y-1">
                    <p>• Explainer videos about our platform</p>
                    <p>• Success story testimonials</p>
                    <p>• Social media video templates</p>
                    <p>• YouTube ad templates</p>
                    <p>• TikTok promotion clips</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile Materials */}
          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Mobile-Optimized Materials
                </CardTitle>
                <CardDescription>Content optimized for mobile promotion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Instagram Stories Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download (1080x1920)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mobile Banner Ads</CardTitle>
                      <CardDescription>320x50, 320x100, 300x250 formats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download All Sizes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Brand Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Brand Guidelines
            </CardTitle>
            <CardDescription>Important guidelines for using our brand materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">✅ Do's</h4>
                <ul className="text-sm space-y-1">
                  <li>• Use official brand colors and fonts</li>
                  <li>• Include your affiliate link prominently</li>
                  <li>• Focus on benefits and results</li>
                  <li>• Be honest about your experience</li>
                  <li>• Follow platform posting guidelines</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">❌ Don'ts</h4>
                <ul className="text-sm space-y-1">
                  <li>• Don't modify logo or brand colors</li>
                  <li>• Don't make false claims</li>
                  <li>• Don't spam or over-promote</li>
                  <li>• Don't use misleading headlines</li>
                  <li>• Don't forget affiliate disclosures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PromotionMaterials;
