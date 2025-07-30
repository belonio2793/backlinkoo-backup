import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EnhancedBlogCreationForm } from '@/components/EnhancedBlogCreationForm';
import { ArrowLeft } from 'lucide-react';

export function EnhancedBlogCreation() {
  const navigate = useNavigate();

  const handleBlogCreated = (blog: any) => {
    // Navigate to the created blog post
    setTimeout(() => {
      navigate(`/blog/${blog.slug}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Advanced Blog Creator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create professional blog posts with AI assistance, automatic database storage, 
              and full editing capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EnhancedBlogCreationForm 
          onBlogCreated={handleBlogCreated}
          variant="full"
          showUserPosts={true}
        />
      </div>
    </div>
  );
}
