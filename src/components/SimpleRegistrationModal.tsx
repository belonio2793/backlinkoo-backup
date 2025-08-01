import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthFormTabs } from "@/components/shared/AuthFormTabs";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle2, Star, Zap, Shield, TrendingUp, Save, Globe, BarChart3 } from "lucide-react";

interface SimpleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => void;
  postTitle?: string;
  trigger?: 'save_post' | 'general';
}

export function SimpleRegistrationModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess,
  postTitle,
  trigger = 'general'
}: SimpleRegistrationModalProps) {
  const handleAuthSuccess = (user: any) => {
    onAuthSuccess?.(user);
    onClose();
  };

  const features = [
    { icon: Save, title: "Save Posts Forever", desc: "Never lose your content" },
    { icon: BarChart3, title: "Advanced Analytics", desc: "Track performance" },
    { icon: Zap, title: "Priority Generation", desc: "Faster AI models" },
    { icon: Globe, title: "Custom Domains", desc: "Better SEO" },
    { icon: Shield, title: "No Ads", desc: "Clean experience" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            {trigger === 'save_post' ? 'Save Your Post Forever!' : 'Join Backlink ∞'}
          </DialogTitle>
          {postTitle && (
            <p className="text-sm text-muted-foreground">
              Create a free account to save <strong>"{postTitle}"</strong> permanently.
            </p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <AuthFormTabs
              onAuthSuccess={handleAuthSuccess}
              defaultTab="signup"
              isCompact={true}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm">100% Free Account</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">What You'll Get:</h4>
              <div className="space-y-2">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <feature.icon className="h-3 w-3 text-purple-600" />
                    <span className="font-medium">{feature.title}</span>
                    <span className="text-muted-foreground">• {feature.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-4 text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>500% traffic boost</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>50+ backlinks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>98% satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
