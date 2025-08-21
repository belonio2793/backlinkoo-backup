import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Copy, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface NetlifySetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured?: () => void;
}

export default function NetlifySetupGuide({ open, onOpenChange, onConfigured }: NetlifySetupGuideProps) {
  const [accessToken, setAccessToken] = useState('');
  const [siteId, setSiteId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = [
    {
      title: "Get Netlify Access Token",
      description: "Generate a personal access token to manage domains",
      action: (
        <Button 
          variant="outline" 
          onClick={() => window.open('https://app.netlify.com/user/applications#personal-access-tokens', '_blank')}
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Netlify Settings
        </Button>
      )
    },
    {
      title: "Get Site ID",
      description: "Find your site ID in Netlify dashboard",
      action: (
        <Button 
          variant="outline" 
          onClick={() => window.open('https://app.netlify.com/sites', '_blank')}
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Netlify Sites
        </Button>
      )
    }
  ];

  const handleSave = () => {
    if (!accessToken || !siteId) {
      toast.error('Please fill in both fields');
      return;
    }

    // Note: In a real app, these would be set via environment variables or secure configuration
    toast.success('Configuration saved! Please set these as environment variables and restart the app.');
    onConfigured?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Netlify Setup for Domain Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              To use the domain management features, you need to connect your Netlify account. 
              This allows the app to add domains, configure DNS, and manage SSL certificates.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.action}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Netlify Access Token</Label>
              <div className="flex gap-2">
                <Input
                  id="token"
                  type="password"
                  placeholder="Enter your Netlify personal access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`VITE_NETLIFY_ACCESS_TOKEN=${accessToken}`, 'Token env var')}
                  disabled={!accessToken}
                >
                  {copied === 'Token env var' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteId">Netlify Site ID</Label>
              <div className="flex gap-2">
                <Input
                  id="siteId"
                  placeholder="Enter your Netlify site ID"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`VITE_NETLIFY_SITE_ID=${siteId}`, 'Site ID env var')}
                  disabled={!siteId}
                >
                  {copied === 'Site ID env var' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>For Development:</strong> Add these to your .env file and restart the dev server.
              <br />
              <strong>For Production:</strong> Set these as environment variables in your hosting platform.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
