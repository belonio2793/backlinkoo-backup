import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { slugGenerationService } from '@/services/slugGenerationService';
import { useToast } from '@/hooks/use-toast';
import {
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Hash,
  Copy
} from 'lucide-react';

interface InlineSlugEditorProps {
  title: string;
  keywords?: string[];
  initialSlug?: string;
  onSlugChange: (slug: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InlineSlugEditor({
  title,
  keywords = [],
  initialSlug,
  onSlugChange,
  disabled = false,
  placeholder = 'auto-generated',
  className
}: InlineSlugEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [currentSlug, setCurrentSlug] = useState(initialSlug || '');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (title.trim() && !currentSlug) {
      generateSlugFromTitle();
    }
  }, [title]);

  useEffect(() => {
    if (currentSlug) {
      checkAvailability(currentSlug);
    }
  }, [currentSlug]);

  const generateSlugFromTitle = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const uniqueSlug = await slugGenerationService.generateUniqueSlug({
        title,
        keywords
      });
      
      setCurrentSlug(uniqueSlug);
      onSlugChange(uniqueSlug);
    } catch (error) {
      console.error('Failed to generate slug:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (slug: string) => {
    if (!slug.trim()) return;
    
    try {
      const suggestions = await slugGenerationService.generateSlugSuggestions({
        title,
        customSlug: slug
      });
      
      const customSuggestion = suggestions.find(s => s.slug === slug);
      setIsAvailable(customSuggestion?.isAvailable ?? null);
      
      // Validate the slug
      const validation = slugGenerationService.validateSlug(slug);
      setValidationErrors(validation.errors);
    } catch (error) {
      console.error('Failed to check availability:', error);
      setIsAvailable(null);
    }
  };

  const startEditing = () => {
    setEditValue(currentSlug);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditValue('');
    setIsEditing(false);
    setValidationErrors([]);
  };

  const saveEdit = () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      setValidationErrors(['Slug cannot be empty']);
      return;
    }

    const validation = slugGenerationService.validateSlug(trimmedValue);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setCurrentSlug(trimmedValue);
    onSlugChange(trimmedValue);
    setIsEditing(false);
    setEditValue('');
    setValidationErrors([]);
    
    toast({
      title: "Slug Updated",
      description: "Your blog post URL has been updated.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const copySlugToClipboard = async () => {
    const fullUrl = `${window.location.origin}/blog/${currentSlug}`;
    await navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Copied!",
      description: "Blog URL copied to clipboard.",
    });
  };

  const getAvailabilityColor = () => {
    if (isAvailable === null) return 'text-gray-500';
    return isAvailable ? 'text-green-600' : 'text-red-600';
  };

  const getAvailabilityIcon = () => {
    if (isAvailable === null) return null;
    return isAvailable ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />;
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">/blog/</span>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="enter-your-slug"
            className="font-mono text-sm"
            autoFocus
          />
          <Button
            variant="outline"
            size="sm"
            onClick={saveEdit}
            disabled={validationErrors.length > 0}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={cancelEditing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {validationErrors.length > 0 && (
          <div className="space-y-1">
            {validationErrors.slice(0, 2).map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 group">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">/blog/</span>
        
        {loading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        ) : currentSlug ? (
          <>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {currentSlug}
            </code>
            
            {/* Availability indicator */}
            <div className={`flex items-center gap-1 ${getAvailabilityColor()}`}>
              {getAvailabilityIcon()}
              <span className="text-xs">
                {isAvailable === null ? 'Checking...' : (isAvailable ? 'Available' : 'Taken')}
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditing}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={generateSlugFromTitle}
                className="h-6 w-6 p-0"
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={copySlugToClipboard}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            {placeholder}
          </span>
        )}
      </div>
      
      {/* Show availability status */}
      {currentSlug && isAvailable === false && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          This URL is already taken. Consider editing it or we'll add a unique suffix.
        </div>
      )}
    </div>
  );
}
