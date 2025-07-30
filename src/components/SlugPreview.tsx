import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { slugGenerationService } from '@/services/slugGenerationService';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Copy,
  ExternalLink,
  Hash,
  Check,
  AlertCircle
} from 'lucide-react';

interface SlugPreviewProps {
  title: string;
  keywords?: string[];
  slug?: string;
  onSlugGenerated?: (slug: string) => void;
  showActions?: boolean;
  className?: string;
}

export function SlugPreview({
  title,
  keywords = [],
  slug,
  onSlugGenerated,
  showActions = true,
  className
}: SlugPreviewProps) {
  const { toast } = useToast();
  const [generatedSlug, setGeneratedSlug] = useState(slug || '');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (title.trim() && !slug) {
      generateSlug();
    } else if (slug) {
      setGeneratedSlug(slug);
      checkAvailability(slug);
    }
  }, [title, keywords]);

  const generateSlug = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const uniqueSlug = await slugGenerationService.generateUniqueSlug({
        title,
        keywords
      });
      
      setGeneratedSlug(uniqueSlug);
      setIsAvailable(true);
      
      if (onSlugGenerated) {
        onSlugGenerated(uniqueSlug);
      }
    } catch (error) {
      console.error('Failed to generate slug:', error);
      toast({
        title: "Error",
        description: "Failed to generate slug. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (slugToCheck: string) => {
    try {
      const suggestions = await slugGenerationService.generateSlugSuggestions({
        title,
        customSlug: slugToCheck
      });
      
      const customSuggestion = suggestions.find(s => s.slug === slugToCheck);
      setIsAvailable(customSuggestion?.isAvailable ?? null);
    } catch (error) {
      console.error('Failed to check availability:', error);
      setIsAvailable(null);
    }
  };

  const copySlugToClipboard = async () => {
    const fullUrl = `${window.location.origin}/blog/${generatedSlug}`;
    await navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Copied!",
      description: "Blog URL copied to clipboard.",
    });
  };

  const getAvailabilityBadge = () => {
    if (isAvailable === null) return null;
    
    return (
      <Badge
        variant={isAvailable ? "default" : "destructive"}
        className="text-xs"
      >
        {isAvailable ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Available
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 mr-1" />
            Taken
          </>
        )}
      </Badge>
    );
  };

  if (!generatedSlug) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Hash className="h-4 w-4" />
        <span>Slug will be generated from title</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">URL:</span>
        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
          /blog/{generatedSlug}
        </code>
        {getAvailabilityBadge()}
      </div>
      
      {showActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSlug}
            disabled={loading}
            className="h-7 text-xs"
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Regenerate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copySlugToClipboard}
            className="h-7 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy URL
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/blog/${generatedSlug}`, '_blank')}
            className="h-7 text-xs"
            disabled={!isAvailable}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      )}
    </div>
  );
}
