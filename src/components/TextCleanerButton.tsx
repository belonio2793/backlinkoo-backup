import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle } from 'lucide-react';
import { useTextCleaner } from '@/hooks/useTextCleaner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TextCleanerButtonProps {
  /**
   * Target element selector to clean (optional, defaults to entire document)
   */
  targetSelector?: string;
  
  /**
   * Custom text to clean (if provided, will clean this instead of DOM)
   */
  text?: string;
  
  /**
   * Callback when text is cleaned
   */
  onCleaned?: (cleanedText: string, stats: any) => void;
  
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom button text
   */
  children?: React.ReactNode;
  
  /**
   * Show statistics in toast
   */
  showStats?: boolean;
}

export function TextCleanerButton({
  targetSelector,
  text,
  onCleaned,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  showStats = true
}: TextCleanerButtonProps) {
  const { clean, getStats } = useTextCleaner();
  const { toast } = useToast();

  const handleClean = () => {
    if (text) {
      // Clean provided text
      const cleanedText = clean(text);
      const stats = getStats(text);
      
      onCleaned?.(cleanedText, stats);
      
      if (showStats) {
        toast({
          title: stats.charCount > 0 ? 'Text Cleaned' : 'No Issues Found',
          description: stats.charCount > 0 
            ? `Removed ${stats.charCount} problematic characters`
            : 'Text is already clean',
        });
      }
    } else {
      // Clean DOM elements
      try {
        const targetElement = targetSelector 
          ? document.querySelector(targetSelector)
          : document.body;
        
        if (!targetElement) {
          toast({
            title: 'Target Not Found',
            description: `Could not find element: ${targetSelector}`,
            variant: 'destructive'
          });
          return;
        }

        // Import and use the DOM cleaner
        import('@/utils/textCleaner').then(({ cleanDOMElement }) => {
          const beforeText = targetElement.textContent || '';
          cleanDOMElement(targetElement as Element);
          const afterText = targetElement.textContent || '';
          
          const stats = getStats(beforeText);
          
          if (showStats) {
            toast({
              title: stats.charCount > 0 ? 'DOM Cleaned' : 'No Issues Found',
              description: stats.charCount > 0 
                ? `Cleaned ${targetSelector || 'document'} - removed ${stats.charCount} problematic characters`
                : `${targetSelector || 'Document'} is already clean`,
            });
          }
          
          onCleaned?.(afterText, stats);
        });
        
      } catch (error) {
        console.error('Error cleaning DOM:', error);
        toast({
          title: 'Cleaning Failed',
          description: 'An error occurred while cleaning the content',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <Button
      onClick={handleClean}
      variant={variant}
      size={size}
      className={cn('flex items-center gap-2', className)}
    >
      <Trash2 className="h-4 w-4" />
      {children || 'Clean Text'}
    </Button>
  );
}

/**
 * Quick action button for common cleaning tasks
 */
export function QuickCleanButton({ 
  type,
  className 
}: { 
  type: 'forms' | 'localStorage' | 'sessionStorage' | 'document';
  className?: string;
}) {
  const { clean } = useTextCleaner();
  const { toast } = useToast();

  const handleQuickClean = () => {
    let cleanedCount = 0;
    let title = '';
    
    try {
      switch (type) {
        case 'forms':
          const inputs = document.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
              const original = input.value;
              const cleaned = clean(original);
              if (original !== cleaned) {
                input.value = cleaned;
                cleanedCount++;
              }
            }
          });
          title = 'Form Inputs Cleaned';
          break;
          
        case 'localStorage':
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const value = localStorage.getItem(key);
              if (value) {
                const cleaned = clean(value);
                if (value !== cleaned) {
                  localStorage.setItem(key, cleaned);
                  cleanedCount++;
                }
              }
            }
          }
          title = 'Local Storage Cleaned';
          break;
          
        case 'sessionStorage':
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
              const value = sessionStorage.getItem(key);
              if (value) {
                const cleaned = clean(value);
                if (value !== cleaned) {
                  sessionStorage.setItem(key, cleaned);
                  cleanedCount++;
                }
              }
            }
          }
          title = 'Session Storage Cleaned';
          break;
          
        case 'document':
          import('@/utils/textCleaner').then(({ cleanDocument }) => {
            cleanDocument();
            toast({
              title: 'Document Cleaned',
              description: 'All text content has been cleaned',
            });
          });
          return;
      }
      
      toast({
        title,
        description: cleanedCount > 0 
          ? `Cleaned ${cleanedCount} items`
          : 'No issues found',
      });
      
    } catch (error) {
      console.error(`Error cleaning ${type}:`, error);
      toast({
        title: 'Cleaning Failed',
        description: `Failed to clean ${type}`,
        variant: 'destructive'
      });
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'forms': return 'Clean Forms';
      case 'localStorage': return 'Clean Local Storage';
      case 'sessionStorage': return 'Clean Session Storage';
      case 'document': return 'Clean Document';
      default: return 'Clean';
    }
  };

  return (
    <Button
      onClick={handleQuickClean}
      variant="outline"
      size="sm"
      className={cn('flex items-center gap-2', className)}
    >
      <CheckCircle className="h-4 w-4" />
      {getButtonText()}
    </Button>
  );
}
