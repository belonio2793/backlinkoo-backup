import React from 'react';
import { useParams } from 'react-router-dom';
import { BlogEditor } from '@/components/BlogEditor';

export function BlogEditPage() {
  const { postId } = useParams<{ postId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogEditor postId={postId} mode="edit" />
    </div>
  );
}
