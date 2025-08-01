import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BlogSystemHealthDashboard } from '@/components/BlogSystemHealthDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';

export function BlogSystemDiagnostic() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Allow access without authentication for diagnostic purposes
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Blog System Diagnostic
                    </h1>
                    <p className="text-gray-600">
                      Complete health check for your blog database and configurations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for non-admin users */}
          {user && user.email && !user.email.includes('admin') && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Diagnostic Tool</p>
                    <p className="text-sm text-yellow-700">
                      This tool scans your Supabase database for blog system requirements.
                      Some features may require admin privileges.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Diagnostic Dashboard */}
          <BlogSystemHealthDashboard />

          {/* Console Instructions */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Console Commands</h3>
              <p className="text-gray-600 mb-4">
                You can also run these commands in your browser console for quick checks:
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-2">
                  <div># Run full diagnostic</div>
                  <div>runBlogDiagnostic()</div>
                  <div className="mt-4"># Quick status check</div>
                  <div>getBlogQuickStatus()</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Required Tables</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <code>blog_posts</code> - Main blog content storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <code>user_saved_posts</code> - User claim tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <code>profiles</code> - User profiles and subscriptions
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Optional Components</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <code>generate_unique_slug()</code> - Slug generation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <code>increment_blog_post_views()</code> - View tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    RLS policies and indexes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BlogSystemDiagnostic;
