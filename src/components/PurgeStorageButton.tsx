import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { StoragePurge } from '@/utils/storagePurge';
import { Sparkles, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PurgeStorageButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const PurgeStorageButton = ({ 
  variant = 'ghost', 
  size = 'sm',
  className = '',
  showIcon = true,
  showText = false
}: PurgeStorageButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [storageInfo, setStorageInfo] = useState(StoragePurge.getStorageInfo());
  const { toast } = useToast();

  const handlePurge = async () => {
    setIsPurging(true);
    
    try {
      const result = await StoragePurge.purgeAllStorage();
      
      if (result.success) {
        toast({
          title: "Storage cleared successfully",
          description: `Cleared: ${result.clearedItems.join(', ')}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Storage partially cleared",
          description: `Cleared: ${result.clearedItems.join(', ')}. Errors: ${result.errors.join(', ')}`,
          variant: "destructive",
          duration: 7000,
        });
      }
      
      // Update storage info
      setStorageInfo(StoragePurge.getStorageInfo());
      setIsOpen(false);
      
      // Optionally reload the page after a short delay
      setTimeout(() => {
        if (window.confirm('Storage cleared! Would you like to refresh the page to ensure a clean state?')) {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Purge error:', error);
      toast({
        title: "Purge failed",
        description: "An error occurred while clearing storage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleOpenDialog = () => {
    // Refresh storage info when opening dialog
    setStorageInfo(StoragePurge.getStorageInfo());
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleOpenDialog}
          title="✨ Reset & refresh your session"
        >
          {showIcon && <Sparkles className="h-4 w-4" />}
          {showText && <span className={showIcon ? "ml-2" : ""}>Clear Storage</span>}
          {!showText && !showIcon && "Purge"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Reset & Refresh Session
          </DialogTitle>
          <DialogDescription>
            This will permanently remove all stored data for this website from your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Current Storage Usage:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Local Storage: {storageInfo.localStorage} items</li>
              <li>• Session Storage: {storageInfo.sessionStorage} items</li>
              <li>• Cookies: {storageInfo.cookies} items</li>
            </ul>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">What will be cleared:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• All login sessions and authentication</li>
              <li>• All saved preferences and settings</li>
              <li>• All cached data and temporary files</li>
              <li>• All cookies and tracking data</li>
              <li>• All offline data and databases</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Use this if you're experiencing:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Login issues or authentication problems</li>
              <li>• Corrupted data or settings</li>
              <li>• Performance issues</li>
              <li>• Need to completely reset your session</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPurging}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handlePurge} disabled={isPurging}>
            {isPurging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Clear All Storage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurgeStorageButton;
