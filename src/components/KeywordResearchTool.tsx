import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Eye, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
}

export const KeywordResearchTool = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const { toast } = useToast();

  // Mock data generator for demonstration
  const generateMockKeywords = (baseTerm: string): KeywordData[] => {
    const variations = [
      baseTerm,
      `${baseTerm} tools`,
      `${baseTerm} software`,
      `best ${baseTerm}`,
      `${baseTerm} guide`,
      `${baseTerm} tips`,
      `free ${baseTerm}`,
      `${baseTerm} strategy`,
      `${baseTerm} services`,
      `${baseTerm} agency`
    ];

    return variations.map(keyword => ({
      keyword,
      searchVolume: Math.floor(Math.random() * 10000) + 100,
      difficulty: Math.floor(Math.random() * 100) + 1,
      cpc: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    }));
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = generateMockKeywords(searchTerm.trim());
    setKeywords(mockResults);
    setIsSearching(false);

    toast({
      title: "Search Complete",
      description: `Found ${mockResults.length} keyword variations`,
    });
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "bg-green-100 text-green-800";
    if (difficulty <= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return "Easy";
    if (difficulty <= 60) return "Medium";
    return "Hard";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Research Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter a keyword (e.g., SEO, marketing, web design)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="min-w-[120px]"
            >
              {isSearching ? "Searching..." : "Research"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Discover high-volume, low-competition keywords for your SEO strategy
          </p>
        </CardContent>
      </Card>

      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keywords.map((keyword, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp 
                        className={`h-4 w-4 ${
                          keyword.trend === 'up' ? 'text-green-500' : 
                          keyword.trend === 'down' ? 'text-red-500' : 
                          'text-gray-500'
                        }`} 
                      />
                      <Badge className={getDifficultyColor(keyword.difficulty)}>
                        {getDifficultyLabel(keyword.difficulty)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Search Volume:</span>
                      <span className="font-medium">{keyword.searchVolume.toLocaleString()}/month</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="font-medium">{keyword.difficulty}/100</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">CPC:</span>
                      <span className="font-medium">${keyword.cpc}</span>
                    </div>
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