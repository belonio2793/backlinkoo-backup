import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare, Search, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormResult {
  url: string;
  domain: string;
  title: string;
  snippet: string;
  confidence: number;
  status: string;
}

const FormDiscoveryWidget = () => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(25);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FormResult[]>([]);
  const { toast } = useToast();

  const searchForForms = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query to find comment forms.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await fetch('/.netlify/functions/form-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          maxResults,
          targetDomains: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search for forms');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data.results || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.results?.length || 0} potential comment forms`,
      });

    } catch (error) {
      console.error('Form discovery error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search for forms",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comment Form Discovery
        </CardTitle>
        <CardDescription>
          Find pages with comment forms for your niche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="form-query">Search Query</Label>
            <Input
              id="form-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., technology blog comments, marketing forums"
              className="mt-1"
              onKeyPress={(e) => e.key === 'Enter' && searchForForms()}
            />
          </div>
          <div className="w-24">
            <Label htmlFor="max-results">Max Results</Label>
            <Input
              id="max-results"
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 25)}
              min="5"
              max="100"
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={searchForForms} 
          disabled={isSearching || !query.trim()}
          className="w-full"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Find Comment Forms
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Search Results</h3>
              <Badge variant="outline">{results.length} found</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.url}-${index}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-blue-600 hover:text-blue-800">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">{result.domain}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(result.confidence)}`}
                      >
                        {result.confidence}% confidence
                      </Badge>
                      {result.confidence >= 70 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                    {result.snippet}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {result.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !isSearching && (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Enter a search query and click "Find Comment Forms" to discover pages with comment sections in your niche.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FormDiscoveryWidget;
