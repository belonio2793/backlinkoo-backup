import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Copy,
  ExternalLink,
  Settings,
  Palette,
  ArrowRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface DomainRecord {
  type: string;
  name: string;
  value: string;
  status: 'pending' | 'verified' | 'error';
}

interface Domain {
  id: string;
  domain: string;
  status: 'adding' | 'dns_pending' | 'validating' | 'theme_selection' | 'active';
  blog_enabled: boolean;
  blog_subdirectory: string;
  dns_records?: DomainRecord[];
  selected_theme?: string;
}

interface DomainWorkflowManagerProps {
  onDomainAdded?: (domain: Domain) => void;
  onThemeSelected?: (domainId: string, themeId: string) => void;
}

const BLOG_THEMES = [
  { id: 'minimal', name: 'Minimal Clean', description: 'Clean and simple design' },
  { id: 'modern', name: 'Modern Business', description: 'Professional business layout' },
  { id: 'elegant', name: 'Elegant Editorial', description: 'Magazine-style layout' },
  { id: 'tech', name: 'Tech Focus', description: 'Technology-focused design' }
];

export function DomainWorkflowManager({ onDomainAdded, onThemeSelected }: DomainWorkflowManagerProps) {
  const [step, setStep] = useState<'input' | 'adding' | 'dns_records' | 'validating' | 'theme_selection' | 'complete'>('input');
  const [domainInput, setDomainInput] = useState('');
  const [currentDomain, setCurrentDomain] = useState<Domain | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate adding domain to Netlify and fetching DNS records
  const addDomainToNetlify = async (domain: string): Promise<DomainRecord[]> => {
    // Simulate API call to Netlify
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return [
      {
        type: 'A',
        name: domain,
        value: '75.2.60.5',
        status: 'pending'
      },
      {
        type: 'CNAME',
        name: `www.${domain}`,
        value: `${domain}.netlify.app`,
        status: 'pending'
      }
    ];
  };

  // Validate DNS records
  const validateDNSRecords = async (domain: string): Promise<boolean> => {
    // Simulate DNS validation
    await new Promise(resolve => setTimeout(resolve, 3000));
    return Math.random() > 0.3; // 70% success rate for demo
  };

  const handleAddDomain = async () => {
    if (!domainInput.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setIsProcessing(true);
    setStep('adding');

    try {
      // Step 1: Add domain to Netlify
      toast.info('Adding domain to Netlify...');
      const dnsRecords = await addDomainToNetlify(domainInput);
      
      const newDomain: Domain = {
        id: Date.now().toString(),
        domain: domainInput,
        status: 'dns_pending',
        blog_enabled: true,
        blog_subdirectory: 'blog',
        dns_records: dnsRecords
      };

      setCurrentDomain(newDomain);
      setStep('dns_records');
      toast.success('Domain added to Netlify! Please update your DNS records.');

    } catch (error: any) {
      toast.error(`Failed to add domain: ${error.message}`);
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateDNS = async () => {
    if (!currentDomain) return;

    setIsProcessing(true);
    setStep('validating');
    toast.info('Validating DNS records...');

    try {
      const isValid = await validateDNSRecords(currentDomain.domain);
      
      if (isValid) {
        setCurrentDomain(prev => prev ? { ...prev, status: 'theme_selection' } : null);
        setStep('theme_selection');
        toast.success('DNS records validated successfully!');
      } else {
        toast.error('DNS records not found. Please check your settings and try again.');
        setStep('dns_records');
      }
    } catch (error: any) {
      toast.error(`Validation failed: ${error.message}`);
      setStep('dns_records');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThemeSelection = async (themeId: string) => {
    if (!currentDomain) return;

    setIsProcessing(true);
    
    try {
      const updatedDomain: Domain = {
        ...currentDomain,
        selected_theme: themeId,
        status: 'active'
      };

      setCurrentDomain(updatedDomain);
      setStep('complete');
      
      toast.success(`Domain configured with ${BLOG_THEMES.find(t => t.id === themeId)?.name} theme!`);
      
      // Notify parent components
      onDomainAdded?.(updatedDomain);
      onThemeSelected?.(updatedDomain.id, themeId);

      // Reset workflow after 3 seconds
      setTimeout(() => {
        setStep('input');
        setDomainInput('');
        setCurrentDomain(null);
      }, 3000);

    } catch (error: any) {
      toast.error(`Failed to configure theme: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const resetWorkflow = () => {
    setStep('input');
    setDomainInput('');
    setCurrentDomain(null);
    setIsProcessing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Setup Workflow
          <Badge variant={step === 'complete' ? 'default' : 'secondary'}>
            Step {['input', 'adding', 'dns_records', 'validating', 'theme_selection', 'complete'].indexOf(step) + 1} of 5
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Domain Input */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter Domain Name</label>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <Button 
                  onClick={handleAddDomain}
                  disabled={!domainInput.trim() || isProcessing}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Domain will be added to Netlify and DNS records will be generated for configuration.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Adding to Netlify */}
        {step === 'adding' && (
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="font-medium">Adding Domain to Netlify</h3>
              <p className="text-sm text-gray-600">Configuring hosting and generating DNS records...</p>
            </div>
          </div>
        )}

        {/* Step 3: DNS Records Display */}
        {step === 'dns_records' && currentDomain && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">DNS Records for {currentDomain.domain}</h3>
              <Button variant="outline" size="sm" onClick={resetWorkflow}>
                Start Over
              </Button>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Update these DNS records at your domain registrar, then click validate.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {currentDomain.dns_records?.map((record, index) => (
                <Card key={index} className="border-l-4 border-l-orange-400">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="font-medium">{record.name}</span>
                        </div>
                        <div className="font-mono text-sm text-gray-600">{record.value}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleValidateDNS} disabled={isProcessing}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Validate DNS Records
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(`https://dns.google/query?name=${currentDomain.domain}&type=A`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Check DNS Propagation
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Validating */}
        {step === 'validating' && currentDomain && (
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="font-medium">Validating DNS Records</h3>
              <p className="text-sm text-gray-600">Checking DNS propagation for {currentDomain.domain}...</p>
            </div>
          </div>
        )}

        {/* Step 5: Theme Selection */}
        {step === 'theme_selection' && currentDomain && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">DNS Validated! Select Blog Theme</h3>
            </div>
            
            <Alert>
              <Palette className="h-4 w-4" />
              <AlertDescription>
                Choose a blog theme that will be used to generate posts from your automation campaigns.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BLOG_THEMES.map((theme) => (
                <Card 
                  key={theme.id}
                  className="cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => handleThemeSelection(theme.id)}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{theme.name}</h4>
                      <p className="text-sm text-gray-600">{theme.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Complete */}
        {step === 'complete' && currentDomain && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div>
              <h3 className="text-lg font-medium text-green-700">Domain Setup Complete!</h3>
              <p className="text-sm text-gray-600">
                {currentDomain.domain} is now configured with the {BLOG_THEMES.find(t => t.id === currentDomain.selected_theme)?.name} theme.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You can now use this domain for automated blog post generation in /automation campaigns.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DomainWorkflowManager;
