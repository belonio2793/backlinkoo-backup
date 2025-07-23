import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calendar,
  BarChart3,
  TrendingUp,
  Globe
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  targetUrl: string;
  backlinks: number;
  views: number;
  createdAt: string;
  publishedAt?: string;
  keywords: string[];
}

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const { toast } = useToast();

  useEffect(() => {
    // Load mock data
    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'The Complete Guide to SEO Optimization',
        slug: 'complete-guide-seo-optimization',
        status: 'published',
        targetUrl: 'https://example.com/seo-guide',
        backlinks: 15,
        views: 1250,
        createdAt: '2024-01-15T10:30:00Z',
        publishedAt: '2024-01-16T09:00:00Z',
        keywords: ['SEO', 'optimization', 'search engine']
      },
      {
        id: '2',
        title: 'Best Link Building Strategies for 2024',
        slug: 'best-link-building-strategies-2024',
        status: 'published',
        targetUrl: 'https://example.com/link-building',
        backlinks: 8,
        views: 890,
        createdAt: '2024-01-10T14:20:00Z',
        publishedAt: '2024-01-11T11:30:00Z',
        keywords: ['link building', 'backlinks', 'SEO strategy']
      },
      {
        id: '3',
        title: 'Content Marketing Automation Tools',
        slug: 'content-marketing-automation-tools',
        status: 'draft',
        targetUrl: 'https://example.com/automation',
        backlinks: 0,
        views: 0,
        createdAt: '2024-01-20T16:45:00Z',
        keywords: ['content marketing', 'automation', 'tools']
      }
    ];
    setPosts(mockPosts);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || post.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (postId: string, newStatus: BlogPost['status']) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, status: newStatus, publishedAt: newStatus === 'published' ? new Date().toISOString() : post.publishedAt }
        : post
    ));
    toast({
      title: "Status Updated",
      description: `Post status changed to ${newStatus}`,
    });
  };

  const handleDelete = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast({
      title: "Post Deleted",
      description: "Blog post has been deleted successfully",
    });
  };

  const getStatusBadge = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const generateBacklinkUrl = (slug: string) => {
    return `https://backlinkoo.com/blog/${slug}`;
  };

  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
  const totalBacklinks = posts.reduce((sum, post) => sum + post.backlinks, 0);
  const publishedPosts = posts.filter(post => post.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backlinks</p>
                <p className="text-2xl font-bold">{totalBacklinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Posts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Backlinks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {post.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <a 
                        href={post.targetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate block max-w-[200px]"
                      >
                        {post.targetUrl}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">{post.views.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{post.backlinks}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => window.open(generateBacklinkUrl(post.slug), '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Post
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {post.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'published')}
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status === 'published' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(post.id, 'archived')}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blog posts found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
