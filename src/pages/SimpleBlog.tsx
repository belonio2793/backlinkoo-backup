import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Infinity, Search, Filter, Clock, User, Eye, ExternalLink } from 'lucide-react';
import { Footer } from '@/components/Footer';

// Simple mock blog posts for demonstration
const mockBlogPosts = [
  {
    id: 1,
    title: "10 Advanced SEO Strategies for 2024",
    excerpt: "Discover cutting-edge SEO techniques that will boost your rankings and drive organic traffic to your website.",
    author: "SEO Expert",
    created_at: "2024-01-15",
    category: "SEO",
    view_count: 1250,
    read_time: 8,
    slug: "advanced-seo-strategies-2024"
  },
  {
    id: 2, 
    title: "The Ultimate Guide to Backlink Building",
    excerpt: "Learn proven strategies to build high-quality backlinks that will improve your domain authority and search rankings.",
    author: "Link Builder Pro",
    created_at: "2024-01-10",
    category: "Link Building", 
    view_count: 890,
    read_time: 12,
    slug: "ultimate-backlink-building-guide"
  },
  {
    id: 3,
    title: "Content Marketing That Converts",
    excerpt: "Create compelling content that not only ranks well in search engines but also converts visitors into customers.",
    author: "Content Strategist",
    created_at: "2024-01-05",
    category: "Content Marketing",
    view_count: 1100,
    read_time: 10,
    slug: "content-marketing-that-converts"
  }
];

export default function SimpleBlog() {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Infinity className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Backlink ∞</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/")} className="font-medium">
                Home
              </Button>
              <Button onClick={() => navigate("/")} className="font-medium">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <Search className="mr-2 h-4 w-4" />
                Expert Content Hub
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                Backlink ∞
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {" "}Blog
                </span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Discover high-quality, expert content designed to boost SEO rankings with contextual backlinks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                placeholder="Search expert posts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">All Categories</option>
                  <option value="seo">SEO</option>
                  <option value="link-building">Link Building</option>
                  <option value="content-marketing">Content Marketing</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockBlogPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {post.category}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    {post.view_count}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.read_time} min read
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {formatDate(post.created_at)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                  >
                    Read More
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
          >
            Load More Posts
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
