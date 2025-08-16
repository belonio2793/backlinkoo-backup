import { Suspense } from 'react';
import { LazyBeautifulBlogPost } from '@/components/LazyComponents';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function BlogPost() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyBeautifulBlogPost />
    </Suspense>
  );
}
