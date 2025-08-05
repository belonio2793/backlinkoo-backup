import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Eye,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Mail,
  Image,
  Link,
  Type,
  Palette,
  Settings,
  Calendar,
  Clock
} from 'lucide-react';

interface EmailComposerProps {
  contactCount: number;
  smtpConfigured: boolean;
  dnsVerified: boolean;
  onCampaignStart: (stats: { sent: number; delivered: number; opened: number; clicked: number }) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  description: string;
}

export function EmailComposer({ contactCount, smtpConfigured, dnsVerified, onCampaignStart }: EmailComposerProps) {
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
    fromName: 'Backlink ∞',
    fromEmail: 'noreply@backlinkoo.com',
    replyTo: 'support@backlinkoo.com'
  });
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const { toast } = useToast();

  const emailTemplates: EmailTemplate[] = [
    {
      id: 'backlink-intro',
      name: 'Backlink ∞ Introduction',
      subject: 'Transform Your SEO with Professional Backlink Services',
      description: 'Introduction to Backlink ∞ services for existing customers',
      content: `
        <h2>Boost Your Website's Authority with Backlink ∞</h2>
        
        <p>Hi {{firstName}},</p>
        
        <p>We're excited to introduce you to <strong>Backlink ∞</strong> – the revolutionary platform that's transforming how businesses approach SEO and link building.</p>
        
        <h3>🚀 What Makes Backlink ∞ Different?</h3>
        <ul>
          <li><strong>AI-Powered Content Generation:</strong> Create high-quality, SEO-optimized blog posts in minutes</li>
          <li><strong>Natural Contextual Links:</strong> Get backlinks that search engines love</li>
          <li><strong>Instant Publishing:</strong> Go live immediately with professional content</li>
          <li><strong>Credit-Based System:</strong> Pay only for what you use, starting at $1.40 per backlink</li>
        </ul>
        
        <h3>💡 Perfect for Your Business</h3>
        <p>Whether you're running an agency, managing multiple clients, or growing your own website, Backlink ∞ provides the scalable solution you need to dominate search rankings.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://backlinkoo.com?utm_source=email&utm_medium=intro&utm_campaign=partner" 
             style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🎯 Start Your Free Trial Today
          </a>
        </div>
        
        <h3>🎁 Exclusive Partner Offer</h3>
        <p>As a valued partner, you get:</p>
        <ul>
          <li>✅ <strong>10 Free Credits</strong> to test the platform</li>
          <li>✅ <strong>Priority Support</strong> from our team</li>
          <li>✅ <strong>Advanced Analytics</strong> dashboard</li>
          <li>✅ <strong>White-label Options</strong> for agencies</li>
        </ul>
        
        <p>Ready to see the difference? <a href="https://backlinkoo.com/email">Try our live demo</a> and generate your first backlink in under 5 minutes.</p>
        
        <p>Best regards,<br>
        The Backlink ∞ Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You're receiving this because you've previously purchased SEO services. 
          <a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://backlinkoo.com">Visit Website</a>
        </p>
      `
    },
    {
      id: 'special-offer',
      name: 'Limited Time Offer',
      subject: '🔥 50% OFF: Professional Backlinks (24 Hours Only)',
      description: 'Promotional email with limited-time discount',
      content: `
        <div style="background: linear-gradient(135deg, #ff6b6b, #ffa726); padding: 20px; text-align: center; color: white; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🔥 FLASH SALE: 50% OFF</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Professional Backlinks - 24 Hours Only!</p>
        </div>
        
        <p>Hi {{firstName}},</p>
        
        <p><strong>This is not a drill!</strong> For the next 24 hours only, get 50% OFF all Backlink ∞ credits.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <h3 style="color: #ff6b6b; margin-top: 0;">⏰ EXPIRES IN: <span id="countdown">23:59:45</span></h3>
          <p style="font-size: 18px; margin: 10px 0;"><s>$1.40</s> <strong style="color: #28a745;">$0.70 per backlink</strong></p>
          <p style="margin-bottom: 0;">That's premium backlinks for less than a cup of coffee!</p>
        </div>
        
        <h3>🎯 What You Get:</h3>
        <ul>
          <li>High-authority domain backlinks (DA 80+)</li>
          <li>AI-generated, contextual content</li>
          <li>Instant publishing and indexing</li>
          <li>Real-time analytics and reporting</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://backlinkoo.com?coupon=FLASH50&utm_source=email&utm_medium=offer" 
             style="background: linear-gradient(135deg, #ff6b6b, #ffa726); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 18px; animation: pulse 2s infinite;">
            🚀 CLAIM 50% OFF NOW
          </a>
        </div>
        
        <p><em>Don't miss out – this offer expires when the timer hits zero!</em></p>
        
        <p>Questions? Just hit reply or <a href="https://backlinkoo.com/support">contact our team</a>.</p>
        
        <p>Best,<br>
        The Backlink ∞ Team</p>
      `
    },
    {
      id: 'case-study',
      name: 'Success Story & Case Study',
      subject: 'How [Client] Increased Organic Traffic 340% in 90 Days',
      description: 'Share success stories and results',
      content: `
        <h2>🚀 Real Results: 340% Traffic Increase in 90 Days</h2>
        
        <p>Hi {{firstName}},</p>
        
        <p>I wanted to share an incredible success story from one of our Backlink ∞ clients that perfectly demonstrates the power of strategic link building.</p>
        
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 10px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: white;">📊 The Results Speak for Themselves:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 36px; font-weight: bold;">340%</div>
              <div>Organic Traffic Increase</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 36px; font-weight: bold;">157%</div>
              <div>Keyword Rankings Boost</div>
            </div>
          </div>
        </div>
        
        <h3>📈 The Strategy That Worked:</h3>
        <ol>
          <li><strong>Quality Over Quantity:</strong> 50 high-authority backlinks from DA 80+ domains</li>
          <li><strong>Content Excellence:</strong> AI-generated, 1500+ word articles with perfect contextual integration</li>
          <li><strong>Diverse Anchor Text:</strong> Natural link profile with branded and long-tail keywords</li>
          <li><strong>Consistent Publishing:</strong> 2-3 new backlinks per week for sustained growth</li>
        </ol>
        
        <blockquote style="border-left: 4px solid #667eea; padding-left: 20px; margin: 30px 0; font-style: italic; color: #555;">
          "Backlink ∞ completely transformed our SEO strategy. The quality of backlinks and the speed of results exceeded all our expectations. We've never seen growth like this before."
          <br><br>
          <strong>— Sarah Chen, Marketing Director</strong>
        </blockquote>
        
        <h3>🎯 Want Similar Results?</h3>
        <p>This success story isn't unique. Our clients consistently see:</p>
        <ul>
          <li>200-400% organic traffic increases within 90 days</li>
          <li>First page rankings for competitive keywords</li>
          <li>Higher domain authority and trust scores</li>
          <li>Increased leads and conversions</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://backlinkoo.com?utm_source=email&utm_medium=case_study" 
             style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📊 Start Your Success Story
          </a>
        </div>
        
        <p>Ready to achieve similar results? <a href="https://backlinkoo.com/demo">Book a free strategy call</a> with our team and let's discuss your goals.</p>
        
        <p>To your success,<br>
        The Backlink ∞ Team</p>
      `
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
      setSelectedTemplate(templateId);
    }
  };

  const canSend = () => {
    return contactCount > 0 && 
           smtpConfigured && 
           dnsVerified && 
           emailData.subject && 
           emailData.content;
  };

  const handleSend = async () => {
    if (!canSend()) {
      toast({
        title: 'Cannot Send Email',
        description: 'Please ensure SMTP is configured, DNS is verified, and you have contacts.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    try {
      // Simulate email sending with progress
      const totalContacts = contactCount;
      const batchSize = Math.max(1, Math.floor(totalContacts / 10));
      
      for (let sent = 0; sent < totalContacts; sent += batchSize) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const currentProgress = Math.min(100, Math.round((sent / totalContacts) * 100));
        setSendProgress(currentProgress);
      }

      setSendProgress(100);

      // Update campaign stats
      onCampaignStart({
        sent: totalContacts,
        delivered: 0,
        opened: 0,
        clicked: 0
      });

      toast({
        title: 'Campaign Started!',
        description: `Email campaign sent to ${totalContacts.toLocaleString()} contacts.`,
      });

      // Reset form
      setEmailData(prev => ({ ...prev, subject: '', content: '' }));
      setSelectedTemplate('');

    } catch (error) {
      toast({
        title: 'Send Failed',
        description: 'Failed to send email campaign. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
      setSendProgress(0);
    }
  };

  const handleSchedule = () => {
    if (!scheduledDate) {
      toast({
        title: 'Date Required',
        description: 'Please select a date and time to schedule the email.',
        variant: 'destructive'
      });
      return;
    }

    setIsScheduled(true);
    toast({
      title: 'Email Scheduled',
      description: `Email campaign scheduled for ${new Date(scheduledDate).toLocaleString()}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Composer</h2>
          <p className="text-muted-foreground">
            Create and send professional email campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {contactCount.toLocaleString()} recipients
          </Badge>
          
          <Badge variant={canSend() ? 'default' : 'secondary'} className="gap-1">
            {canSend() ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {canSend() ? 'Ready to Send' : 'Setup Required'}
          </Badge>
        </div>
      </div>

      {/* Readiness Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Campaign Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${smtpConfigured ? 'bg-green-50' : 'bg-red-50'}`}>
              {smtpConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">SMTP Configuration</p>
                <p className="text-sm text-muted-foreground">
                  {smtpConfigured ? 'Configured' : 'Required'}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg ${dnsVerified ? 'bg-green-50' : 'bg-yellow-50'}`}>
              {dnsVerified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">DNS Verification</p>
                <p className="text-sm text-muted-foreground">
                  {dnsVerified ? 'Verified' : 'Recommended'}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg ${contactCount > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              {contactCount > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">Contact List</p>
                <p className="text-sm text-muted-foreground">
                  {contactCount > 0 ? `${contactCount} contacts` : 'Required'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col gap-2 text-left"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">{template.description}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={emailData.fromName}
                  onChange={(e) => setEmailData(prev => ({ ...prev, fromName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={emailData.fromEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, fromEmail: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your email content (HTML supported)..."
                value={emailData.content}
                onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            {/* Scheduling */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="scheduleDate">Schedule for later (optional)</Label>
                  <Input
                    id="scheduleDate"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSchedule}
                  disabled={!scheduledDate}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`border rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              {/* Email Header */}
              <div className="bg-gray-100 p-4 border-b">
                <div className="text-sm">
                  <div><strong>From:</strong> {emailData.fromName} &lt;{emailData.fromEmail}&gt;</div>
                  <div><strong>Subject:</strong> {emailData.subject || 'No subject'}</div>
                </div>
              </div>
              
              {/* Email Body */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {emailData.content ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: emailData.content.replace(/\{\{firstName\}\}/g, 'John')
                                               .replace(/\{\{unsubscribe_url\}\}/g, '#unsubscribe')
                    }} 
                    className="prose prose-sm max-w-none"
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a template or start typing to see preview</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending emails...</span>
                <span>{sendProgress}%</span>
              </div>
              <Progress value={sendProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                This may take a few minutes depending on your contact list size.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleSend}
              disabled={!canSend() || isSending}
              className="flex-1"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to {contactCount.toLocaleString()} contacts...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Campaign Now
                </>
              )}
            </Button>
            
            <Button variant="outline" size="lg" disabled={isSending}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>

          {!canSend() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Setup Required:</strong> Please configure SMTP, verify DNS records, and upload contacts before sending.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
