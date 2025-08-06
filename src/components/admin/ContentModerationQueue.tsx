import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { contentModerationService, type ModerationRequest } from '@/services/contentModerationService';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  FileText,
  Shield,
  BarChart3,
  Filter,
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

export function ContentModerationQueue() {
  const { toast } = useToast();
  
  // State
  const [requests, setRequests] = useState<ModerationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<ModerationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [newRemovalTerms, setNewRemovalTerms] = useState('');
  const [removalCategory, setRemovalCategory] = useState('');
  const [removalList, setRemovalList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRequests, moderationStats, currentRemovalList] = await Promise.all([
        contentModerationService.getPendingModerationRequests(),
        contentModerationService.getModerationStats(7),
        contentModerationService.getRemovalList()
      ]);
      
      setRequests(pendingRequests);
      setStats(moderationStats);
      setRemovalList(currentRemovalList);
    } catch (error) {
      console.error('Failed to load moderation data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      });
      toast({
        title: 'Error',
        description: 'Failed to load moderation data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ModerationRequest) => {
    try {
      const success = await contentModerationService.reviewModerationRequest(
        request.id,
        {
          request_id: request.id,
          decision: 'approve',
          admin_notes: reviewNotes || 'Content approved for publication',
          alternative_suggestions: alternatives ? alternatives.split('\n').filter(s => s.trim()) : undefined,
          reviewed_by: 'admin' // In production, use actual admin ID
        },
        'admin'
      );

      if (success) {
        toast({
          title: 'Request Approved',
          description: 'Content has been approved for publication'
        });
        await loadData();
        setSelectedRequest(null);
        setReviewNotes('');
        setAlternatives('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (request: ModerationRequest) => {
    if (!reviewNotes.trim()) {
      toast({
        title: 'Review Notes Required',
        description: 'Please provide notes explaining why this content was rejected',
        variant: 'destructive'
      });
      return;
    }

    try {
      const success = await contentModerationService.reviewModerationRequest(
        request.id,
        {
          request_id: request.id,
          decision: 'reject',
          admin_notes: reviewNotes,
          alternative_suggestions: alternatives ? alternatives.split('\n').filter(s => s.trim()) : undefined,
          reviewed_by: 'admin'
        },
        'admin'
      );

      if (success) {
        toast({
          title: 'Request Rejected',
          description: 'Content has been rejected'
        });
        await loadData();
        setSelectedRequest(null);
        setReviewNotes('');
        setAlternatives('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive'
      });
    }
  };

  const addToRemovalList = async () => {
    if (!newRemovalTerms.trim() || !removalCategory.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both terms and category',
        variant: 'destructive'
      });
      return;
    }

    try {
      const terms = newRemovalTerms.split(',').map(t => t.trim()).filter(t => t);
      await contentModerationService.addToRemovalList(terms, removalCategory, 'admin');
      
      toast({
        title: 'Terms Added',
        description: `${terms.length} terms added to removal list`
      });
      
      setNewRemovalTerms('');
      setRemovalCategory('');
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add terms to removal list',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.original_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.flagged_terms.some(term => term.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSeverity = severityFilter === '' || request.severity === severityFilter;
    const matchesStatus = statusFilter === '' || request.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            Content Moderation Queue
          </h2>
          <p className="text-gray-600">
            Review, approve, or reject flagged content submissions
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.approvalRate}%</div>
                  <div className="text-sm text-gray-600">Approval Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.autoRejected}</div>
                  <div className="text-sm text-gray-600">Auto-Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search content or flagged terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No requests found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div 
                      key={request.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(request.severity)}>
                            {request.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {request.auto_decision && (
                            <Badge variant="outline" className="bg-gray-100">AUTO</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-800 mb-2 line-clamp-2">
                        {request.original_content}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">Category:</span>
                        <span>{request.category}</span>
                      </div>

                      {request.flagged_terms.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {request.flagged_terms.slice(0, 3).map((term, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {request.flagged_terms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{request.flagged_terms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div>
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Content</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">
                    {selectedRequest.original_content}
                  </div>
                </div>

                {selectedRequest.target_url && (
                  <div>
                    <Label>Target URL</Label>
                    <div className="p-2 bg-gray-50 rounded border text-sm">
                      {selectedRequest.target_url}
                    </div>
                  </div>
                )}

                {selectedRequest.primary_keyword && (
                  <div>
                    <Label>Primary Keyword</Label>
                    <div className="p-2 bg-gray-50 rounded border text-sm">
                      {selectedRequest.primary_keyword}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Flagged Terms</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.flagged_terms.map((term, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reviewNotes">Admin Notes *</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Provide detailed notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="alternatives">Alternative Suggestions (optional)</Label>
                  <Textarea
                    id="alternatives"
                    placeholder="Suggest alternative content ideas (one per line)..."
                    value={alternatives}
                    onChange={(e) => setAlternatives(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleApprove(selectedRequest)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleReject(selectedRequest)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a request to review</p>
              </CardContent>
            </Card>
          )}

          {/* Add to Removal List */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add to Removal List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="removalTerms">Terms (comma-separated)</Label>
                <Input
                  id="removalTerms"
                  placeholder="term1, term2, term3"
                  value={newRemovalTerms}
                  onChange={(e) => setNewRemovalTerms(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="removalCategory">Category</Label>
                <Input
                  id="removalCategory"
                  placeholder="violence, hate_speech, etc."
                  value={removalCategory}
                  onChange={(e) => setRemovalCategory(e.target.value)}
                />
              </div>

              <Button onClick={addToRemovalList} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Terms
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Flagged Terms */}
      {stats?.topFlaggedTerms && stats.topFlaggedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Flagged Terms (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topFlaggedTerms.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                  <span className="text-sm font-medium">{item.term}</span>
                  <Badge variant="destructive">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
