import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Trash2,
  Activity
} from 'lucide-react';
import { useTextCleaner } from '@/hooks/useTextCleaner';
import { useToast } from '@/hooks/use-toast';

export function TextCleanerControls() {
  const { toast } = useToast();
  const {
    clean,
    cleanObj,
    hasProblems,
    getStats,
    startAutoCleaning,
    stopAutoCleaning,
    isAutoCleaningRunning
  } = useTextCleaner();

  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(5000);
  const [testText, setTestText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Check if auto-cleaner is running on mount
  useEffect(() => {
    setIsRunning(isAutoCleaningRunning());
  }, [isAutoCleaningRunning]);

  const handleStart = () => {
    startAutoCleaning(interval);
    setIsRunning(true);
    toast({
      title: 'Auto-Cleaner Started',
      description: `Running every ${interval / 1000} seconds`,
    });
  };

  const handleStop = () => {
    stopAutoCleaning();
    setIsRunning(false);
    toast({
      title: 'Auto-Cleaner Stopped',
      description: 'Automatic text cleaning has been disabled',
    });
  };

  const handleManualClean = () => {
    // Clean the entire document
    const beforeStats = document.body.textContent?.length || 0;
    
    // Use the document cleaner
    import('@/utils/textCleaner').then(({ cleanDocument }) => {
      cleanDocument();
      
      const afterStats = document.body.textContent?.length || 0;
      const cleaned = beforeStats - afterStats;
      
      toast({
        title: 'Manual Cleaning Complete',
        description: cleaned > 0 ? `Removed ${cleaned} problematic characters` : 'No issues found',
      });
    });
  };

  const handleTestText = () => {
    const result = clean(testText);
    const statistics = getStats(testText);
    
    setCleanedText(result);
    setStats(statistics);
  };

  const insertTestCharacters = () => {
    const testString = 'Sample text with \uFFFD replacement chars \uFFFD and other issues\uFFFD';
    setTestText(testString);
  };

  return (
    <div className="space-y-6">
      {/* Auto-Cleaner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Auto Text Cleaner
            {isRunning && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Running
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-cleaner"
                checked={isRunning}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleStart();
                  } else {
                    handleStop();
                  }
                }}
              />
              <Label htmlFor="auto-cleaner">
                Auto-clean every {interval / 1000} seconds
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="interval">Interval (milliseconds)</Label>
              <Input
                id="interval"
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 5000)}
                min="1000"
                max="60000"
                step="1000"
                disabled={isRunning}
              />
            </div>
            <Button
              onClick={handleManualClean}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clean Now
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            The auto-cleaner removes replacement characters (\uFFFD), null characters, 
            and other problematic Unicode characters from all text content.
          </div>
        </CardContent>
      </Card>

      {/* Text Testing Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Text Cleaning Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-text">Test Text</Label>
            <Textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test cleaning..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestText} disabled={!testText}>
              Clean Text
            </Button>
            <Button onClick={insertTestCharacters} variant="outline">
              Insert Test Characters
            </Button>
          </div>

          {cleanedText && (
            <div className="space-y-2">
              <Label>Cleaned Result</Label>
              <Textarea
                value={cleanedText}
                readOnly
                className="min-h-[100px] bg-muted"
              />
            </div>
          )}

          {stats && (
            <div className="space-y-2">
              <Label>Cleaning Statistics</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {stats.charCount > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span>
                    {stats.charCount > 0 
                      ? `${stats.charCount} problematic characters removed`
                      : 'No issues found'
                    }
                  </span>
                </div>
                {stats.removedChars.length > 0 && (
                  <div>
                    <strong>Removed:</strong> {stats.removedChars.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              onClick={() => {
                // Clean all form inputs
                const inputs = document.querySelectorAll('input, textarea');
                let cleanedCount = 0;
                
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
                
                toast({
                  title: 'Form Inputs Cleaned',
                  description: `Cleaned ${cleanedCount} form fields`,
                });
              }}
              variant="outline"
              size="sm"
            >
              Clean Form Inputs
            </Button>
            
            <Button
              onClick={() => {
                // Clean localStorage
                let cleanedCount = 0;
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
                
                toast({
                  title: 'Local Storage Cleaned',
                  description: `Cleaned ${cleanedCount} stored values`,
                });
              }}
              variant="outline"
              size="sm"
            >
              Clean Local Storage
            </Button>
            
            <Button
              onClick={() => {
                // Clean sessionStorage
                let cleanedCount = 0;
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
                
                toast({
                  title: 'Session Storage Cleaned',
                  description: `Cleaned ${cleanedCount} stored values`,
                });
              }}
              variant="outline"
              size="sm"
            >
              Clean Session Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
