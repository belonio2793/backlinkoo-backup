import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  X, 
  Globe, 
  Target, 
  Hash,
  Play,
  Pause,
  Settings
} from 'lucide-react';

export interface Campaign {
  id: string;
  name: string;
  targetUrl: string;
  keywords: string[];
  anchorTexts: string[];
  status: 'active' | 'paused' | 'draft';
  engine: string;
  createdAt: Date;
  linksBuilt: number;
  dailyLimit: number;
  autoStart: boolean;
}

interface CampaignFormProps {
  engineName: string;
  engineIcon: React.ReactNode;
  onCreateCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'linksBuilt'>) => void;
  activeCampaigns: Campaign[];
  onToggleCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
}

export function CampaignForm({ 
  engineName, 
  engineIcon, 
  onCreateCampaign, 
  activeCampaigns,
  onToggleCampaign,
  onDeleteCampaign 
}: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    targetUrl: '',
    keywords: [''],
    anchorTexts: [''],
    dailyLimit: 10,
    autoStart: false
  });

  const addKeyword = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, '']
    }));
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) => i === index ? value : keyword)
    }));
  };

  const addAnchorText = () => {
    setFormData(prev => ({
      ...prev,
      anchorTexts: [...prev.anchorTexts, '']
    }));
  };

  const removeAnchorText = (index: number) => {
    setFormData(prev => ({
      ...prev,
      anchorTexts: prev.anchorTexts.filter((_, i) => i !== index)
    }));
  };

  const updateAnchorText = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      anchorTexts: prev.anchorTexts.map((anchor, i) => i === index ? value : anchor)
    }));
  };

  // Auto-format URL to include https://
  const formatUrl = (url: string) => {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const handleUrlChange = (value: string) => {
    const formattedUrl = formatUrl(value);
    setFormData(prev => ({ ...prev, targetUrl: formattedUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredKeywords = formData.keywords.filter(k => k.trim());
    const filteredAnchorTexts = formData.anchorTexts.filter(a => a.trim());

    if (!formData.name || !formData.targetUrl || filteredKeywords.length === 0 || filteredAnchorTexts.length === 0) {
      return;
    }

    onCreateCampaign({
      name: formData.name,
      targetUrl: formData.targetUrl,
      keywords: filteredKeywords,
      anchorTexts: filteredAnchorTexts,
      status: formData.autoStart ? 'active' : 'draft',
      engine: engineName,
      dailyLimit: formData.dailyLimit,
      autoStart: formData.autoStart
    });

    // Reset form
    setFormData({
      name: '',
      targetUrl: '',
      keywords: [''],
      anchorTexts: [''],
      dailyLimit: 10,
      autoStart: false
    });
  };

  const engineCampaigns = activeCampaigns.filter(campaign => campaign.engine === engineName);

  return (
    <div className="space-y-6">
      {/* Active Campaigns */}
      {engineCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {engineIcon}
              Active {engineName} Campaigns ({engineCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engineCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'paused' ? 'secondary' : 'outline'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {campaign.targetUrl}
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        {campaign.keywords.slice(0, 3).join(', ')}
                        {campaign.keywords.length > 3 && ` +${campaign.keywords.length - 3} more`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        {campaign.linksBuilt} links built • {campaign.dailyLimit} daily limit
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleCampaign(campaign.id)}
                    >
                      {campaign.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteCampaign(campaign.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New {engineName} Campaign
          </CardTitle>
          <CardDescription>
            Set up a new automated campaign for {engineName.toLowerCase()} backlink building
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., My Website Blog Comments"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="target-url">Target Website URL</Label>
              <Input
                id="target-url"
                type="url"
                placeholder="yourwebsite.com (https:// will be added automatically)"
                value={formData.targetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                URLs will automatically be formatted to include https://
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Target Keywords</Label>
              <div className="space-y-2">
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Enter keyword"
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                      required={index === 0}
                    />
                    {formData.keywords.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyword}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </Button>
              </div>
            </div>

            {/* Anchor Texts */}
            <div className="space-y-2">
              <Label>Anchor Texts</Label>
              <div className="space-y-2">
                {formData.anchorTexts.map((anchorText, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Enter anchor text"
                      value={anchorText}
                      onChange={(e) => updateAnchorText(index, e.target.value)}
                      required={index === 0}
                    />
                    {formData.anchorTexts.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAnchorText(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnchorText}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Anchor Text
                </Button>
              </div>
            </div>

            <Separator />

            {/* Campaign Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Campaign Settings
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Link Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Auto-start Campaign</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.autoStart}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoStart: checked }))}
                    />
                    <Label className="text-sm text-muted-foreground">
                      Start immediately after creation
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
