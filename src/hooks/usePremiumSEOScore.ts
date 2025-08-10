/**
 * Hook for managing premium SEO scores in components
 */

import { useState, useEffect } from 'react';
import { calculateEffectiveSEOScore, type BlogPost } from '@/utils/premiumSeoScore';

export function usePremiumSEOScore(blogPost: BlogPost | null) {
  const [effectiveScore, setEffectiveScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremiumScore, setIsPremiumScore] = useState(false);

  useEffect(() => {
    async function updateScore() {
      if (!blogPost) {
        setEffectiveScore(0);
        setIsPremiumScore(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const score = await calculateEffectiveSEOScore(blogPost);
        setEffectiveScore(score);
        setIsPremiumScore(score === 100 && (blogPost.seo_score || 0) < 100);
      } catch (error) {
        console.error('Error calculating effective SEO score:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        });
        setEffectiveScore(blogPost.seo_score || 0);
        setIsPremiumScore(false);
      } finally {
        setIsLoading(false);
      }
    }

    updateScore();
  }, [blogPost?.id, blogPost?.user_id, blogPost?.seo_score]);

  return {
    effectiveScore,
    isLoading,
    isPremiumScore,
    originalScore: blogPost?.seo_score || 0
  };
}
