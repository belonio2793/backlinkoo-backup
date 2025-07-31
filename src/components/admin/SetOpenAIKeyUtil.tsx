import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { setDefaultOpenAIKey } from '@/utils/setOpenAIKey';
import { Key, CheckCircle } from 'lucide-react';

export function SetOpenAIKeyUtil() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSet, setIsSet] = useState(false);
  const { toast } = useToast();

  const handleSetKey = async () => {
    setIsLoading(true);
    try {
      const success = await setDefaultOpenAIKey();
      
      if (success) {
        setIsSet(true);
        toast({
          title: 'OpenAI API Key Set',
          description: 'The default OpenAI API key has been set across all settings.',
        });
      } else {
        toast({
          title: 'Failed to Set Key',
          description: 'There was an error setting the OpenAI API key.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error setting OpenAI key:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while setting the API key.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Set Default OpenAI Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will set the OpenAI API key as the default across all application settings.
          </p>
          
          <Button 
            onClick={handleSetKey} 
            disabled={isLoading || isSet}
            className="w-full"
          >
            {isLoading ? (
              'Setting Key...'
            ) : isSet ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Key Set Successfully
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Set OpenAI Key
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
