import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Globe,
  BarChart3,
  Clock,
  Share,
  Download,
  FileText,
  Link,
  Target,
  TrendingUp,
  Shield,
  Infinity,
  ArrowLeft,
  Copy,
  RefreshCw
} from 'lucide-react';

interface BacklinkResult {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  status: 'found' | 'not_found' | 'error';
  domainAuthority: number;
  pageAuthority: number;
  responseTime: number;
  lastChecked: string;
}

interface ReportData {
  id: string;
  campaignName: string;
  clientEmail?: string;
  backlinks: any[];
  results: BacklinkResult[];
  createdAt: string;
  totalBacklinks: number;
}

export default function ReportViewer() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      // Load from localStorage for demo
      const stored = localStorage.getItem(`report_${reportId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setReportData(data);
      } else {
        toast({
          title: 'Report Not Found',
          description: 'The requested report could not be found or may have expired.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error Loading Report',
        description: 'Failed to load the report data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReport = async () => {
    setIsRefreshing(true);
    
    // Simulate refreshing the report data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (reportData) {
      // Update with slight variations to simulate real checking
      const updatedResults = reportData.results.map(result => ({
        ...result,
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 2000) + 500,
        // Occasionally change status
        status: Math.random() > 0.9 ? 
          (result.status === 'found' ? 'not_found' : 'found') : 
          result.status
      }));

      const updatedData = {
        ...reportData,
        results: updatedResults
      };

      setReportData(updatedData);
      localStorage.setItem(`report_${reportId}`, JSON.stringify(updatedData));
    }
    
    setIsRefreshing(false);
    toast({
      title: 'Report Refreshed',
      description: 'Backlink status has been updated.',
    });
  };

  const shareReport = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: 'Report URL Copied',
      description: 'Share this link with your clients or team.',
    });
  };

  const downloadReport = () => {
    if (!reportData) return;

    const csvData = [
      ['Source URL', 'Target URL', 'Anchor Text', 'Status', 'Domain Authority', 'Page Authority', 'Response Time (ms)', 'Last Checked'],
      ...reportData.results.map(r => [
        r.sourceUrl,
        r.targetUrl,
        r.anchorText,
        r.status,
        r.domainAuthority,
        r.pageAuthority,
        r.responseTime,
        new Date(r.lastChecked).toLocaleString()
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backlink-report-${reportData.campaignName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'CSV file has been downloaded to your computer.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found':
        return 'text-green-600 bg-green-100';
      case 'not_found':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle className="h-4 w-4" />;
      case 'not_found':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateStats = () => {
    if (!reportData) return { found: 0, notFound: 0, avgDA: 0, avgPA: 0 };
    
    const found = reportData.results.filter(r => r.status === 'found').length;
    const notFound = reportData.results.filter(r => r.status === 'not_found').length;
    const avgDA = Math.round(reportData.results.reduce((sum, r) => sum + r.domainAuthority, 0) / reportData.results.length);
    const avgPA = Math.round(reportData.results.reduce((sum, r) => sum + r.pageAuthority, 0) / reportData.results.length);
    
    return { found, notFound, avgDA, avgPA };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The requested backlink report could not be found or may have expired.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button variant="outline" onClick={() => navigate('/backlink-report')}>
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    Backlink <Infinity className="h-5 w-5" /> Report
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {reportData.campaignName}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshReport}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm" onClick={shareReport}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Report Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">{reportData.campaignName}</h2>
              <p className="text-muted-foreground">
                Generated on {new Date(reportData.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">{reportData.totalBacklinks}</div>
              <div className="text-sm text-muted-foreground">Total Backlinks</div>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Links</p>
                    <p className="text-2xl font-bold text-green-600">{stats.found}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Missing Links</p>
                    <p className="text-2xl font-bold text-red-600">{stats.notFound}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Domain Authority</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avgDA}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Page Authority</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.avgPA}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Rate */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">
                  {stats.found}/{reportData.totalBacklinks} active
                </span>
              </div>
              <Progress 
                value={(stats.found / reportData.totalBacklinks) * 100} 
                className="h-3" 
              />
              <p className="text-sm text-muted-foreground mt-2">
                {((stats.found / reportData.totalBacklinks) * 100).toFixed(1)}% of backlinks are active and verified
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Detailed Backlink Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.results.map((result, index) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">Backlink #{index + 1}</h3>
                        <Badge className={`gap-1 text-xs ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                          {result.status === 'found' ? 'Active' : 'Not Found'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Anchor Text: <span className="font-medium">"{result.anchorText}"</span>
                      </p>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Last checked: {new Date(result.lastChecked).toLocaleString()}</div>
                      <div>Response: {result.responseTime}ms</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Source URL</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <a 
                          href={result.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 flex-1 min-w-0"
                        >
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{result.sourceUrl}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Target URL</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <a 
                          href={result.targetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 flex-1 min-w-0"
                        >
                          <Target className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{result.targetUrl}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{result.domainAuthority}</div>
                      <div className="text-xs text-muted-foreground">Domain Authority</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-600">{result.pageAuthority}</div>
                      <div className="text-xs text-muted-foreground">Page Authority</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{result.responseTime}ms</div>
                      <div className="text-xs text-muted-foreground">Response Time</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="text-lg font-bold text-orange-600">
                        {result.status === 'found' ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-muted-foreground">Link Status</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Powered by Backlink ∞</h3>
            <p className="text-muted-foreground">
              Professional backlink verification and SEO reporting tools
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/backlink-report')}>
                Create Your Own Report
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Visit Backlink ∞
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
  }
}
