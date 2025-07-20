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
  ExternalLink 
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

  // Mock domain analysis
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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockMetrics: DomainMetrics = {
      domain: domainUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      domainAuthority: Math.floor(Math.random() * 100) + 1,
      pageAuthority: Math.floor(Math.random() * 100) + 1,
      backlinks: Math.floor(Math.random() * 100000) + 1000,
      referringDomains: Math.floor(Math.random() * 10000) + 100,
      organicKeywords: Math.floor(Math.random() * 50000) + 500,
      monthlyTraffic: Math.floor(Math.random() * 1000000) + 10000
    };
    
    setDomainMetrics(mockMetrics);
    setIsAnalyzing(false);
    
    toast({
      title: "Analysis Complete",
      description: `Domain metrics retrieved for ${mockMetrics.domain}`,
    });
  };

  // Mock index checking
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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const statuses: ('indexed' | 'not-indexed' | 'error' | 'pending')[] = ['indexed', 'not-indexed', 'pending'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const newResult: IndexStatus = {
      url: indexUrl.trim(),
      isIndexed: randomStatus === 'indexed',
      lastCrawled: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: randomStatus
    };
    
    setIndexResults(prev => [newResult, ...prev.slice(0, 9)]);
    setIsCheckingIndex(false);
    
    toast({
      title: "Index Check Complete",
      description: `URL is ${randomStatus === 'indexed' ? 'indexed' : 'not indexed'} by Google`,
    });
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
    <div className="space-y-6">
      <Tabs defaultValue="domain-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="domain-analysis">Domain Analysis</TabsTrigger>
          <TabsTrigger value="index-checker">Index Checker</TabsTrigger>
        </TabsList>

        <TabsContent value="domain-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Authority Checker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="https://example.com"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={analyzeDomain} 
                  disabled={isAnalyzing}
                  className="min-w-[120px]"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Get comprehensive domain metrics including authority scores and backlink data
              </p>
            </CardContent>
          </Card>

          {domainMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Domain Metrics</span>
                  <Badge variant="outline">{domainMetrics.domain}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      <Badge className={getAuthorityColor(domainMetrics.domainAuthority)}>
                        {domainMetrics.domainAuthority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Domain Authority</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      <Badge className={getAuthorityColor(domainMetrics.pageAuthority)}>
                        {domainMetrics.pageAuthority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Page Authority</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">{domainMetrics.backlinks.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Backlinks</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">{domainMetrics.referringDomains.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Referring Domains</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">{domainMetrics.organicKeywords.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Organic Keywords</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">{domainMetrics.monthlyTraffic.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Monthly Traffic</p>
                  </div>
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