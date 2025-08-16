import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function BeautifulBlogPostTest() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('BeautifulBlogPostTest mounted with slug:', slug);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading blog post...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Blog Post Test</h1>
      <p className="text-gray-600 mb-4">Slug: {slug}</p>
      <p className="text-green-600">✅ Component loaded successfully!</p>
      <p className="text-sm text-gray-500 mt-4">
        If you see this message, the component can be imported properly.
        The issue is likely in the full BeautifulBlogPost component.
      </p>
    </div>
  );
}

export default BeautifulBlogPostTest;
