import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SavedBacklinkReportsService, type SavedBacklinkReport } from '@/services/savedBacklinkReportsService';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from '@/components/LoginModal';
import { Trash2, ExternalLink, Eye, Calendar, Target, Link2, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SavedBacklinkReports() {
  const [reports, setReports] = useState<SavedBacklinkReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);

  const loadReports = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await SavedBacklinkReportsService.getUserReports();
      setReports(data);

      // Check if any reports are from localStorage
      const hasLocalReports = data.some(report => report.id.startsWith('local_'));
      setIsUsingLocalStorage(hasLocalReports);
    } catch (error) {
      console.error('Error loading saved reports:', error);
      toast({
        title: 'Failed to Load Reports',
        description: error instanceof Error ? error.message : 'Unable to load your saved reports.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [isAuthenticated]);

  const handleDeleteReport = async (reportId: string) => {
    setIsDeleting(reportId);
    try {
      await SavedBacklinkReportsService.deleteReport(reportId);
      setReports(reports.filter(report => report.id !== reportId));
      toast({
        title: 'Report Deleted',
        description: 'The backlink report has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete the report.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewReport = (report: SavedBacklinkReport) => {
    const reportData = report.report_data as any;
    if (reportData && reportData.id) {
      const reportUrl = SavedBacklinkReportsService.generateReportUrl(reportData);
      window.open(reportUrl, '_blank');
    } else {
      toast({
        title: 'Unable to View Report',
        description: 'This report cannot be viewed because the data is incomplete.',
        variant: 'destructive'
      });
    }
  };

  const getVerificationRate = (report: SavedBacklinkReport): number => {
    const summary = report.report_summary as any;
    return summary?.verificationRate || 0;
  };

  const getStatusColor = (rate: number): string => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Saved Backlink Reports</CardTitle>
            <CardDescription>
              Sign in to view and manage your saved backlink verification reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Sign In to View Reports
            </Button>
          </CardContent>
        </Card>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onAuthSuccess={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Loading your saved reports...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">No Saved Reports</CardTitle>
            <CardDescription>
              You haven't saved any backlink reports yet. Create a report from the Backlink Reports page to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/backlink-report'}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Create Your First Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Backlink Reports</h1>
        <p className="text-gray-600">
          Manage and view your saved backlink verification reports. Total: {reports.length} report{reports.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const verificationRate = getVerificationRate(report);
          const statusColor = getStatusColor(verificationRate);
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-1 truncate">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </div>
                    </CardDescription>
                  </div>
                  <Badge className={`${statusColor} shrink-0`}>
                    {verificationRate.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Report Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Keyword:</span>
                      <span className="font-medium truncate">{report.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Anchor:</span>
                      <span className="font-medium truncate">{report.anchor_text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Results:</span>
                      <span className="font-medium">
                        {report.verified_backlinks}/{report.total_urls} verified
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleViewReport(report)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={isDeleting === report.id}
                        >
                          {isDeleting === report.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{report.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReport(report.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
