import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Shield,
  Star,
  Users,
  Link as LinkIcon,
  Infinity,
  ArrowRight,
  Heart,
  BookOpen,
  Globe,
  Loader2
} from "lucide-react";

interface BlogClaimExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
  onLogin: () => void;
  isAuthenticated: boolean;
  isClaiming?: boolean;
}

export const BlogClaimExplanationModal = ({
  isOpen,
  onClose,
  onClaim,
  onLogin,
  isAuthenticated,
  isClaiming = false
}: BlogClaimExplanationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Star className="h-6 w-6 text-white" />
            </div>
            Claim Blog Posts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Infinity className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Save High-Quality Content Forever
            </h3>
            <p className="text-gray-600">
              Claim blog posts to save them permanently in your account and prevent auto-deletion
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              How Blog Post Claiming Works
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trial Posts */}
              <div className="p-4 border border-amber-200 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                    Trial Posts
                  </Badge>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Temporary Content</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Auto-delete after 24 hours</li>
                  <li>• Available for anyone to claim</li>
                  <li>• High-quality AI generated</li>
                  <li>• SEO optimized content</li>
                </ul>
              </div>

              {/* Claimed Posts */}
              <div className="p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Claimed Posts
                  </Badge>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Permanent Content</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Saved forever in your account</li>
                  <li>• No auto-deletion</li>
                  <li>• Listed in your Trial dashboard</li>
                  <li>• Publicly visible on /blog</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Why Claim Blog Posts?
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="p-1 bg-blue-100 rounded">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h6 className="font-medium text-gray-900">Permanent Ownership</h6>
                  <p className="text-sm text-gray-600">Content becomes permanently yours, no expiration</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="p-1 bg-green-100 rounded">
                  <LinkIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h6 className="font-medium text-gray-900">Valuable Backlinks</h6>
                  <p className="text-sm text-gray-600">High-quality, contextual backlinks to boost SEO</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="p-1 bg-purple-100 rounded">
                  <Globe className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h6 className="font-medium text-gray-900">Public Visibility</h6>
                  <p className="text-sm text-gray-600">Content remains live and discoverable</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="p-1 bg-amber-100 rounded">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h6 className="font-medium text-gray-900">Dashboard Management</h6>
                  <p className="text-sm text-gray-600">Track and manage all claimed posts from your dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Claim Limits */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Claim Allowance
            </h5>
            <p className="text-sm text-blue-800">
              Free users can claim up to <strong>3 trial posts</strong>. Premium users get unlimited claiming.
              Each claim saves the post permanently to your account.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={onClaim}
                  disabled={isClaiming}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Claiming Post...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Claim This Blog Post
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  This will permanently save the post to your account
                </p>
              </>
            ) : (
              <>
                <Button
                  onClick={onLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Sign In to Claim Posts
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Create a free account to start claiming high-quality blog posts
                </p>
              </>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
