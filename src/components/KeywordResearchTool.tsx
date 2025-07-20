import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Eye, DollarSign, Globe, MapPin, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  competition: 'low' | 'medium' | 'high';
  searchEngine: 'google' | 'bing';
  location?: string;
  competitorCount?: number;
  topCompetitors?: string[];
}

interface GeographicData {
  country: string;
  countryCode: string;
  cities: { name: string; searchVolume: number }[];
}

export const KeywordResearchTool = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("google");
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const { toast } = useToast();

  const [aiInsights, setAiInsights] = useState<string>("");
  const [showInsights, setShowInsights] = useState(false);

  // Advanced keyword research with geographic and competition analysis
  const performKeywordResearch = async (searchTerm: string) => {
    const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/functions/v1/seo-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'advanced_keyword_research',
        data: { 
          keyword: searchTerm,
          country: selectedCountry,
          city: selectedCity,
          searchEngine: selectedEngine
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to perform keyword research');
    }

    return await response.json();
  };

  const countries = [
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "BR", name: "Brazil" },
  ];

  const cities = {
    US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    UK: ["London", "Birmingham", "Glasgow", "Liverpool", "Bristol"],
    CA: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    DE: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
    FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
    ES: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza"],
    IT: ["Rome", "Milan", "Naples", "Turin", "Palermo"],
    JP: ["Tokyo", "Osaka", "Nagoya", "Sapporo", "Fukuoka"],
    BR: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
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
    
    try {
      const results = await performKeywordResearch(searchTerm.trim());
      setKeywords(results.keywords);
      setGeographicData(results.geographicData || []);
      setAiInsights(results.aiInsights);
      setShowInsights(true);

      toast({
        title: "Research Complete",
        description: `Found ${results.keywords.length} keywords with competition analysis`,
      });
    } catch (error) {
      console.error('Keyword research failed:', error);
      toast({
        title: "Error",
        description: "Failed to perform keyword research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
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
            Advanced Keyword Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Enter a keyword (e.g., ∞)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
            </div>
            
            <Select value={selectedCountry} onValueChange={(value) => {
              setSelectedCountry(value);
              setSelectedCity("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {country.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEngine} onValueChange={setSelectedEngine}>
              <SelectTrigger>
                <SelectValue placeholder="Search Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Google
                  </div>
                </SelectItem>
                <SelectItem value="bing">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Bing
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCountry && cities[selectedCountry as keyof typeof cities] && (
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="City (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities[selectedCountry as keyof typeof cities].map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="w-full md:w-auto"
          >
            {isSearching ? "Analyzing..." : "Research Keywords"}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Get comprehensive keyword data with competition analysis from top search engines
          </p>
        </CardContent>
      </Card>

      {showInsights && aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI SEO Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {aiInsights}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {keywords.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Keyword Overview</TabsTrigger>
            <TabsTrigger value="competition">Competition Analysis</TabsTrigger>
            <TabsTrigger value="geographic">Geographic Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keyword Research Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                          <Badge variant="outline" className="text-xs">
                            {keyword.searchEngine.toUpperCase()}
                          </Badge>
                          {keyword.location && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {keyword.location}
                            </Badge>
                          )}
                        </div>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-medium">{keyword.searchVolume.toLocaleString()}/mo</span>
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

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Competition:</span>
                          <span className="font-medium capitalize">{keyword.competition}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competition">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competition Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                        <Badge className={getDifficultyColor(keyword.difficulty)}>
                          {keyword.competitorCount || 10} Competitors
                        </Badge>
                      </div>
                      
                      {keyword.topCompetitors && keyword.topCompetitors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-sm text-muted-foreground">Top Ranking Competitors:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {keyword.topCompetitors.map((competitor, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="bg-muted rounded px-2 py-1 text-xs font-mono">#{idx + 1}</span>
                                <span className="text-blue-600 hover:underline cursor-pointer">{competitor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geographic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geographicData.length > 0 ? (
                  <div className="space-y-6">
                    {geographicData.map((country, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {country.country}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {country.cities.map((city, cityIndex) => (
                            <div key={cityIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{city.name}</span>
                              <span className="font-medium text-sm">{city.searchVolume.toLocaleString()}/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Geographic data will appear here after running a search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};