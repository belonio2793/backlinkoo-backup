import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UserPostList } from '@/components/UserPostList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';

export function MyPosts() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="p-8">
              <CardContent className="space-y-4">
                <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                <h1 className="text-3xl font-bold text-gray-900">Sign In Required</h1>
                <p className="text-gray-600 text-lg">
                  Please sign in to view your claimed blog posts.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Blog Posts</h1>
                <p className="text-gray-600">
                  Manage your claimed and saved blog posts
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/blog')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Find More Posts
                </Button>
                
                <Button 
                  onClick={() => navigate('/blog/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  <UserPostCounter userId={user.id} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  <UserPostCounter userId={user.id} timeframe="month" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  <UserViewsCounter userId={user.id} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts List */}
          <UserPostList 
            userId={user.id}
            showEditButton={true}
            showDeleteButton={true}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Helper component to count user posts
function UserPostCounter({ userId, timeframe }: { userId: string; timeframe?: 'month' }) {
  // This would ideally be a hook that fetches the count
  // For now, we'll show a placeholder
  return <span>-</span>;
}

// Helper component to count total views
function UserViewsCounter({ userId }: { userId: string }) {
  // This would ideally be a hook that fetches the total views
  // For now, we'll show a placeholder  
  return <span>-</span>;
}

export default MyPosts;
