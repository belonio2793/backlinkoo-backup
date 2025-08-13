import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { environmentVariablesService } from '@/services/environmentVariablesService';
import { Key, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export function ForceAPIKeyUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>('');
  const { toast } = useToast();

  // API key should be retrieved from secure environment variables only

  const checkCurrentKey = async () => {
    try {
      const key = await environmentVariablesService.getOpenAIKey();
      setCurrentKey(key || 'NOT SET');
      
      console.log('🔍 Current key check:');
      console.log('Database key ends with:', key ? key.slice(-4) : 'NONE');
      console.log('Environment key:', import.meta.env.VITE_OPENAI_API_KEY?.slice(-4) || 'NONE');
    } catch (error) {
      console.error('Error checking current key:', error);
    }
  };

  const clearAllCaches = () => {
    console.log('🧹 Clearing all API key caches...');
    
    // Clear environment service cache
    environmentVariablesService.clearCache();
    
    // Clear localStorage caches
    localStorage.removeItem('admin_api_configurations');
    localStorage.removeItem('permanent_api_configs');
    localStorage.removeItem('temp_openai_key');
    localStorage.removeItem('admin_env_vars');
    localStorage.removeItem('openai_key_invalid');
    
    toast({
      title: 'Caches Cleared',
      description: 'All API key caches have been cleared',
    });
  };

  const forceUpdateKey = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Force updating API key to correct value...');
      
      // Clear all caches first
      clearAllCaches();
      
      // Set the correct key in database
      const success = await environmentVariablesService.saveVariable(
        'VITE_OPENAI_API_KEY',
        CORRECT_API_KEY,
        'OpenAI API key for AI content generation and blog creation - GLOBAL CONFIGURATION (FORCE UPDATED)',
        true
      );

      if (success) {
        // Force refresh cache
        await environmentVariablesService.refreshCache();
        
        // Check the key again
        await checkCurrentKey();
        
        toast({
          title: 'API Key Updated',
          description: 'The correct API key has been force-updated in the database',
        });
        
        // Test the key
        setTimeout(async () => {
          try {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${CORRECT_API_KEY}` },
              method: 'GET'
            });
            
            const status = response.ok ? 'Valid ✅' : `Invalid ❌ (${response.status})`;
            toast({
              title: 'API Key Test',
              description: `Key status: ${status}`,
              variant: response.ok ? 'default' : 'destructive'
            });
          } catch (error) {
            console.log('API key test failed:', error);
          }
        }, 1000);
        
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (error) {
      console.error('Error force updating key:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to force update the API key',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check current key on mount
  useState(() => {
    checkCurrentKey();
  });

  const isCorrectKey = currentKey.endsWith('1PsA');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Force API Key Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={isCorrectKey ? 'default' : 'destructive'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Current Key:</strong> {currentKey ? currentKey.substring(0, 15) + '...' + currentKey.slice(-4) : 'NOT SET'}
              </div>
              <div>
                <strong>Expected Key ends with:</strong> 1PsA
              </div>
              <div>
                <strong>Status:</strong> {isCorrectKey ? '✅ Correct' : '❌ Wrong key in use'}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={checkCurrentKey} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Current Key
          </Button>
          
          <Button onClick={clearAllCaches} variant="outline" className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Caches
          </Button>
        </div>

        <Button 
          onClick={forceUpdateKey} 
          disabled={isLoading}
          className="w-full"
          variant={isCorrectKey ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              Force Update to Correct Key
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
