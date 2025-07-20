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
    name: "",
    targetUrl: "",
    keywords: "",
    linksRequested: 5
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Please log in to create a campaign");
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

      // Parse keywords into array
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Create campaign
      const { error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: formData.name,
          target_url: formData.targetUrl,
          keywords: keywordsArray,
          links_requested: formData.linksRequested,
          status: 'pending'
        });

      if (campaignError) {
        throw campaignError;
      }

      // Deduct credits
      const { error: updateCreditsError } = await supabase
        .from('credits')
        .update({ 
          amount: creditsData.amount - formData.linksRequested,
          total_used: (creditsData.amount - formData.linksRequested)
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
          amount: -formData.linksRequested,
          type: 'campaign_creation',
          description: `Campaign: ${formData.name}`
        });

      toast({
        title: "Campaign Created",
        description: `Your campaign "${formData.name}" has been created successfully.`,
      });

      // Reset form
      setFormData({
        name: "",
        targetUrl: "",
        keywords: "",
        linksRequested: 5
      });

      onSuccess?.();
    } catch (error) {
      console.error('Campaign creation error:', error);
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
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q1 2024 Blog Outreach"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target URL</Label>
            <Input
              id="targetUrl"
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              placeholder="https://example.com/page"
              required
            />
            <p className="text-xs text-muted-foreground">
              The page you want to build backlinks to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords</Label>
            <Textarea
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="SEO tools, backlink building, digital marketing"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas. These will be used as anchor text.
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
              Each backlink costs 1 credit. Quality high-authority links.
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
                  Create Campaign ({formData.linksRequested} credits)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};