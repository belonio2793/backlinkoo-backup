import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Eye, DollarSign, Globe, MapPin, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import googleLogo from "@/assets/google-g-logo.png";
import bingLogo from "@/assets/bing-logo.png";

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

interface RankingUrl {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  domainAuthority?: number;
  pageAuthority?: number;
  backlinks?: number;
  estimatedTraffic?: number;
  socialShares?: number;
}

interface GeographicData {
  country: string;
  countryCode: string;
  cities: { name: string; searchVolume: number }[];
}

export const KeywordResearchTool = () => {
  console.log('KeywordResearchTool: Component rendering started');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [rankingUrls, setRankingUrls] = useState<RankingUrl[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("google");
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [userLocation, setUserLocation] = useState<{country: string; city: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [aiInsights, setAiInsights] = useState<string>("");
  const [showInsights, setShowInsights] = useState(false);

  // Detect user location on component mount
  useEffect(() => {
    console.log('KeywordResearchTool: useEffect running for location detection');
    const detectLocation = async () => {
      try {
        console.log('KeywordResearchTool: Attempting to detect location');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        console.log('KeywordResearchTool: Location data received:', data);
        
        // Validate that the detected country exists in our countries list
        const detectedCountryCode = data.country_code || 'US';
        const countryExists = countries.find(c => c.code === detectedCountryCode);
        const finalCountryCode = countryExists ? detectedCountryCode : 'US';
        
        // Validate that the detected city exists in the selected country's cities list
        const detectedCity = data.city || '';
        const countryCities = cities[finalCountryCode as keyof typeof cities] || [];
        const cityExists = countryCities.includes(detectedCity);
        
        setUserLocation({
          country: data.country_name || 'United States',
          city: detectedCity
        });
        setSelectedCountry(finalCountryCode);
        
        // Only set the city if it exists in our predefined list for that country
        if (cityExists) {
          setSelectedCity(detectedCity);
        } else {
          setSelectedCity(''); // Default to "All Cities"
        }
      } catch (error) {
        console.log('KeywordResearchTool: Could not detect location, using defaults', error);
        // Set safe defaults on error
        setUserLocation({
          country: 'United States',
          city: ''
        });
        setSelectedCountry('US');
        setSelectedCity('');
      } finally {
        // Add a small delay to show the loading animation
        setTimeout(() => {
          setIsLoading(false);
          console.log('KeywordResearchTool: Loading complete');
        }, 1000);
      }
    };
    detectLocation();
  }, []);

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
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
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

  const searchEngines = [
    { 
      value: "google", 
      name: "Google", 
      logo: googleLogo,
      color: "text-blue-600"
    },
    { 
      value: "bing", 
      name: "Bing", 
      logo: bingLogo,
      color: "text-orange-600"
    }
  ];

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
      setRankingUrls(results.rankingUrls || []);
      setGeographicData(results.geographicData || []);
      setAiInsights(results.aiInsights);
      setShowInsights(true);

      toast({
        title: "Research Complete",
        description: `Found ${results.keywords.length} keywords and ${results.rankingUrls?.length || 0} ranking URLs`,
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

  console.log('KeywordResearchTool: About to render component', { isLoading });
  
  // Show loading animation while initializing
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin" style={{ animationDelay: '-0.15s' }}></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Loading Keyword Research Tool</h3>
          <p className="text-sm text-muted-foreground">Initializing advanced keyword analysis...</p>
        </div>
      </div>
    );
  }
  
  try {
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
              console.log('Country changed to:', value);
              setSelectedCountry(value);
              setSelectedCity(""); // Always reset city when country changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Country">
                  {selectedCountry && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{countries.find(c => c.code === selectedCountry)?.flag}</span>
                      <span>{countries.find(c => c.code === selectedCountry)?.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEngine} onValueChange={setSelectedEngine}>
              <SelectTrigger>
                <SelectValue placeholder="Search Engine">
                  {selectedEngine && (
                    <div className="flex items-center gap-2">
                      <img 
                        src={searchEngines.find(e => e.value === selectedEngine)?.logo} 
                        alt={searchEngines.find(e => e.value === selectedEngine)?.name}
                        className="w-4 h-4 object-contain"
                      />
                      <span className={searchEngines.find(e => e.value === selectedEngine)?.color}>
                        {searchEngines.find(e => e.value === selectedEngine)?.name}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {searchEngines.map((engine) => (
                  <SelectItem key={engine.value} value={engine.value}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={engine.logo} 
                        alt={engine.name}
                        className="w-4 h-4 object-contain"
                      />
                      <span className={engine.color}>{engine.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCountry && cities[selectedCountry as keyof typeof cities] && (
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="City (optional)">
                  {selectedCity && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedCity}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>All Cities</span>
                  </div>
                </SelectItem>
                {(cities[selectedCountry as keyof typeof cities] || []).map((city) => (
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            {userLocation && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>Detected: {userLocation.city ? `${userLocation.city}, ` : ''}{userLocation.country}</span>
              </div>
            )}
          </div>
          
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Keywords</TabsTrigger>
            <TabsTrigger value="rankings">Top 10 Rankings</TabsTrigger>
            <TabsTrigger value="competition">Competition</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keyword Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg">{keyword.keyword}</h3>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <img 
                                src={keyword.searchEngine === 'google' ? googleLogo : bingLogo} 
                                alt={keyword.searchEngine}
                                className="w-3 h-3 object-contain"
                              />
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

          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 10 Ranking URLs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingUrls.length > 0 ? (
                  <div className="space-y-4">
                    {rankingUrls.map((ranking, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {ranking.position}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg mb-1">{ranking.title}</h3>
                              <a 
                                href={ranking.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {ranking.domain}
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {ranking.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Domain Authority</span>
                            <span className="font-medium">{ranking.domainAuthority || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Page Authority</span>
                            <span className="font-medium">{ranking.pageAuthority || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Backlinks</span>
                            <span className="font-medium">{ranking.backlinks?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Est. Traffic</span>
                            <span className="font-medium">{ranking.estimatedTraffic?.toLocaleString() || 'N/A'}/mo</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Social Shares</span>
                            <span className="font-medium">{ranking.socialShares?.toLocaleString() || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ranking URLs will appear here after running a search</p>
                  </div>
                )}
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
  } catch (error) {
    console.error('KeywordResearchTool: Error rendering component:', error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Keyword Research Tool</h2>
        <p className="text-muted-foreground">Loading keyword research functionality...</p>
      </div>
    );
  }
};