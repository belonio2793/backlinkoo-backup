import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Download, Search, Mail, Globe, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForUI } from '@/utils/errorUtils';

interface ScrapedEmail {
  email: string;
  domain: string;
  source: string;
  timestamp: Date;
}

export default function ScrapePage() {
  const [keyword, setKeyword] = useState('');
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [emails, setEmails] = useState<ScrapedEmail[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startScraping = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword to search for",
        variant: "destructive"
      });
      return;
    }

    setIsScrapingActive(true);
    setScrapingProgress(0);
    setEmails([]);
    setError(null);
    setCurrentPage(0);
    setTotalPages(0);

    try {
      // Simulate progress updates
      setScrapingProgress(10);

      console.log('Starting scrape for keyword:', keyword.trim());

      const response = await fetch('/.netlify/functions/email-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      setScrapingProgress(50);

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        // Update progress
        setScrapingProgress(100);
        setTotalPages(data.totalPages);
        setCurrentPage(data.totalPages);

        // Add emails to the list
        const emailList = data.emails.map(emailData => ({
          email: emailData.email,
          domain: emailData.domain,
          source: emailData.source,
          timestamp: new Date()
        }));

        setEmails(emailList);

        toast({
          title: "Scraping Complete",
          description: `Found ${data.totalEmails} emails from ${data.totalPages} pages`,
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Scraping failed: ${errorMessage}`);
      toast({
        title: "Scraping Failed",
        description: errorMessage.includes('404')
          ? "The email scraper service is not available. Please try again later."
          : "Please try again or contact support if the issue persists",
        variant: "destructive"
      });
    } finally {
      setIsScrapingActive(false);
    }
  };

  const stopScraping = () => {
    setIsScrapingActive(false);
    setScrapingProgress(0);
    toast({
      title: "Scraping Stopped",
      description: "Email scraping has been stopped",
    });
  };

  const exportToCSV = () => {
    if (emails.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please scrape some emails first",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Email', 'Domain', 'Source URL', 'Timestamp'],
      ...emails.map(email => [
        email.email,
        email.domain,
        email.source,
        email.timestamp.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraped-emails-${keyword}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${emails.length} emails to CSV`,
    });
  };

  const exportToJSON = () => {
    if (emails.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please scrape some emails first",
        variant: "destructive"
      });
      return;
    }

    const jsonContent = JSON.stringify({
      keyword,
      scrapeDate: new Date().toISOString(),
      totalEmails: emails.length,
      emails: emails.map(email => ({
        ...email,
        timestamp: email.timestamp.toISOString()
      }))
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraped-emails-${keyword}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${emails.length} emails to JSON`,
    });
  };

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied",
      description: `${email} copied to clipboard`,
    });
  };

  const clearResults = () => {
    setEmails([]);
    setScrapingProgress(0);
    setError(null);
    toast({
      title: "Results Cleared",
      description: "All scraped emails have been cleared",
    });
  };

  const uniqueDomains = [...new Set(emails.map(email => email.domain))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Email Scraper
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enter a keyword to scrape email addresses from websites containing that keyword. 
            Build targeted email lists fast with advanced filtering and export capabilities.
          </p>
        </div>

        {/* Search Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Keyword Search
            </CardTitle>
            <CardDescription>
              Enter a keyword to find websites and extract email addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="keyword">Search Keyword</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., digital marketing, web design, consulting"
                  disabled={isScrapingActive}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={startScraping}
                  disabled={isScrapingActive || !keyword.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isScrapingActive ? 'Scraping...' : 'Start Scraping'}
                </Button>
                {isScrapingActive && (
                  <Button
                    onClick={stopScraping}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(isScrapingActive || scrapingProgress > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress: {Math.round(scrapingProgress)}%</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
                <Progress value={scrapingProgress} className="w-full" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Overview */}
        {emails.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{emails.length}</div>
                <div className="text-sm text-gray-600">Total Emails</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{uniqueDomains.length}</div>
                <div className="text-sm text-gray-600">Unique Domains</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalPages}</div>
                <div className="text-sm text-gray-600">Pages Scraped</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((emails.length / Math.max(totalPages, 1)) * 10) / 10}
                </div>
                <div className="text-sm text-gray-600">Emails/Page</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Controls */}
        {emails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={exportToJSON} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={clearResults} variant="outline" className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Results */}
        {emails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Scraped Emails ({emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{email.email}</span>
                        <Badge variant="secondary" className="text-xs">
                          {email.domain}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-xs">{email.source}</span>
                        <span>•</span>
                        <span>{email.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(email.email)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain Summary */}
        {uniqueDomains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Domain Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uniqueDomains.map((domain, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {domain} ({emails.filter(e => e.domain === domain).length})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
