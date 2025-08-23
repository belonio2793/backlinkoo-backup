/**
 * Manual Domain Addition Instructions
 * 
 * Shows step-by-step instructions for manually adding domains when 
 * Netlify functions are not deployed
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface ManualDomainInstructionsProps {
  domain: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function ManualDomainInstructions({ domain, isVisible, onClose }: ManualDomainInstructionsProps) {
  if (!isVisible) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const siteId = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  const netlifyUrl = `https://app.netlify.com/sites/backlinkoo/settings/domain`;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Manual Domain Addition Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Netlify functions are not deployed.</strong> You can add the domain manually through the Netlify dashboard.
            Once functions are deployed, this process will be automated.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Step-by-step instructions:</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">1</span>
              <div className="flex-1">
                <p className="font-medium">Open Netlify Domain Settings</p>
                <p className="text-sm text-gray-600">Go to your site's domain management page</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open(netlifyUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Domain Settings
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">2</span>
              <div className="flex-1">
                <p className="font-medium">Add Domain Alias</p>
                <p className="text-sm text-gray-600 mb-2">Add this domain as an alias to your site:</p>
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                  <span className="flex-1">{domain}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(domain, 'Domain')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">3</span>
              <div className="flex-1">
                <p className="font-medium">Configure DNS Records</p>
                <p className="text-sm text-gray-600">Use the DNS validation modal in this app to get the correct DNS records</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // Trigger DNS validation modal if callback provided
                    toast.info('Use the "DNS Check" button for this domain to get DNS instructions');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Get DNS Instructions
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">4</span>
              <div className="flex-1">
                <p className="font-medium">Wait for Propagation</p>
                <p className="text-sm text-gray-600">DNS changes typically take 5-30 minutes to propagate</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">5</span>
              <div className="flex-1">
                <p className="font-medium">SSL Certificate</p>
                <p className="text-sm text-gray-600">Netlify will automatically provision an SSL certificate once DNS is verified</p>
              </div>
            </div>
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>To automate this process:</strong> Deploy the Netlify functions in your repository. 
            Push your code changes to trigger a new deployment, or check the deployment logs for errors.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://app.netlify.com/sites/backlinkoo/deploys', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Deployments
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://app.netlify.com/sites/backlinkoo/functions', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Functions
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ManualDomainInstructions;
