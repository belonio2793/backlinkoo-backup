import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Search, Globe, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RankingResult {
  keyword: string;
  url: string;
  domain: string;
  searchEngines: {
    google: { position: number | null; found: boolean; lastChecked: string };
    bing: { position: number | null; found: boolean; lastChecked: string };
    yahoo: { position: number | null; found: boolean; lastChecked: string };
  };
  overallBest: number | null;
  averagePosition: number | null;
}

interface SearchEngineResult {
  engine: string;
  position: number | null;
  found: boolean;
  competitorAnalysis: any[];
}

export const RankingTracker = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [rankings, setRankings] = useState<RankingResult[]>([]);
  const [checkingProgress, setCheckingProgress] = useState<string[]>([]);
  const { toast } = useToast();

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Enhanced ranking check across multiple search engines
  const performMultiEngineRankingCheck = async (url: string, keyword: string) => {
    const searchEngines = ['google', 'bing', 'yahoo'];
    const results: { [key: string]: SearchEngineResult } = {};
    
    for (const engine of searchEngines) {
      setCheckingProgress(prev => [...prev, `Checking ${engine.toUpperCase()}...`]);
      
      try {
        const { data, error } = await supabase.functions.invoke('seo-analysis', {
          body: {
            type: 'ranking_check',
            data: { url, keyword, searchEngine: engine }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        results[engine] = {
          engine,
          position: data.position,
          found: data.found,
          competitorAnalysis: data.competitorAnalysis || []
        };

        // Add small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error checking ${engine}:`, error);
        results[engine] = {
          engine,
          position: null,
          found: false,
          competitorAnalysis: []
        };
      }
    }

    setCheckingProgress([]);
    return results;
  };

  const checkRanking = async () => {
    if (!url.trim() || !keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both URL and keyword",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
    } catch {
      toast({
        title: "Error", 
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setCheckingProgress([]);
    
    try {
      const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const domain = new URL(cleanUrl).hostname;
      
      setCheckingProgress(['Starting multi-engine ranking check...']);
      
      const results = await performMultiEngineRankingCheck(cleanUrl, keyword.trim());
      
      // Calculate overall metrics
      const positions = Object.values(results)
        .map(r => r.position)
        .filter(p => p !== null) as number[];
      
      const overallBest = positions.length > 0 ? Math.min(...positions) : null;
      const averagePosition = positions.length > 0 
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : null;

      const newResult: RankingResult = {
        keyword: keyword.trim(),
        url: cleanUrl,
        domain: domain,
        searchEngines: {
          google: {
            position: results.google?.position || null,
            found: results.google?.found || false,
            lastChecked: new Date().toLocaleString()
          },
          bing: {
            position: results.bing?.position || null,
            found: results.bing?.found || false,
            lastChecked: new Date().toLocaleString()
          },
          yahoo: {
            position: results.yahoo?.position || null,
            found: results.yahoo?.found || false,
            lastChecked: new Date().toLocaleString()
          }
        },
        overallBest,
        averagePosition
      };
      
      setRankings(prev => [newResult, ...prev.slice(0, 9)]);

      // Generate AI analysis based on multi-engine results
      const analysisData = Object.values(results)
        .filter(r => r.found)
        .map(r => `${r.engine}: position ${r.position}`)
        .join(', ');

      const analysisPrompt = `
        Website: ${domain}
        Keyword: "${keyword.trim()}"
        Results: ${analysisData || 'Not found in top 100 on any search engine'}
        
        Provide comprehensive ranking analysis and improvement recommendations.
      `;

      try {
        const { data: aiData } = await supabase.functions.invoke('seo-analysis', {
          body: {
            type: 'ranking_analysis',
            data: { prompt: analysisPrompt, results }
          }
        });
        
        setAiAnalysis(aiData?.aiAnalysis || 'Analysis not available');
        setShowAnalysis(true);
      } catch (error) {
        console.error('AI analysis failed:', error);
      }

      const foundEngines = Object.entries(results)
        .filter(([_, result]) => result.found)
        .map(([engine, result]) => `${engine} (#${result.position})`)
        .join(', ');

      toast({
        title: "Ranking Check Complete",
        description: foundEngines 
          ? `Found on: ${foundEngines}`
          : "Not found in top 100 on any search engine",
      });

    } catch (error) {
      console.error('Ranking check failed:', error);
      toast({
        title: "Error",
        description: "Failed to check ranking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
      setCheckingProgress([]);
    }
  };

  const getPositionColor = (position: number | null) => {
    if (!position) return "text-gray-500 bg-gray-50";
    if (position <= 3) return "text-green-600 bg-green-50";
    if (position <= 10) return "text-blue-600 bg-blue-50";
    if (position <= 30) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'google': return '🔍';
      case 'bing': return '🌐';
      case 'yahoo': return '🟣';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Search Engine Ranking Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com or example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                placeholder="Enter keyword to track"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={checkRanking} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? "Checking..." : "Check All Engines"}
              </Button>
            </div>
          </div>
          
          {isChecking && checkingProgress.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="font-medium">Progress:</span>
              </div>
              <div className="mt-2 space-y-1">
                {checkingProgress.map((progress, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    {progress}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mt-4">
            Track your website's position across Google, Bing, and Yahoo search engines for comprehensive SERP analysis
          </p>
        </CardContent>
      </Card>

      {showAnalysis && aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 AI Ranking Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {aiAnalysis}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Multi-Engine Ranking Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {rankings.map((result, index) => (
                <div key={index} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{result.keyword}</h3>
                      <p className="text-sm text-muted-foreground">{result.domain}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {result.overallBest && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Best Position</p>
                          <Badge className={getPositionColor(result.overallBest)}>
                            #{result.overallBest}
                          </Badge>
                        </div>
                      )}
                      {result.averagePosition && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Average</p>
                          <Badge variant="outline">
                            #{result.averagePosition}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(result.searchEngines).map(([engine, data]) => (
                      <div key={engine} className="border rounded-lg p-4 bg-background">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getEngineIcon(engine)}</span>
                            <span className="font-medium capitalize">{engine}</span>
                          </div>
                          {data.found ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Position:</span>
                            {data.position ? (
                              <Badge className={getPositionColor(data.position)}>
                                #{data.position}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Found</Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Last checked: {data.lastChecked}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};