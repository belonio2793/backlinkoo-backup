import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { contentModerationService } from '@/services/contentModerationService';
import { contentFilterService } from '@/services/contentFilterService';
import {
  TestTube,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';

export function ContentTestingTool() {
  const { toast } = useToast();
  const [testContent, setTestContent] = useState('');
  const [basicFilterResult, setBasicFilterResult] = useState<any>(null);
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    if (!testContent.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter some content to test',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    try {
      // Run basic content filter test
      const filterResult = contentFilterService.testContent(testContent);
      
      // Run enhanced moderation test
      const harmfulTest = contentModerationService.testContentForHarmful(testContent);
      
      setBasicFilterResult(filterResult);
      setModerationResult(harmfulTest);

      toast({
        title: 'Tests Complete',
        description: 'Content analysis results are ready'
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to analyze content',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Content Testing Tool
        </h3>
        <p className="text-gray-600 text-sm">
          Test content against both basic filtering and enhanced moderation systems
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testContent">Content to Test</Label>
            <Textarea
              id="testContent"
              placeholder="Enter content to test against all filtering and moderation systems..."
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={6}
            />
          </div>
          
          <Button 
            onClick={runTests} 
            disabled={testing || !testContent.trim()}
            className="w-full"
          >
            {testing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(basicFilterResult || moderationResult) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Filter Results */}
          {basicFilterResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Basic Content Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  basicFilterResult.isAllowed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {basicFilterResult.isAllowed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {basicFilterResult.isAllowed ? 'Content Allowed' : 'Content Blocked'}
                    </span>
                    {!basicFilterResult.isAllowed && (
                      <Badge className={getSeverityColor(basicFilterResult.severity)}>
                        {basicFilterResult.severity.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {!basicFilterResult.isAllowed && (
                    <>
                      <p className="text-sm text-gray-700 mb-2">{basicFilterResult.reason}</p>
                      
                      {basicFilterResult.blockedTerms?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Blocked Terms:</p>
                          <div className="flex flex-wrap gap-1">
                            {basicFilterResult.blockedTerms.map((term: string, index: number) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {basicFilterResult.suggestions?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {basicFilterResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Moderation Results */}
          {moderationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Enhanced Moderation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  !moderationResult.isHarmful 
                    ? 'bg-green-50 border-green-200' 
                    : moderationResult.wouldAutoReject
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {!moderationResult.isHarmful ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : moderationResult.wouldAutoReject ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {!moderationResult.isHarmful 
                        ? 'Content Clean' 
                        : moderationResult.wouldAutoReject
                        ? 'Content Auto-Rejected'
                        : 'Content Flagged for Review'
                      }
                    </span>
                    {moderationResult.isHarmful && (
                      <Badge className={getSeverityColor(moderationResult.severity)}>
                        {moderationResult.severity.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {moderationResult.isHarmful && (
                    <>
                      {moderationResult.categories.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Harmful Categories:</p>
                          <div className="flex flex-wrap gap-1">
                            {moderationResult.categories.map((category: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-red-50 border-red-200">
                                {category.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {moderationResult.flaggedTerms.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Flagged Terms:</p>
                          <div className="flex flex-wrap gap-1">
                            {moderationResult.flaggedTerms.slice(0, 10).map((term: string, index: number) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {moderationResult.flaggedTerms.length > 10 && (
                              <Badge variant="outline" className="text-xs">
                                +{moderationResult.flaggedTerms.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-600">
                        <strong>Decision:</strong> {moderationResult.wouldAutoReject 
                          ? 'Content would be automatically rejected due to severe policy violations'
                          : 'Content would be queued for manual administrative review'
                        }
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Example Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Safe Content Examples:</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTestContent("Learn how to improve your SEO rankings with effective strategies and best practices")}
                  className="w-full text-left justify-start h-auto p-2"
                >
                  SEO Guide Content
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTestContent("Discover the best web development tools and technologies for modern applications")}
                  className="w-full text-left justify-start h-auto p-2"
                >
                  Tech Tutorial Content
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Harmful Content Examples:</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTestContent("How to hack into someone's computer and steal their data")}
                  className="w-full text-left justify-start h-auto p-2 text-red-600 border-red-200"
                >
                  Malicious Content
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTestContent("Online casino with guaranteed wins and easy money")}
                  className="w-full text-left justify-start h-auto p-2 text-orange-600 border-orange-200"
                >
                  Gambling Content
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
