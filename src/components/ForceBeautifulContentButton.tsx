import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Wand2 } from 'lucide-react';
import { forceBeautifulContentStructure } from '@/utils/forceBeautifulContentStructure';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function ForceBeautifulContentButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleForceBeautifulContent = async () => {
    setIsProcessing(true);
    try {
      console.log('🎨 Starting beautiful content structure enforcement...');
      await forceBeautifulContentStructure();
      
      toast({
        title: "🎨 Beautiful Content Applied!",
        description: "All blog posts now use the beautiful content structure. Check the console for detailed results.",
      });
    } catch (error: any) {
      console.error('Failed to apply beautiful content structure:', error);
      toast({
        title: "Error",
        description: `Failed to apply beautiful content structure: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2 text-purple-600" />
              Force Beautiful Content
              <Sparkles className="h-4 w-4 ml-2 text-purple-600" />
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Force Beautiful Content Structure
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will apply the beautiful content structure to <strong>ALL</strong> blog posts in the database.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">What this does:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Applies premium typography and styling</li>
                <li>• Enhances headings, paragraphs, and lists</li>
                <li>• Adds beautiful link and image formatting</li>
                <li>• Ensures consistent spacing and structure</li>
              </ul>
            </div>
            <p className="text-sm text-amber-600">
              ⚠️ Original content will be backed up to the original_content field.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleForceBeautifulContent}
            disabled={isProcessing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Beautiful Structure
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
