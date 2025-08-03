import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface TestQuery {
  id: number;
  description: string;
  template: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  result?: any;
  error?: string;
}

export function OpenAIQueryTest() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<TestQuery[]>([
    {
      id: 1,
      description: 'Query Pattern 1',
      template: 'Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}',
      status: 'pending'
    },
    {
      id: 2, 
      description: 'Query Pattern 2',
      template: 'Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}',
      status: 'pending'
    },
    {
      id: 3,
      description: 'Query Pattern 3', 
      template: 'Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}',
      status: 'pending'
    }
  ]);

  const testQuery = async (queryIndex: number) => {
    const testData = {
      keyword: 'digital marketing',
      anchor_text: 'professional SEO services',
      url: 'https://example.com/seo-services'
    };

    // Update query status to testing
    setQueries(prev => prev.map((q, i) => 
      i === queryIndex ? { ...q, status: 'testing' as const } : q
    ));

    try {
      const query = queries[queryIndex];
      const processedTemplate = query.template
        .replace('{{keyword}}', testData.keyword)
        .replace('{{anchor_text}}', testData.anchor_text)
        .replace('{{url}}', testData.url);

      console.log(`🧪 Testing Query ${queryIndex + 1}:`, processedTemplate);

      // Make API call to Netlify function
      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: testData.keyword,
          url: testData.url,
          anchorText: testData.anchor_text,
          wordCount: 1000,
          contentType: 'how-to',
          tone: 'professional'
        })
      });

      const result = await response.json();

      if (result.success) {
        setQueries(prev => prev.map((q, i) => 
          i === queryIndex ? { 
            ...q, 
            status: 'success' as const, 
            result: {
              contentLength: result.content?.length || 0,
              tokensUsed: result.usage?.tokens || 0,
              cost: result.usage?.cost || 0,
              hasBacklink: result.content?.includes(testData.anchor_text) || false,
              preview: result.content?.substring(0, 200) + '...' || ''
            }
          } : q
        ));

        toast({
          title: `Query ${queryIndex + 1} Successful!`,
          description: `Generated ${result.content?.length || 0} characters of content`,
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ Query ${queryIndex + 1} failed:`, error);
      
      setQueries(prev => prev.map((q, i) => 
        i === queryIndex ? { 
          ...q, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Unknown error'
        } : q
      ));

      toast({
        title: `Query ${queryIndex + 1} Failed`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const testAllQueries = async () => {
    for (let i = 0; i < queries.length; i++) {
      await testQuery(i);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusBadge = (status: TestQuery['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'testing':
        return <Badge variant="outline" className="animate-pulse">Testing...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: TestQuery['status']) => {
    switch (status) {
      case 'pending':
        return <Play className="h-4 w-4 text-gray-400" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Play className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 OpenAI API Query Test Suite
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={testAllQueries} className="bg-blue-600 hover:bg-blue-700">
              Test All Queries
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queries.map((query, index) => (
          <Card key={query.id} className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{query.description}</CardTitle>
                {getStatusBadge(query.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-mono text-gray-700">
                  {query.template}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(query.status)}
                <Button
                  onClick={() => testQuery(index)}
                  disabled={query.status === 'testing'}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  {query.status === 'testing' ? 'Testing...' : 'Test Query'}
                </Button>
              </div>

              {query.status === 'success' && query.result && (
                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                  <div className="text-sm text-green-800">
                    <strong>✅ Success!</strong>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>Length: {query.result.contentLength} chars</div>
                    <div>Tokens: {query.result.tokensUsed}</div>
                    <div>Cost: ${query.result.cost?.toFixed(4)}</div>
                    <div>Backlink: {query.result.hasBacklink ? '✅' : '❌'}</div>
                  </div>
                  <div className="text-xs text-green-600 bg-white p-2 rounded border">
                    <strong>Preview:</strong><br />
                    {query.result.preview}
                  </div>
                </div>
              )}

              {query.status === 'error' && query.error && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>❌ Error:</strong>
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    {query.error}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Keyword:</strong><br />
              <code className="bg-gray-100 px-2 py-1 rounded">digital marketing</code>
            </div>
            <div>
              <strong>Anchor Text:</strong><br />
              <code className="bg-gray-100 px-2 py-1 rounded">professional SEO services</code>
            </div>
            <div>
              <strong>URL:</strong><br />
              <code className="bg-gray-100 px-2 py-1 rounded">https://example.com/seo-services</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
