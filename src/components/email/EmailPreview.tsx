import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Share,
  Link,
  Copy,
  Send,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  QrCode,
  ExternalLink,
  Mail,
  Clock
} from 'lucide-react';

interface PreviewLink {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  views: number;
  lastViewed?: string;
  emailContent: string;
  subject: string;
}

export function EmailPreview() {
  const [previewLinks, setPreviewLinks] = useState<PreviewLink[]>([
    {
      id: '1',
      title: 'Backlink ∞ Introduction Email',
      url: 'https://preview.backlinkoo.com/p/abc123def456',
      createdAt: '2024-01-15T10:00:00Z',
      views: 47,
      lastViewed: '2024-01-15T16:30:00Z',
      subject: 'Transform Your SEO with Professional Backlink Services',
      emailContent: `
        <h2>Boost Your Website's Authority with Backlink ∞</h2>
        <p>Hi there,</p>
        <p>We're excited to introduce you to <strong>Backlink ∞</strong> – the revolutionary platform that's transforming how businesses approach SEO and link building.</p>
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0; color: white;">🚀 Get Started Today</h3>
          <p style="margin: 10px 0;">Professional backlinks starting at $1.40 each</p>
          <a href="https://backlinkoo.com" style="background: white; color: #3B82F6; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Free Trial</a>
        </div>
      `
    }
  ]);
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedPreview, setSelectedPreview] = useState<string>('1');
  const [newPreviewTitle, setNewPreviewTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePreviewLink = async () => {
    if (!newPreviewTitle) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for the preview link.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newLink: PreviewLink = {
        id: Date.now().toString(),
        title: newPreviewTitle,
        url: `https://preview.backlinkoo.com/p/${Math.random().toString(36).substr(2, 12)}`,
        createdAt: new Date().toISOString(),
        views: 0,
        subject: 'Test Email Subject',
        emailContent: `
          <h2>Test Email Preview</h2>
          <p>This is a test email preview generated for: <strong>${newPreviewTitle}</strong></p>
          <p>You can use this link to share and test your email templates without requiring domain configuration.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Preview Features:</strong></p>
            <ul>
              <li>No domain setup required</li>
              <li>Mobile and desktop responsive</li>
              <li>Real-time view tracking</li>
              <li>Easy sharing with QR codes</li>
            </ul>
          </div>
        `
      };

      setPreviewLinks(prev => [newLink, ...prev]);
      setSelectedPreview(newLink.id);
      setNewPreviewTitle('');

      toast({
        title: 'Preview Link Generated',
        description: 'Your email preview link has been created successfully.',
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate preview link. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPreviewLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Preview link has been copied to clipboard.',
    });
  };

  const sharePreviewLink = (url: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Email Preview: ${title}`,
        url: url,
      });
    } else {
      copyPreviewLink(url);
    }
  };

  const generateQRCode = (url: string) => {
    // In a real implementation, you'd generate an actual QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrUrl;
  };

  const getDeviceClass = () => {
    switch (selectedDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-md mx-auto';
      default:
        return 'max-w-2xl mx-auto';
    }
  };

  const selectedPreviewData = previewLinks.find(p => p.id === selectedPreview);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Preview & Testing</h2>
          <p className="text-muted-foreground">
            Generate domain-free preview links for testing and sharing emails
          </p>
        </div>
        
        <Badge variant="outline" className="gap-1">
          <Link className="h-3 w-3" />
          {previewLinks.length} preview links
        </Badge>
      </div>

      {/* Generate New Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Generate Preview Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="previewTitle">Preview Title</Label>
              <Input
                id="previewTitle"
                placeholder="e.g., Holiday Campaign Preview"
                value={newPreviewTitle}
                onChange={(e) => setNewPreviewTitle(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generatePreviewLink}
                disabled={isGenerating || !newPreviewTitle}
              >
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800">Why Use Preview Links?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>No Domain Setup:</strong> Test emails without configuring DNS or domains</li>
              <li>• <strong>Instant Sharing:</strong> Share with clients or team members immediately</li>
              <li>• <strong>Mobile Testing:</strong> View how emails look on different devices</li>
              <li>• <strong>Analytics:</strong> Track views and engagement on preview links</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Links List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Links List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your Preview Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewLinks.map((preview) => (
              <div
                key={preview.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPreview === preview.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedPreview(preview.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{preview.title}</h4>
                    <p className="text-sm text-muted-foreground">{preview.subject}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {preview.views} views
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  <span>Created {new Date(preview.createdAt).toLocaleDateString()}</span>
                  {preview.lastViewed && (
                    <>
                      <span>•</span>
                      <span>Last viewed {new Date(preview.lastViewed).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPreviewLink(preview.url);
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      sharePreviewLink(preview.url, preview.title);
                    }}
                  >
                    <Share className="mr-1 h-3 w-3" />
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(preview.url, '_blank');
                    }}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open
                  </Button>
                </div>
              </div>
            ))}

            {previewLinks.length === 0 && (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No Preview Links</p>
                <p className="text-sm text-muted-foreground">
                  Generate your first preview link to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Email Preview
              </CardTitle>
              
              <div className="flex gap-1">
                <Button
                  variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedDevice === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDevice('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedDevice === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedPreviewData ? (
              <div className="space-y-4">
                {/* Preview URL */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-xs font-medium">Preview URL:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-white p-2 rounded border">
                      {selectedPreviewData.url}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPreviewLink(selectedPreviewData.url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Email Preview */}
                <div className={`transition-all duration-300 ${getDeviceClass()}`}>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    {/* Email Header */}
                    <div className="bg-gray-100 p-3 border-b">
                      <div className="text-sm">
                        <div><strong>Subject:</strong> {selectedPreviewData.subject}</div>
                        <div><strong>From:</strong> Backlink ∞ &lt;noreply@backlinkoo.com&gt;</div>
                      </div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="p-4">
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedPreviewData.emailContent }}
                        className="prose prose-sm max-w-none"
                      />
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <Label className="text-sm font-medium">QR Code for Mobile Testing:</Label>
                  <div className="mt-2">
                    <img
                      src={generateQRCode(selectedPreviewData.url)}
                      alt="QR Code"
                      className="mx-auto w-32 h-32 border rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Scan with mobile device to test email
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedPreviewData.url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => sharePreviewLink(selectedPreviewData.url, selectedPreviewData.title)}
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a Preview Link</p>
                <p className="text-sm text-muted-foreground">
                  Choose a preview link from the list to see the email preview
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
