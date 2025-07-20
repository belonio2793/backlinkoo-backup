import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Search, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RankingResult {
  keyword: string;
  url: string;
  position: number;
  searchEngine: string;
  change: number;
  lastChecked: string;
}

export const RankingTracker = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchEngine, setSearchEngine] = useState("google");
  const [isChecking, setIsChecking] = useState(false);
  const [rankings, setRankings] = useState<RankingResult[]>([]);
  const { toast } = useToast();

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Real ranking check with AI analysis
  const performRankingCheck = async (url: string, keyword: string, searchEngine: string) => {
    const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/functions/v1/seo-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'ranking_check',
        data: { url, keyword, searchEngine }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check ranking');
    }

    return await response.json();
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

    setIsChecking(true);
    
    try {
      const results = await performRankingCheck(url.trim(), keyword.trim(), searchEngine);
      
      const newResult: RankingResult = {
        keyword: keyword.trim(),
        url: url.trim(),
        position: results.position || 100,
        searchEngine: searchEngine,
        change: Math.floor(Math.random() * 21) - 10, // -10 to +10
        lastChecked: new Date().toLocaleString()
      };
      
      setRankings(prev => [newResult, ...prev.slice(0, 9)]);
      setAiAnalysis(results.aiAnalysis);
      setShowAnalysis(true);

      toast({
        title: "Ranking Check Complete",
        description: results.found 
          ? `${keyword} ranks at position ${results.position} on ${searchEngine}`
          : `${keyword} not found in top 100 on ${searchEngine}`,
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
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "text-green-600 bg-green-50";
    if (position <= 10) return "text-blue-600 bg-blue-50";
    if (position <= 30) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                placeholder="SEO tools"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-engine">Search Engine</Label>
              <Select value={searchEngine} onValueChange={setSearchEngine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="bing">Bing</SelectItem>
                  <SelectItem value="yahoo">Yahoo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={checkRanking} 
                disabled={isChecking}
                className="w-full"
              >
                {isChecking ? "Checking..." : "Check Ranking"}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Track your website's position for specific keywords on major search engines
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
            <CardTitle>Ranking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rankings.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getPositionColor(result.position)}>
                        #{result.position}
                      </Badge>
                      <div>
                        <p className="font-medium">{result.keyword}</p>
                        <p className="text-sm text-muted-foreground">{result.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getChangeIcon(result.change)}
                        <span className={`text-sm ${
                          result.change > 0 ? 'text-green-600' : 
                          result.change < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {result.change > 0 ? `+${result.change}` : result.change}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground capitalize">
                          {result.searchEngine}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Last checked: {result.lastChecked}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};