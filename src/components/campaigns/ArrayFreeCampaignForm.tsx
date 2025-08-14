/**
 * Array-Free Campaign Form
 * Simple form without array dependencies for reliable campaign creation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { arrayFreeCampaignService, ArrayFreeCampaign } from '@/services/arrayFreeCampaignService';
import { useAuth } from '@/hooks/useAuth';

interface ArrayFreeCampaignFormProps {
  onSuccess?: (campaign: ArrayFreeCampaign) => void;
  onCancel?: () => void;
}

export function ArrayFreeCampaignForm({ onSuccess, onCancel }: ArrayFreeCampaignFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simple form state without arrays
  const [formData, setFormData] = useState({
    name: '',
    primaryKeyword: '',
    secondaryKeywords: '', // Comma-separated string
    primaryAnchorText: '',
    alternateAnchors: '', // Comma-separated string
    targetUrl: '',
    linksRequested: 5,
    autoStart: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validation without array complexity
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    
    if (!formData.primaryKeyword.trim()) {
      newErrors.primaryKeyword = 'Primary keyword is required';
    }
    
    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = 'Target URL is required';
    } else {
      try {
        new URL(formData.targetUrl);
      } catch {
        newErrors.targetUrl = 'Please enter a valid URL';
      }
    }
    
    if (formData.linksRequested < 1 || formData.linksRequested > 50) {
      newErrors.linksRequested = 'Links requested must be between 1 and 50';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create campaigns');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare campaign data
      const campaignData: Omit<ArrayFreeCampaign, 'id' | 'created_at'> = {
        user_id: user.id,
        name: formData.name.trim(),
        status: formData.autoStart ? 'pending' : 'draft',
        primary_keyword: formData.primaryKeyword.trim(),
        secondary_keywords_text: formData.secondaryKeywords.trim(),
        primary_anchor_text: formData.primaryAnchorText.trim() || formData.primaryKeyword.trim(),
        alternate_anchors_text: formData.alternateAnchors.trim(),
        target_url: formData.targetUrl.trim(),
        sites_contacted: 0,
        links_built: 0,
        sites_used_text: '',
        campaign_metadata: JSON.stringify({
          created_via: 'array_free_form',
          form_version: '1.0'
        }),
        links_requested: formData.linksRequested,
        auto_start: formData.autoStart
      };
      
      const result = await arrayFreeCampaignService.createCampaign(campaignData);
      
      if (result.success && result.campaign) {
        toast.success('Campaign created successfully!');
        onSuccess?.(result.campaign);
        
        // Reset form
        setFormData({
          name: '',
          primaryKeyword: '',
          secondaryKeywords: '',
          primaryAnchorText: '',
          alternateAnchors: '',
          targetUrl: '',
          linksRequested: 5,
          autoStart: false
        });
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
        <CardDescription>
          Simple campaign creation without complex data structures
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter campaign name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          {/* Primary Keyword */}
          <div className="space-y-2">
            <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
            <Input
              id="primaryKeyword"
              value={formData.primaryKeyword}
              onChange={(e) => handleInputChange('primaryKeyword', e.target.value)}
              placeholder="e.g., 'link building'"
              className={errors.primaryKeyword ? 'border-red-500' : ''}
            />
            {errors.primaryKeyword && <p className="text-sm text-red-500">{errors.primaryKeyword}</p>}
            <p className="text-sm text-gray-500">
              This will be your main target keyword for the campaign
            </p>
          </div>
          
          {/* Secondary Keywords */}
          <div className="space-y-2">
            <Label htmlFor="secondaryKeywords">Secondary Keywords</Label>
            <Textarea
              id="secondaryKeywords"
              value={formData.secondaryKeywords}
              onChange={(e) => handleInputChange('secondaryKeywords', e.target.value)}
              placeholder="SEO tools, backlink building, content marketing"
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Separate multiple keywords with commas (optional)
            </p>
          </div>
          
          {/* Target URL */}
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target URL *</Label>
            <Input
              id="targetUrl"
              type="url"
              value={formData.targetUrl}
              onChange={(e) => handleInputChange('targetUrl', e.target.value)}
              placeholder="https://example.com/page"
              className={errors.targetUrl ? 'border-red-500' : ''}
            />
            {errors.targetUrl && <p className="text-sm text-red-500">{errors.targetUrl}</p>}
          </div>
          
          {/* Primary Anchor Text */}
          <div className="space-y-2">
            <Label htmlFor="primaryAnchorText">Primary Anchor Text</Label>
            <Input
              id="primaryAnchorText"
              value={formData.primaryAnchorText}
              onChange={(e) => handleInputChange('primaryAnchorText', e.target.value)}
              placeholder="Will use primary keyword if empty"
            />
            <p className="text-sm text-gray-500">
              Main anchor text for links (defaults to primary keyword)
            </p>
          </div>
          
          {/* Alternate Anchor Texts */}
          <div className="space-y-2">
            <Label htmlFor="alternateAnchors">Alternate Anchor Texts</Label>
            <Textarea
              id="alternateAnchors"
              value={formData.alternateAnchors}
              onChange={(e) => handleInputChange('alternateAnchors', e.target.value)}
              placeholder="click here, learn more, read more"
              rows={2}
            />
            <p className="text-sm text-gray-500">
              Separate multiple anchor texts with commas (optional)
            </p>
          </div>
          
          {/* Links Requested */}
          <div className="space-y-2">
            <Label htmlFor="linksRequested">Links Requested</Label>
            <Input
              id="linksRequested"
              type="number"
              min="1"
              max="50"
              value={formData.linksRequested}
              onChange={(e) => handleInputChange('linksRequested', parseInt(e.target.value) || 5)}
              className={errors.linksRequested ? 'border-red-500' : ''}
            />
            {errors.linksRequested && <p className="text-sm text-red-500">{errors.linksRequested}</p>}
          </div>
          
          {/* Auto Start */}
          <div className="flex items-center space-x-2">
            <Switch
              id="autoStart"
              checked={formData.autoStart}
              onCheckedChange={(checked) => handleInputChange('autoStart', checked)}
            />
            <Label htmlFor="autoStart">Start campaign automatically</Label>
          </div>
          
          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
          
        </form>
      </CardContent>
    </Card>
  );
}

export default ArrayFreeCampaignForm;
