import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Shield, 
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UrlValidatorProps {
  results: Array<{
    id: string;
    url: string;
    domain: string;
    title: string;
    status: string;
    opportunity_score: number;
  }>;
  onValidationComplete: (validatedResults: any[]) => void;
}

interface ValidationResult {
  id: string;
  url: string;
  status: 'valid' | 'invalid' | 'working' | 'broken' | 'testing';
  response_time: number;
  http_status: number;
  has_forms: boolean;
  has_contact: boolean;
  error?: string;
}

const UrlValidator: React.FC<UrlValidatorProps> = ({ results, onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const { toast } = useToast();

  const validateUrls = async () => {
    if (results.length === 0) {
      toast({
        title: "No URLs to Validate",
        description: "Start a discovery session first to find URLs to validate.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationResults([]);
    setProgress(0);

    try {
      const batchSize = 5; // Validate 5 URLs at a time
      const batches = [];
      
      for (let i = 0; i < results.length; i += batchSize) {
        batches.push(results.slice(i, i + batchSize));
      }

      let completedCount = 0;
      const allResults: ValidationResult[] = [];

      for (const batch of batches) {
        setCurrentUrl(`Validating batch of ${batch.length} URLs...`);
        
        // Validate batch in parallel
        const batchPromises = batch.map(async (result) => {
          return await validateSingleUrl(result);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled' && promiseResult.value) {
            allResults.push(promiseResult.value);
          } else {
            // Handle failed validation
            allResults.push({
              id: batch[index].id,
              url: batch[index].url,
              status: 'invalid',
              response_time: 0,
              http_status: 0,
              has_forms: false,
              has_contact: false,
              error: 'Validation failed'
            });
          }
        });

        completedCount += batch.length;
        setProgress((completedCount / results.length) * 100);
        setValidationResults([...allResults]);

        // Small delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update database with validation results
      await updateValidationResults(allResults);
      
      setIsValidating(false);
      setCurrentUrl('');
      onValidationComplete(allResults);
      
      const workingCount = allResults.filter(r => r.status === 'working').length;
      toast({
        title: "Validation Complete",
        description: `${workingCount} of ${allResults.length} URLs are working and ready for campaigns.`,
      });

    } catch (error) {
      console.error('Validation error:', error);
      setIsValidating(false);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate URLs",
        variant: "destructive"
      });
    }
  };

  const validateSingleUrl = async (result: any): Promise<ValidationResult> => {
    try {
      setCurrentUrl(result.url);
      
      // Use our validation function
      const response = await fetch('/.netlify/functions/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: result.url,
          checkForms: true,
          checkContact: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const validationData = await response.json();
      
      return {
        id: result.id,
        url: result.url,
        status: validationData.accessible && validationData.response_time < 10000 ? 'working' : 'broken',
        response_time: validationData.response_time || 0,
        http_status: validationData.http_status || 0,
        has_forms: validationData.has_forms || false,
        has_contact: validationData.has_contact || false
      };

    } catch (error) {
      return {
        id: result.id,
        url: result.url,
        status: 'invalid',
        response_time: 0,
        http_status: 0,
        has_forms: false,
        has_contact: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const updateValidationResults = async (results: ValidationResult[]) => {
    try {
      const response = await fetch('/.netlify/functions/update-url-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationResults: results
        }),
      });

      if (!response.ok) {
        console.error('Failed to update validation results in database');
      }
    } catch (error) {
      console.error('Error updating validation results:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'broken':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'broken':
      case 'invalid':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const workingUrls = validationResults.filter(r => r.status === 'working');
  const brokenUrls = validationResults.filter(r => r.status === 'broken' || r.status === 'invalid');

  return (
    <div className="space-y-6">
      {/* Validation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">URL Validation</h3>
          <p className="text-sm text-gray-600">
            Test discovered URLs to verify they're accessible and ready for campaigns
          </p>
        </div>
        <Button 
          onClick={validateUrls} 
          disabled={isValidating || results.length === 0}
          className="flex items-center gap-2"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Validate URLs ({results.length})
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isValidating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Validation Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentUrl && (
            <p className="text-xs text-gray-500 truncate">
              Current: {currentUrl}
            </p>
          )}
        </div>
      )}

      {/* Validation Summary */}
      {validationResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-800">Working URLs</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{workingUrls.length}</p>
            <p className="text-sm text-green-600">Ready for campaigns</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800">Broken URLs</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{brokenUrls.length}</p>
            <p className="text-sm text-red-600">Need attention</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-blue-800">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {validationResults.length > 0 ? Math.round((workingUrls.length / validationResults.length) * 100) : 0}%
            </p>
            <p className="text-sm text-blue-600">Validation success</p>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Validation Results</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.url}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>HTTP {result.http_status}</span>
                      <span>•</span>
                      <span>{result.response_time}ms</span>
                      {result.has_forms && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">Has Forms</Badge>
                        </>
                      )}
                      {result.has_contact && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">Has Contact</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isValidating && validationResults.length === 0 && results.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Click "Validate URLs" to test the discovered URLs and verify they're accessible for your campaigns.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UrlValidator;
