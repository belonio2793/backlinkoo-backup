import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Zap,
  AlertCircle,
  Loader2,
  Play
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const AutomationDiscovery = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);

  const startDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryResults([]);

    try {
      const response = await fetch('/.netlify/functions/discovery-engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: `automation_discovery_${Date.now()}`,
          maxResults: 500,
          discoveryDepth: 'deep'
        }),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Unknown error';
        }
        console.error('Discovery API Error:', response.status, errorText);
        throw new Error(`Discovery failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const sessionId = data.sessionId;

      console.log('Discovery session started:', sessionId);

      // Simple polling for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/.netlify/functions/discovery-engine?sessionId=${sessionId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.session) {
              if (statusData.session.status === 'completed') {
                setIsDiscovering(false);
                clearInterval(pollInterval);
                console.log('Discovery complete:', statusData.results?.length || 0, 'URLs found');
              } else if (statusData.session.status === 'error') {
                setIsDiscovering(false);
                clearInterval(pollInterval);
                console.error('Discovery error');
              }
            }
            
            if (statusData.results && statusData.results.length > discoveryResults.length) {
              setDiscoveryResults(statusData.results);
            }
          }
        } catch (error) {
          console.error('Error polling discovery status:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Store interval reference for cleanup
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          setIsDiscovering(false);
        }
      }, 60000); // Stop after 60 seconds

    } catch (error) {
      setIsDiscovering(false);
      console.error('Discovery failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Automation-Compatible URL Discovery
          </h1>
          <p className="text-lg text-gray-600">
            Find working URLs compatible with your automation platform for maximum link publishing success
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Discovery Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Discovery
              </CardTitle>
              <CardDescription>
                Discover URLs that are compatible with your automation platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">🚀 Automation Focus</h4>
                <p className="text-sm text-blue-700">
                  This discovery engine finds URLs that are specifically compatible with your automation platform, 
                  focusing on technical requirements rather than topics. No search query needed!
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium">Platform Types Discovered:</h5>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: '🔌 API Platforms (Telegraph, Medium, Dev.to)', desc: 'Instant publishing via APIs' },
                    { name: '📝 Form Submission Sites', desc: 'Automated form completion' },
                    { name: '📁 Directory Submissions', desc: 'Business/URL directories' },
                    { name: '💬 Comment Forms', desc: 'Blog comment opportunities' },
                    { name: '👤 Profile Creation', desc: 'Social/professional profiles' }
                  ].map((platform, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div className="font-medium text-green-800">{platform.name}</div>
                      <div className="text-xs text-green-600">{platform.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {!isDiscovering ? (
                  <Button onClick={startDiscovery} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Start Discovery (500 URLs)
                  </Button>
                ) : (
                  <Button disabled className="flex-1">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Discovering...
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discovery Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Discovery Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDiscovering ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Discovering automation-compatible URLs...</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Found {discoveryResults.length} URLs so far
                  </div>
                </div>
              ) : discoveryResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-green-600 font-medium">
                    ✅ Discovery Complete
                  </div>
                  <div className="text-sm text-gray-600">
                    Found {discoveryResults.length} automation-compatible URLs
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active discovery session</p>
                  <p className="text-sm">Click "Start Discovery" to find automation-compatible URLs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {discoveryResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Discovered URLs ({discoveryResults.length})</CardTitle>
              <CardDescription>
                URLs compatible with your automation platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {discoveryResults.slice(0, 20).map((result, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600">{result.title || result.url}</h4>
                        <p className="text-sm text-gray-600 mt-1">{result.domain}</p>
                        <p className="text-xs text-gray-500 mt-1">{result.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          {result.opportunity_score || 75}%
                        </span>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {discoveryResults.length > 20 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing first 20 results. Total: {discoveryResults.length} URLs found.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🔍</span>
                </div>
                <h4 className="font-medium mb-1">Discover</h4>
                <p className="text-sm text-gray-600">Find URLs compatible with automation platforms</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">✅</span>
                </div>
                <h4 className="font-medium mb-1">Test</h4>
                <p className="text-sm text-gray-600">Validate compatibility and publishing potential</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🚀</span>
                </div>
                <h4 className="font-medium mb-1">Automate</h4>
                <p className="text-sm text-gray-600">Use working URLs in your automation campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AutomationDiscovery;
