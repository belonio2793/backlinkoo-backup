import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X } from "lucide-react";

interface CampaignFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CampaignForm = ({ onSuccess, onCancel }: CampaignFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    targetUrls: [""],
    keywords: [""],
    linksRequested: 5
  });
  const { toast } = useToast();

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    
    // If it doesn't start with http:// or https://, add https://
    if (!normalized.match(/^https?:\/\//)) {
      // Remove www. if it's at the beginning
      if (normalized.startsWith('www.')) {
        normalized = normalized.substring(4);
      }
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  };

  const addTargetUrl = () => {
    if (formData.targetUrls.length < 10) {
      setFormData({ ...formData, targetUrls: [...formData.targetUrls, ""] });
    }
  };

  const removeTargetUrl = (index: number) => {
    const newUrls = formData.targetUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, targetUrls: newUrls });
  };

  const updateTargetUrl = (index: number, value: string) => {
    const newUrls = [...formData.targetUrls];
    newUrls[index] = value;
    setFormData({ ...formData, targetUrls: newUrls });
  };

  const addKeyword = () => {
    if (formData.keywords.length < 5) {
      setFormData({ ...formData, keywords: [...formData.keywords, ""] });
    }
  };

  const removeKeyword = (index: number) => {
    const newKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData({ ...formData, keywords: newKeywords });
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...formData.keywords];
    newKeywords[index] = value;
    setFormData({ ...formData, keywords: newKeywords });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Please log in to create a campaign");
      }

      // Validate and normalize URLs
      const validUrls = formData.targetUrls
        .filter(url => url.trim())
        .map(url => normalizeUrl(url));

      if (validUrls.length === 0) {
        throw new Error("Please provide at least one target URL");
      }

      // Check if user has enough credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single();

      if (creditsError) {
        throw new Error("Error checking credits");
      }

      if (!creditsData || creditsData.amount < formData.linksRequested) {
        throw new Error(`Insufficient credits. You need ${formData.linksRequested} credits but only have ${creditsData?.amount || 0}`);
      }

      // Filter out empty keywords
      const keywordsArray = formData.keywords
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Create campaigns for each URL
      for (const url of validUrls) {
        const { error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            name: `Campaign for ${url}`,
            target_url: url,
            keywords: keywordsArray,
            links_requested: formData.linksRequested,
            status: 'pending'
          });

        if (campaignError) {
          throw campaignError;
        }
      }

      // Deduct credits (total for all campaigns)
      const totalCredits = formData.linksRequested * validUrls.length;
      const { error: updateCreditsError } = await supabase
        .from('credits')
        .update({ 
          amount: creditsData.amount - totalCredits,
          total_used: (creditsData.amount - totalCredits)
        })
        .eq('user_id', user.id);

      if (updateCreditsError) {
        throw updateCreditsError;
      }

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -totalCredits,
          type: 'campaign_creation',
          description: `Campaigns for ${validUrls.length} URL(s)`
        });

      toast({
        title: "Campaign(s) Created",
        description: `${validUrls.length} campaign(s) created successfully.`,
      });

      // Reset form
      setFormData({
        targetUrls: [""],
        keywords: [""],
        linksRequested: 5
      });

      onSuccess?.();
    } catch (error) {
      console.error('Campaign creation error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Campaign
          </span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Target URLs</Label>
            {formData.targetUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateTargetUrl(index, e.target.value)}
                  placeholder="example.com, www.example.com, https://example.com"
                  required={index === 0}
                  className="flex-1"
                />
                {formData.targetUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTargetUrl(index)}
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
              onClick={addTargetUrl}
              className="w-full"
              disabled={formData.targetUrls.length >= 10}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another URL ({formData.targetUrls.length}/10)
            </Button>
            <p className="text-xs text-muted-foreground">
              The pages you want to build backlinks to. All URL formats accepted. Maximum 10 URLs.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target Keywords</Label>
            {formData.keywords.map((keyword, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={keyword}
                  onChange={(e) => updateKeyword(index, e.target.value)}
                  placeholder="∞"
                  required={index === 0}
                  className="flex-1"
                />
                {formData.keywords.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
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
              disabled={formData.keywords.length >= 5}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Keyword ({formData.keywords.length}/5)
            </Button>
            <p className="text-xs text-muted-foreground">
              Keywords will be used as anchor text. Maximum 5 keywords per campaign.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linksRequested">Number of Backlinks</Label>
            <Input
              id="linksRequested"
              type="number"
              min="1"
              max="100"
              value={formData.linksRequested}
              onChange={(e) => setFormData({ ...formData, linksRequested: parseInt(e.target.value) || 5 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Each backlink costs 1 credit.
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  Create Campaign ({formData.linksRequested * formData.targetUrls.filter(url => url.trim()).length} credits)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
