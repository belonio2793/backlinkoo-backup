import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Share,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Globe,
  Link,
  Target,
  Infinity,
  ArrowLeft,
  Loader2,
  Download,
  Save,
  Upload
} from 'lucide-react';

interface BacklinkEntry {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
}

export default function BacklinkReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([
    { id: '1', sourceUrl: '', targetUrl: '', anchorText: '' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const addBacklink = () => {
    const newBacklink: BacklinkEntry = {
      id: Date.now().toString(),
      sourceUrl: '',
      targetUrl: '',
      anchorText: ''
    };
    setBacklinks([...backlinks, newBacklink]);
  };

  const removeBacklink = (id: string) => {
    if (backlinks.length > 1) {
      setBacklinks(backlinks.filter(b => b.id !== id));
    }
  };

  const updateBacklink = (id: string, field: keyof BacklinkEntry, value: string) => {
    setBacklinks(backlinks.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const bulkImport = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newBacklinks: BacklinkEntry[] = [];
    
    lines.forEach((line, index) => {
      const parts = line.split('\t').map(p => p.trim()); // Split by tab
      if (parts.length >= 3) {
        newBacklinks.push({
          id: `import_${Date.now()}_${index}`,
          sourceUrl: parts[0] || '',
          targetUrl: parts[1] || '',
          anchorText: parts[2] || ''
        });
      }
    });

    if (newBacklinks.length > 0) {
      setBacklinks(newBacklinks);
      toast({
        title: 'Bulk Import Successful',
        description: `Imported ${newBacklinks.length} backlink entries.`,
      });
    } else {
      toast({
        title: 'Import Failed',
        description: 'Please use the format: Source URL → Target URL → Anchor Text (tab-separated)',
        variant: 'destructive'
      });
    }
  };

  const generateReport = async () => {
    const validBacklinks = backlinks.filter(b => 
      b.sourceUrl && b.targetUrl && b.anchorText
    );

    if (validBacklinks.length === 0) {
      toast({
        title: 'No Valid Backlinks',
        description: 'Please add at least one complete backlink entry.',
        variant: 'destructive'
      });
      return;
    }

    if (!campaignName) {
      toast({
        title: 'Campaign Name Required',
        description: 'Please enter a campaign name for this report.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate unique report URL
      const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const generatedUrl = `${window.location.origin}/report/${reportId}`;
      
      // Store report data in localStorage for demo
      const reportData = {
        id: reportId,
        campaignName,
        clientEmail,
        backlinks: validBacklinks,
        createdAt: new Date().toISOString(),
        totalBacklinks: validBacklinks.length,
        // Mock verification results
        results: validBacklinks.map(bl => ({
          ...bl,
          status: Math.random() > 0.3 ? 'found' : 'not_found',
          domainAuthority: Math.floor(Math.random() * 40) + 40,
          pageAuthority: Math.floor(Math.random() * 50) + 20,
          responseTime: Math.floor(Math.random() * 2000) + 500,
          lastChecked: new Date().toISOString()
        }))
      };

      localStorage.setItem(`report_${reportId}`, JSON.stringify(reportData));
      
      setReportUrl(generatedUrl);
      
      toast({
        title: 'Report Generated Successfully!',
        description: 'Your backlink verification report is ready to share.',
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReportUrl = () => {
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: 'URL Copied',
      description: 'Report URL has been copied to clipboard.',
    });
  };

  const saveToProfile = () => {
    toast({
      title: 'Save to Dashboard',
      description: 'Please register or log in to save reports to your dashboard.',
    });
    navigate('/login');
  };

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
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2">
                    Backlink <Infinity className="h-5 w-5" /> Verification Tool
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Generate professional backlink verification reports for clients
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <Link className="h-3 w-3" />
                {backlinks.filter(b => b.sourceUrl && b.targetUrl).length} backlinks
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Campaign Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Client ABC - Q1 2024 Backlinks"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email (Optional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Quick Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkImport">Bulk Import (Tab-separated)</Label>
                  <Textarea
                    id="bulkImport"
                    placeholder="Paste your data here in format:&#10;https://source1.com &#9; https://target1.com &#9; anchor text 1&#10;https://source2.com &#9; https://target2.com &#9; anchor text 2"
                    rows={4}
                    onChange={(e) => {
                      if (e.target.value.trim()) {
                        bulkImport(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: Source URL [TAB] Target URL [TAB] Anchor Text (one per line)
                </p>
              </CardContent>
            </Card>

            {/* Backlink Entries */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Backlink Entries
                  </CardTitle>
                  <Button onClick={addBacklink} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Backlink
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {backlinks.map((backlink, index) => (
                  <div key={backlink.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Backlink #{index + 1}</h4>
                      {backlinks.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBacklink(backlink.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Source URL *</Label>
                        <Input
                          placeholder="https://linkingsite.com/page"
                          value={backlink.sourceUrl}
                          onChange={(e) => updateBacklink(backlink.id, 'sourceUrl', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Where the link is placed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Target URL *</Label>
                        <Input
                          placeholder="https://yoursite.com"
                          value={backlink.targetUrl}
                          onChange={(e) => updateBacklink(backlink.id, 'targetUrl', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Where the link points to</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Anchor Text *</Label>
                        <Input
                          placeholder="best SEO services"
                          value={backlink.anchorText}
                          onChange={(e) => updateBacklink(backlink.id, 'anchorText', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Link text to verify</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card>
              <CardContent className="p-6">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Generate Verification Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report URL */}
            {reportUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share className="h-5 w-5" />
                    Report Generated!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Public Report URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={reportUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyReportUrl}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(reportUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveToProfile}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Report Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Anchor Text Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Checks if anchor text exists on source pages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Domain & Page Authority</p>
                      <p className="text-sm text-muted-foreground">
                        Moz metrics for each linking domain
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Link Status</p>
                      <p className="text-sm text-muted-foreground">
                        Active, broken, or redirected links
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Professional Presentation</p>
                      <p className="text-sm text-muted-foreground">
                        Client-ready reports with branding
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Upgrade Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Free Reports</h4>
                    <p className="text-sm text-blue-700">Up to 10 backlinks per report</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800">Pro Reports</h4>
                    <p className="text-sm text-purple-700">Unlimited backlinks + advanced features</p>
                    <Button size="sm" className="mt-2">
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <p>Use descriptive campaign names for easy organization</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <p>Include client email to automatically share reports</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <p>Save reports to your dashboard for future reference</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <p>Reports update automatically as links change</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
