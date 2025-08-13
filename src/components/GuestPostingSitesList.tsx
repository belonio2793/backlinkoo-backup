import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  Search, 
  Filter, 
  Code, 
  Link2, 
  UserCheck, 
  Globe,
  Copy,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import guestPostingSites from '@/data/guestPostingSites.json';

interface Site {
  url: string;
  name: string;
  htmlSupport: boolean;
  linksAllowed: boolean;
  accountRequired: boolean;
  signupMethod?: string;
  features: string[];
}

interface SiteCategory {
  description: string;
  sites: Site[];
}

export function GuestPostingSitesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHtmlSupport, setFilterHtmlSupport] = useState(false);
  const [filterNoAccount, setFilterNoAccount] = useState(false);
  const [filterLinksAllowed, setFilterLinksAllowed] = useState(false);
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());

  const categories = guestPostingSites as Record<string, SiteCategory>;

  const filteredCategories = useMemo(() => {
    const filtered: Record<string, SiteCategory> = {};
    
    Object.entries(categories).forEach(([categoryKey, category]) => {
      const filteredSites = category.sites.filter(site => {
        const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesHtml = !filterHtmlSupport || site.htmlSupport;
        const matchesAccount = !filterNoAccount || !site.accountRequired;
        const matchesLinks = !filterLinksAllowed || site.linksAllowed;
        
        return matchesSearch && matchesHtml && matchesAccount && matchesLinks;
      });
      
      if (filteredSites.length > 0) {
        filtered[categoryKey] = {
          ...category,
          sites: filteredSites
        };
      }
    });
    
    return filtered;
  }, [searchTerm, filterHtmlSupport, filterNoAccount, filterLinksAllowed]);

  const allSites = useMemo(() => {
    return Object.values(categories).flatMap(category => category.sites);
  }, []);

  const stats = useMemo(() => {
    const noAccountSites = allSites.filter(site => !site.accountRequired).length;
    const htmlSupportSites = allSites.filter(site => site.htmlSupport).length;
    const linksAllowedSites = allSites.filter(site => site.linksAllowed).length;
    
    return {
      total: allSites.length,
      noAccount: noAccountSites,
      htmlSupport: htmlSupportSites,
      linksAllowed: linksAllowedSites
    };
  }, [allSites]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrls(prev => new Set([...prev, url]));
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      }, 2000);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const copyAllUrls = async (sites: Site[]) => {
    const urls = sites.map(site => site.url).join('\\n');
    try {
      await navigator.clipboard.writeText(urls);
      toast.success(`Copied ${sites.length} URLs to clipboard`);
    } catch (error) {
      toast.error('Failed to copy URLs');
    }
  };

  const exportAsCsv = () => {
    const headers = ['Name', 'URL', 'HTML Support', 'Links Allowed', 'Account Required', 'Features'];
    const rows = allSites.map(site => [
      site.name,
      site.url,
      site.htmlSupport ? 'Yes' : 'No',
      site.linksAllowed ? 'Yes' : 'No',
      site.accountRequired ? 'Yes' : 'No',
      site.features.join('; ')
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-posting-sites.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Guest Posting Sites Database</h1>
        <p className="text-gray-600 mb-4">
          Comprehensive list of websites for blog posts and guest posting
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Sites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.noAccount}</div>
              <div className="text-sm text-gray-600">No Account</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.htmlSupport}</div>
              <div className="text-sm text-gray-600">HTML Support</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.linksAllowed}</div>
              <div className="text-sm text-gray-600">Links Allowed</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Search sites</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, URL, or features..."
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="html-support"
                checked={filterHtmlSupport}
                onCheckedChange={setFilterHtmlSupport}
              />
              <Label htmlFor="html-support" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                HTML Support Only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="no-account"
                checked={filterNoAccount}
                onCheckedChange={setFilterNoAccount}
              />
              <Label htmlFor="no-account" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                No Account Required
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="links-allowed"
                checked={filterLinksAllowed}
                onCheckedChange={setFilterLinksAllowed}
              />
              <Label htmlFor="links-allowed" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Links Allowed
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={exportAsCsv} variant="outline">
              Export CSV
            </Button>
            <Button onClick={() => copyAllUrls(allSites)} variant="outline">
              Copy All URLs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Tabs */}
      <Tabs defaultValue="instant" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instant">Instant Publish</TabsTrigger>
          <TabsTrigger value="dev">Developer</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="all">All Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="instant" className="space-y-4">
          <div className="grid gap-4">
            {filteredCategories.instantPublishSites?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
            {filteredCategories.anonymousPlatforms?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dev" className="space-y-4">
          <div className="grid gap-4">
            {filteredCategories.devPlatforms?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
            {filteredCategories.techBlogs?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
            {filteredCategories.codeHosting?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid gap-4">
            {filteredCategories.marketingBlogs?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
            {filteredCategories.contentPlatforms?.sites.map((site) => (
              <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {Object.entries(filteredCategories).map(([categoryKey, category]) => (
            <Card key={categoryKey}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{category.sites.length} sites</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyAllUrls(category.sites)}
                    >
                      Copy All
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {category.sites.map((site) => (
                    <SiteCard key={site.url} site={site} onCopyUrl={copyUrl} isCopied={copiedUrls.has(site.url)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SiteCardProps {
  site: Site;
  onCopyUrl: (url: string) => void;
  isCopied: boolean;
}

function SiteCard({ site, onCopyUrl, isCopied }: SiteCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium">{site.name}</h3>
          <div className="flex gap-1">
            {site.htmlSupport && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                HTML
              </Badge>
            )}
            {site.linksAllowed && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                Links
              </Badge>
            )}
            {!site.accountRequired && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                No Account
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{site.url}</p>
        
        <div className="flex flex-wrap gap-1">
          {site.features.map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopyUrl(site.url)}
        >
          {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          onClick={() => window.open(site.url, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
