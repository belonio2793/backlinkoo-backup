import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Play, TestTube, Zap, Code } from 'lucide-react';

interface TestQuery {
  id: number;
  description: string;
  template: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  result?: any;
  error?: string;
}

export default function OpenAITest() {
  const { toast } = useToast();
  const [queries, setQueries] = useState<TestQuery[]>([
    {
      id: 1,
      description: 'Query Pattern 1 - Include hyperlinked',
      template: 'Generate a 1000 word blog post on {{keyword}} including the {{anchor_text}} hyperlinked to {{url}}',
      status: 'pending'
    },
    {
      id: 2, 
      description: 'Query Pattern 2 - With hyperlinked linked',
      template: 'Write a 1000 word blog post about {{keyword}} with a hyperlinked {{anchor_text}} linked to {{url}}',
      status: 'pending'
    },
    {
      id: 3,
      description: 'Query Pattern 3 - That links',
      template: 'Produce a 1000-word blog post on {{keyword}} that links {{anchor_text}}',
      status: 'pending'
    }
  ]);

  const testData = {
    keyword: 'digital marketing strategies',
    anchor_text: 'professional SEO services',
    url: 'https://example.com/seo-services'
  };

  const testQuery = async (queryIndex: number) => {
    // Check if this query is already being tested
    const currentQuery = queries[queryIndex];
    if (currentQuery.status === 'testing') {
      console.log(`Query ${queryIndex + 1} is already being tested, skipping...`);
      return;
    }

    // Update query status to testing
    setQueries(prev => prev.map((q, i) =>
      i === queryIndex ? { ...q, status: 'testing' as const, result: undefined, error: undefined } : q
    ));

    // Small delay to ensure state update and avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const query = queries[queryIndex];
      const processedTemplate = query.template
        .replace('{{keyword}}', testData.keyword)
        .replace('{{anchor_text}}', testData.anchor_text)
        .replace('{{url}}', testData.url);

      console.log(`🧪 Testing Query ${queryIndex + 1}:`, processedTemplate);
      console.log(`📡 Making API request for query ${queryIndex + 1}...`);

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

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text(); // Use text() to avoid json parsing issues
          errorMessage += ` - ${errorData}`;
        } catch (textError) {
          // If we can't read the response, use the basic error
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        const hasBacklink = result.content?.includes(testData.anchor_text) && 
                           result.content?.includes(testData.url);
        
        setQueries(prev => prev.map((q, i) => 
          i === queryIndex ? { 
            ...q, 
            status: 'success' as const, 
            result: {
              contentLength: result.content?.length || 0,
              tokensUsed: result.usage?.tokens || 0,
              cost: result.usage?.cost || 0,
              hasBacklink,
              hasAnchorText: result.content?.includes(testData.anchor_text) || false,
              hasUrl: result.content?.includes(testData.url) || false,
              preview: result.content?.substring(0, 300) + '...' || '',
              wordCount: result.content?.split(' ').length || 0
            }
          } : q
        ));

        toast({
          title: `✅ Query ${queryIndex + 1} Successful!`,
          description: `Generated ${result.content?.length || 0} characters (${result.content?.split(' ').length || 0} words)`,
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ Query ${queryIndex + 1} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setQueries(prev => prev.map((q, i) =>
        i === queryIndex ? {
          ...q,
          status: 'error' as const,
          error: errorMessage,
          result: undefined
        } : q
      ));

      toast({
        title: `❌ Query ${queryIndex + 1} Failed`,
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const testAllQueries = async () => {
    toast({
      title: "🚀 Testing All Queries",
      description: "Running comprehensive API tests...",
    });

    // Reset all queries to pending state before starting
    setQueries(prev => prev.map(q => ({ ...q, status: 'pending', result: undefined, error: undefined })));

    for (let i = 0; i < queries.length; i++) {
      try {
        await testQuery(i);
      } catch (error) {
        console.error(`Failed to test query ${i + 1}:`, error);
      }

      // Add delay between tests to avoid rate limiting
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    toast({
      title: "🏁 All Tests Complete",
      description: "Check results below for detailed analysis",
    });
  };

  const getStatusBadge = (status: TestQuery['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Play className="h-3 w-3" />Pending</Badge>;
      case 'testing':
        return <Badge variant="outline" className="animate-pulse gap-1"><Loader2 className="h-3 w-3 animate-spin" />Testing...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSuccessRate = () => {
    const total = queries.length;
    const successful = queries.filter(q => q.status === 'success').length;
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <TestTube className="h-8 w-8" />
                OpenAI API Query Test Suite
                <Zap className="h-8 w-8" />
              </CardTitle>
              <p className="text-blue-100 text-lg mt-2">
                Testing the three specific query patterns for blog post generation with backlinks
              </p>
            </CardHeader>
          </Card>

          {/* Controls and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Test Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testAllQueries} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <TestTube className="h-5 w-5 mr-2" />
                  Run All API Tests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <Badge variant={getSuccessRate() === 100 ? "default" : "secondary"} className="bg-green-500">
                      {getSuccessRate()}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>{queries.filter(q => q.status === 'success' || q.status === 'error').length} / {queries.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Queries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {queries.map((query, index) => (
              <Card key={query.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{query.description}</CardTitle>
                    {getStatusBadge(query.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Query Template */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Query Template:</h4>
                    <p className="text-sm font-mono text-gray-800 leading-relaxed">
                      {query.template}
                    </p>
                  </div>

                  {/* Test Button */}
                  <Button
                    onClick={() => testQuery(index)}
                    disabled={query.status === 'testing'}
                    variant="outline"
                    className="w-full"
                  >
                    {query.status === 'testing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test This Query
                      </>
                    )}
                  </Button>

                  {/* Success Results */}
                  {query.status === 'success' && query.result && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-3">
                      <div className="text-sm text-green-800 font-semibold">
                        ✅ API Test Successful!
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                        <div>Length: <strong>{query.result.contentLength}</strong> chars</div>
                        <div>Words: <strong>{query.result.wordCount}</strong></div>
                        <div>Tokens: <strong>{query.result.tokensUsed}</strong></div>
                        <div>Cost: <strong>${query.result.cost?.toFixed(4)}</strong></div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span>Backlink Integration:</span>
                          <Badge variant={query.result.hasBacklink ? "default" : "destructive"} className="text-xs">
                            {query.result.hasBacklink ? '✅ Complete' : '❌ Missing'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span>Anchor Text:</span>
                            {query.result.hasAnchorText ? '✅' : '❌'}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Target URL:</span>
                            {query.result.hasUrl ? '✅' : '❌'}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-green-600 bg-white p-3 rounded border">
                        <strong>Content Preview:</strong><br />
                        <span className="text-gray-700">{query.result.preview}</span>
                      </div>
                    </div>
                  )}

                  {/* Error Results */}
                  {query.status === 'error' && query.error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="text-sm text-red-800 font-semibold mb-2">
                        ❌ Test Failed
                      </div>
                      <div className="text-xs text-red-700 bg-white p-2 rounded border">
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
              <CardTitle>Test Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <strong className="text-sm text-gray-700">Target Keyword:</strong>
                  <div className="bg-blue-50 p-3 rounded-lg border">
                    <code className="text-blue-800 font-mono">{testData.keyword}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <strong className="text-sm text-gray-700">Anchor Text:</strong>
                  <div className="bg-purple-50 p-3 rounded-lg border">
                    <code className="text-purple-800 font-mono">{testData.anchor_text}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <strong className="text-sm text-gray-700">Target URL:</strong>
                  <div className="bg-green-50 p-3 rounded-lg border">
                    <code className="text-green-800 font-mono">{testData.url}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
}
