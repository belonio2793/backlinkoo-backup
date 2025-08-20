import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Globe,
  Server,
  Zap,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface DNSSetupInstructionsProps {
  domain: string;
  scenario: 'registrar' | 'domains-page' | 'subdomain';
  onClose?: () => void;
}

const DNSSetupInstructions: React.FC<DNSSetupInstructionsProps> = ({ 
  domain, 
  scenario, 
  onClose 
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const netlifyNameservers = [
    'dns1.p01.nsone.net',
    'dns2.p01.nsone.net', 
    'dns3.p01.nsone.net',
    'dns4.p01.nsone.net'
  ];

  const netlifyIP = '75.2.60.5'; // Same IP as backlinkoo.com
  const backlinkooDomain = 'backlinkoo.netlify.app'; // Exact same Netlify app as backlinkoo.com

  const getScenarioTitle = () => {
    switch (scenario) {
      case 'registrar':
        return '🏢 Domain from Registrar Setup';
      case 'domains-page':
        return '📋 Domains Page Integration';
      case 'subdomain':
        return '🌐 Subdomain Configuration';
      default:
        return '🌐 DNS Setup Instructions';
    }
  };

  const getScenarioDescription = () => {
    switch (scenario) {
      case 'registrar':
        return 'For domains purchased from registrars like GoDaddy, Namecheap, or Cloudflare';
      case 'domains-page':
        return 'For domains added through the /domains page to point to our server';
      case 'subdomain':
        return 'For setting up subdomains and CNAME records';
      default:
        return 'Complete DNS configuration guide';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {getScenarioTitle()}
                <Badge variant="outline">{domain}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getScenarioDescription()}
              </p>
            </div>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="registrar">Registrar Setup</TabsTrigger>
              <TabsTrigger value="dns-records">DNS Records</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Start:</strong> Choose your setup method below based on where your domain is managed.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Registrar Domains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Domains purchased from GoDaddy, Namecheap, etc.
                    </p>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">✓ Full SSL Support</Badge>
                      <Badge variant="secondary" className="text-xs">✓ Auto DNS Management</Badge>
                      <Badge variant="secondary" className="text-xs">✓ CDN Integration</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Direct Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Domains added via /domains page
                    </p>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">✓ Direct Server Connection</Badge>
                      <Badge variant="secondary" className="text-xs">✓ A Record Setup</Badge>
                      <Badge variant="secondary" className="text-xs">✓ Blog Subdirectory</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Advanced Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Custom configurations and edge cases
                    </p>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">✓ Subdomain Routing</Badge>
                      <Badge variant="secondary" className="text-xs">✓ Custom Redirects</Badge>
                      <Badge variant="secondary" className="text-xs">✓ Edge Functions</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Time Required:</strong> DNS propagation typically takes 24-48 hours. 
                  SSL certificates are provisioned automatically once DNS is verified.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Registrar Setup Tab */}
            <TabsContent value="registrar" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended Method:</strong> Update nameservers for full Netlify DNS management.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 1: Update Nameservers</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Replace your current nameservers with Netlify's DNS servers
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Netlify Nameservers:</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md font-mono text-sm">
                      {netlifyNameservers.map((ns, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{ns}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(ns, `Nameserver ${index + 1}`)}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(netlifyNameservers.join('\n'), 'All Nameservers')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All Nameservers
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Popular Registrars:</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs space-y-1">
                          <div><strong>GoDaddy:</strong> Domain Settings → Nameservers</div>
                          <div><strong>Namecheap:</strong> Domain List → Manage → Nameservers</div>
                          <div><strong>Cloudflare:</strong> DNS → Custom Nameservers</div>
                          <div><strong>Google Domains:</strong> DNS → Name servers</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Important:</strong> Save existing nameservers before changing.
                        You can always revert if needed.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step 2: Verify Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Use these tools to check if your nameserver changes have propagated:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://dnschecker.org/#NS/${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        DNS Checker
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.whatsmydns.net/#NS/${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        What's My DNS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DNS Records Tab */}
            <TabsContent value="dns-records" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  These records are automatically created when using Netlify nameservers.
                  Manual setup is only needed for external DNS providers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Required A Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                          <div><strong>Type:</strong> A</div>
                          <div><strong>Name:</strong> @</div>
                          <div><strong>Value:</strong> {netlifyIP}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(netlifyIP, 'Netlify IP')}
                          className="mt-2 h-6"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy IP
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CNAME Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-xs font-mono space-y-1">
                          <div><strong>www.{domain}</strong> → {backlinkooDomain}</div>
                          <div><strong>blog.{domain}</strong> → {backlinkooDomain}</div>
                          <div><strong>*.{domain}</strong> → {backlinkooDomain}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(backlinkooDomain, 'Backlinkoo Netlify URL')}
                          className="mt-2 h-6"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Target
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {scenario === 'domains-page' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Domains Page Setup:</strong> When adding domains through /domains page,
                    ensure the A record points to <code className="px-1 py-0.5 bg-white rounded text-xs">{netlifyIP}</code> for direct server connection.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Follow these steps to verify your DNS setup is working correctly.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Automated Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our system automatically checks DNS status every 30 minutes.
                      Check the /domains page for current status.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">🟡 Validating</Badge>
                      <Badge variant="outline" className="text-xs">🟢 Active</Badge>
                      <Badge variant="outline" className="text-xs">🔴 Failed</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Manual Verification Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Test Website
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.ssllabs.com/ssltest/analyze.html?d=${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        SSL Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://dnschecker.org/#A/${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        DNS Propagation
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://httpstatus.io/${domain}`, '_blank')}
                        className="justify-start"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        HTTP Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success Indicators:</strong>
                    <ul className="mt-2 text-xs space-y-1">
                      <li>• Website loads at https://{domain}</li>
                      <li>• SSL certificate shows as valid</li>
                      <li>• DNS checker shows Netlify nameservers</li>
                      <li>• Domain status in /domains shows as "Active"</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DNSSetupInstructions;
