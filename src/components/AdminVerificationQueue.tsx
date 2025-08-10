import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ExternalLink,
  FileText,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar
} from "lucide-react";
import { NoHandsSEOVerificationService } from "@/services/noHandsSEOVerification";
import { useToast } from "@/hooks/use-toast";

interface PendingCampaign {
  id: string;
  name: string;
  target_url: string;
  keywords: string[] | string;
  verification_notes?: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
  };
}

const AdminVerificationQueue = () => {
  const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<PendingCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    avgVerificationTime: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCampaigns();
    fetchMetrics();
  }, []);

  const fetchPendingCampaigns = async () => {
    setIsLoading(true);
    try {
      const campaigns = await NoHandsSEOVerificationService.getPendingVerifications();
      setPendingCampaigns(campaigns);
    } catch (error) {
      console.error('Error fetching pending campaigns:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      toast({
        title: "Error",
        description: "Failed to fetch pending campaigns.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const metricsData = await NoHandsSEOVerificationService.getVerificationMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleApprove = async (campaignId: string) => {
    setIsProcessing(true);
    try {
      const success = await NoHandsSEOVerificationService.approveCampaign(campaignId, verificationNotes);
      if (success) {
        toast({
          title: "Campaign Approved",
          description: "The campaign has been approved and will begin processing.",
        });
        setSelectedCampaign(null);
        setVerificationNotes("");
        fetchPendingCampaigns();
        fetchMetrics();
      } else {
        throw new Error("Failed to approve campaign");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (campaignId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this campaign.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await NoHandsSEOVerificationService.rejectCampaign(campaignId, rejectionReason);
      if (success) {
        toast({
          title: "Campaign Rejected",
          description: "The campaign has been rejected and the user has been notified.",
        });
        setSelectedCampaign(null);
        setRejectionReason("");
        fetchPendingCampaigns();
        fetchMetrics();
      } else {
        throw new Error("Failed to reject campaign");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Backlink ∞ Automation Link Building (beta) Verification Queue</h2>
            <p className="text-muted-foreground">Review and approve campaign submissions</p>
          </div>
        </div>
        <Button onClick={fetchPendingCampaigns} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Time</span>
            </div>
            <div className="text-2xl font-bold mt-1">{Math.round(metrics.avgVerificationTime)}h</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Verification Queue</TabsTrigger>
          <TabsTrigger value="review">Campaign Review</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : pendingCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingCampaigns.map((campaign) => (
                <Card key={campaign.id} className="transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                            Pending Review
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(campaign.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span>Target URL</span>
                        </div>
                        <p className="font-medium truncate mt-1">{campaign.target_url}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Customer</span>
                        </div>
                        <p className="font-medium mt-1">{campaign.profiles.email}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Keywords</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(campaign.keywords) ? campaign.keywords : [campaign.keywords])
                            .slice(0, 3).map((keyword: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {campaign.verification_notes && (
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>Campaign Notes</span>
                          </div>
                          <p className="text-sm bg-muted p-2 rounded mt-1">
                            {campaign.verification_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedCampaign(campaign)}
                        className="flex-1"
                      >
                        Review Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Verifications</h3>
                <p className="text-muted-foreground">
                  All Backlink ∞ Automation Link Building (beta) campaigns have been reviewed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {selectedCampaign ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Campaign Name</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">{selectedCampaign.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Target URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm bg-muted p-2 rounded flex-1">{selectedCampaign.target_url}</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedCampaign.target_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Target Keywords</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(selectedCampaign.keywords) ? selectedCampaign.keywords : [selectedCampaign.keywords])
                        .map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Customer Email</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">{selectedCampaign.profiles.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Submitted</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">{formatTimeAgo(selectedCampaign.created_at)}</p>
                  </div>

                  {selectedCampaign.verification_notes && (
                    <div>
                      <Label className="text-sm font-medium">Customer Notes</Label>
                      <p className="text-sm bg-muted p-2 rounded mt-1">{selectedCampaign.verification_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verification Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Approval Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <Label className="text-base font-medium">Approve Campaign</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="approvalNotes" className="text-sm">Internal Notes (Optional)</Label>
                      <Textarea
                        id="approvalNotes"
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder="Add any internal notes about this approval..."
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => handleApprove(selectedCampaign.id)}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Campaign
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <Label className="text-base font-medium">Reject Campaign</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="rejectionReason" className="text-sm">Rejection Reason *</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a clear reason for rejection that will be sent to the customer..."
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <Button 
                      variant="destructive"
                      onClick={() => handleReject(selectedCampaign.id)}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="w-full mt-3"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Campaign
                    </Button>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      The customer will be automatically notified of your decision via email.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Campaign to Review</h3>
                <p className="text-muted-foreground">
                  Choose a campaign from the queue to begin the verification process.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVerificationQueue;
