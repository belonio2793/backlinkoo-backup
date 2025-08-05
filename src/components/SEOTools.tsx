import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Search, 
  Link2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DomainMetrics {
  domain: string;
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  referringDomains: number;
  organicKeywords: number;
  monthlyTraffic: number;
}

interface IndexStatus {
  url: string;
  isIndexed: boolean;
  lastCrawled: string;
  status: 'indexed' | 'not-indexed' | 'error' | 'pending';
}

export const SEOTools = () => {
  const [domainUrl, setDomainUrl] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingIndex, setIsCheckingIndex] = useState(false);
  const [domainMetrics, setDomainMetrics] = useState<DomainMetrics | null>(null);
  const [indexResults, setIndexResults] = useState<IndexStatus[]>([]);
  const { toast } = useToast();

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [showDomainAnalysis, setShowDomainAnalysis] = useState(false);

  // Real domain analysis with AI insights
  const performDomainAnalysis = async (domain: string) => {
    const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/functions/v1/seo-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'domain_analysis',
        data: { domain }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze domain');
    }

    return await response.json();
  };

  const analyzeDomain = async () => {
    if (!domainUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const results = await performDomainAnalysis(domainUrl.trim());
      setDomainMetrics(results.metrics);
      setAiAnalysis(results.aiAnalysis);
      setShowDomainAnalysis(true);
      
      toast({
        title: "Analysis Complete",
        description: `Domain analysis completed for ${results.metrics.domain}`,
      });
    } catch (error) {
      console.error('Domain analysis failed:', error);
      toast({
        title: "Error",
        description: "Failed to analyze domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [indexAnalysis, setIndexAnalysis] = useState<string>("");
  const [showIndexAnalysis, setShowIndexAnalysis] = useState(false);

  // Real index checking with AI recommendations
  const performIndexCheck = async (url: string) => {
    const response = await fetch('https://dfhanacsmsvvkpunurnp.functions.supabase.co/functions/v1/seo-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'index_check',
        data: { url }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check index status');
    }

    return await response.json();
  };

  const checkIndexStatus = async () => {
    if (!indexUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to check",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingIndex(true);
    
    try {
      const results = await performIndexCheck(indexUrl.trim());
      
      const newResult: IndexStatus = {
        url: indexUrl.trim(),
        isIndexed: results.google.indexed,
        lastCrawled: new Date(results.lastChecked).toLocaleDateString(),
        status: results.google.indexed ? 'indexed' : 'not-indexed'
      };
      
      setIndexResults(prev => [newResult, ...prev.slice(0, 9)]);
      setIndexAnalysis(results.aiRecommendations);
      setShowIndexAnalysis(true);
      
      toast({
        title: "Index Check Complete",
        description: `Google: ${results.google.indexed ? 'Indexed' : 'Not Indexed'}`,
      });
    } catch (error) {
      console.error('Index check failed:', error);
      toast({
        title: "Error",
        description: "Failed to check index status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIndex(false);
    }
  };

  const getAuthorityColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getIndexStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not-indexed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Professional SEO Tools</h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Comprehensive domain analysis and indexing verification tools
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Domain Authority Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Index Status Monitoring</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">{domainMetrics ? '1' : '0'}</div>
                <div className="text-xs text-muted-foreground">Domains Analyzed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">{indexResults.length}</div>
                <div className="text-xs text-muted-foreground">Pages Checked</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="domain-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="domain-analysis" className="text-sm font-medium">Domain Analysis</TabsTrigger>
          <TabsTrigger value="index-checker" className="text-sm font-medium">Index Checker</TabsTrigger>
        </TabsList>

        <TabsContent value="domain-analysis" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/20">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                Domain Authority Analyzer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="https://example.com"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  className="flex-1 h-11 border-2 focus:border-primary transition-colors"
                />
                <Button 
                  onClick={analyzeDomain} 
                  disabled={isAnalyzing}
                  className="min-w-[160px] h-11 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze Domain
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔍 Get comprehensive domain metrics including authority scores, backlink profiles, and traffic estimates
                </p>
              </div>
            </CardContent>
          </Card>

          {showDomainAnalysis && aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 AI Domain Analysis
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

          {domainMetrics && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Domain Performance Metrics</CardTitle>
                  <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                    <Globe className="h-3 w-3 mr-1" />
                    {domainMetrics.domain}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <Badge className={`text-lg px-4 py-2 ${getAuthorityColor(domainMetrics.domainAuthority)}`}>
                          {domainMetrics.domainAuthority}/100
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-2">Domain Authority</h4>
                      <p className="text-xs text-muted-foreground">
                        Overall domain strength score
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <Badge className={`text-lg px-4 py-2 ${getAuthorityColor(domainMetrics.pageAuthority)}`}>
                          {domainMetrics.pageAuthority}/100
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-2">Page Authority</h4>
                      <p className="text-xs text-muted-foreground">
                        Individual page ranking power
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {domainMetrics.backlinks.toLocaleString()}
                      </div>
                      <h4 className="font-semibold mb-2">Total Backlinks</h4>
                      <p className="text-xs text-muted-foreground">
                        Inbound links pointing to domain
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {domainMetrics.referringDomains.toLocaleString()}
                      </div>
                      <h4 className="font-semibold mb-2">Referring Domains</h4>
                      <p className="text-xs text-muted-foreground">
                        Unique domains linking to site
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {domainMetrics.organicKeywords.toLocaleString()}
                      </div>
                      <h4 className="font-semibold mb-2">Organic Keywords</h4>
                      <p className="text-xs text-muted-foreground">
                        Keywords ranking organically
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {domainMetrics.monthlyTraffic.toLocaleString()}
                      </div>
                      <h4 className="font-semibold mb-2">Monthly Traffic</h4>
                      <p className="text-xs text-muted-foreground">
                        Estimated monthly visitors
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="index-checker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Google Index Checker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="https://example.com/page"
                  value={indexUrl}
                  onChange={(e) => setIndexUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={checkIndexStatus} 
                  disabled={isCheckingIndex}
                  className="min-w-[120px]"
                >
                  {isCheckingIndex ? "Checking..." : "Check Index"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Verify if your pages are indexed by Google search engine
              </p>
            </CardContent>
          </Card>

          {showIndexAnalysis && indexAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 AI Index Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                    {indexAnalysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {indexResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Index Status Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indexResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getIndexStatusIcon(result.status)}
                          <div className="flex-1">
                            <p className="font-medium truncate">{result.url}</p>
                            <p className="text-sm text-muted-foreground">
                              Last crawled: {result.lastCrawled}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={
                              result.status === 'indexed' ? 'text-green-600 border-green-600' :
                              result.status === 'not-indexed' ? 'text-red-600 border-red-600' :
                              'text-yellow-600 border-yellow-600'
                            }
                          >
                            {result.status.replace('-', ' ')}
                          </Badge>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
