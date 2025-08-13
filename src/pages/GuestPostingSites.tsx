import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  TrendingUp, 
  Code, 
  Megaphone, 
  Globe, 
  Search, 
  Download, 
  ExternalLink,
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GuestPostingSitesList } from '@/components/GuestPostingSitesList';
import { guestPostingAnalyzer, type AnalysisResult } from '@/services/guestPostingAnalyzer';
import { toast } from 'sonner';

export default function GuestPostingSites() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Generate comprehensive analysis
    const result = guestPostingAnalyzer.generateRecommendations({
      quickPosting: true,
      seoFocus: true,
      techContent: true,
      marketingContent: true,
      noAccount: true,
      highAuthority: true
    });
    
    setAnalysis(result);
    setStats(guestPostingAnalyzer.getStatistics());
  }, []);

  const downloadUrlList = (sites: any[], filename: string) => {
    const urls = sites.map(site => site.url).join('\n');
    const blob = new Blob([urls], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${sites.length} URLs`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest Posting Sites Database</h1>
          <p className="text-gray-600 text-lg">
            Curated list of {stats?.total || '200+'} websites for blog posts, guest posting, and content submission
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Instant Publishing</h3>
              <p className="text-sm text-gray-600">
                {stats?.noAccount || '50+'} sites that don't require account creation
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">HTML & Links</h3>
              <p className="text-sm text-gray-600">
                {stats?.htmlSupport || '150+'} sites supporting HTML formatting and links
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">High Authority</h3>
              <p className="text-sm text-gray-600">
                Includes major platforms like Medium, Dev.to, HubSpot
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Insights */}
        {analysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Site Analysis & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    Quick Publishing ({analysis.bestForQuickPosting.length})
                  </h4>
                  <div className="space-y-1">
                    {analysis.bestForQuickPosting.slice(0, 3).map(site => (
                      <div key={site.url} className="text-sm text-gray-600">
                        • {site.name}
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => downloadUrlList(analysis.bestForQuickPosting, 'quick-posting-sites')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download List
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    SEO Friendly ({analysis.bestForSEO.length})
                  </h4>
                  <div className="space-y-1">
                    {analysis.bestForSEO.slice(0, 3).map(site => (
                      <div key={site.url} className="text-sm text-gray-600">
                        • {site.name}
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => downloadUrlList(analysis.bestForSEO, 'seo-friendly-sites')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download List
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-600" />
                    Tech Focused ({analysis.bestForTech.length})
                  </h4>
                  <div className="space-y-1">
                    {analysis.bestForTech.slice(0, 3).map(site => (
                      <div key={site.url} className="text-sm text-gray-600">
                        • {site.name}
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => downloadUrlList(analysis.bestForTech, 'tech-sites')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>No Account Required:</strong> Sites marked with green badges allow posting without registration or email confirmation.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Terms Compliance:</strong> Always review each site's terms of service and content guidelines before posting.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Site List */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse All Sites</TabsTrigger>
            <TabsTrigger value="recommendations">Smart Recommendations</TabsTrigger>
            <TabsTrigger value="analytics">Site Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <GuestPostingSitesList />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {analysis?.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{rec.category}</CardTitle>
                  <CardDescription>{rec.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {rec.sites.map(site => (
                      <div key={site.url} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{site.name}</h4>
                          <p className="text-sm text-gray-600">{site.url}</p>
                          <div className="flex gap-1 mt-1">
                            {site.htmlSupport && <Badge variant="secondary" className="text-xs">HTML</Badge>}
                            {site.linksAllowed && <Badge variant="secondary" className="text-xs">Links</Badge>}
                            {!site.accountRequired && <Badge variant="secondary" className="text-xs">No Account</Badge>}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => window.open(site.url, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="mt-4" 
                    onClick={() => downloadUrlList(rec.sites, rec.category.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {rec.category} URLs
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total Sites</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600">{stats.percentages.noAccount}%</div>
                      <div className="text-sm text-gray-600">No Account</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600">{stats.percentages.htmlSupport}%</div>
                      <div className="text-sm text-gray-600">HTML Support</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600">{stats.percentages.linksAllowed}%</div>
                      <div className="text-sm text-gray-600">Links Allowed</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Sites by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.categories.map((cat: any) => (
                        <div key={cat.category} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{cat.category}</span>
                          <Badge variant="outline">{cat.count} sites</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Most Common Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.topFeatures.map((feature: any) => (
                        <div key={feature.feature} className="flex justify-between items-center p-3 border rounded">
                          <span>{feature.feature}</span>
                          <Badge variant="outline">{feature.count} sites</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
