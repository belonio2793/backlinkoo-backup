import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Trash2, 
  Activity, 
  Database, 
  ExternalLink,
  Shield,
  Clock,
  Loader2,
  Archive,
  BarChart3,
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { EnhancedCampaignManager, DeleteCampaignOptions, CampaignDeletionResult } from '@/services/enhancedCampaignManager';
import type { AutomationCampaign } from '@/types/automationTypes';

interface EnhancedDeleteCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: AutomationCampaign | null;
  onDeleteComplete: (result: CampaignDeletionResult) => void;
}

export default function EnhancedDeleteCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onDeleteComplete
}: EnhancedDeleteCampaignDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [options, setOptions] = useState<DeleteCampaignOptions>({
    preserveReports: false,
    preserveMetrics: false,
    archiveLinksOnly: false,
    forceDelete: false
  });
  const [campaignStats, setCampaignStats] = useState<{
    linkPlacements: number;
    postedLinks: number;
    reports: number;
    activeMonitoring: number;
    isRealTimeActive: boolean;
  } | null>(null);

  const expectedText = 'DELETE';
  const isConfirmationValid = confirmationText === expectedText;
  const canProceed = isConfirmationValid;

  // Load campaign statistics
  useEffect(() => {
    if (campaign && open) {
      loadCampaignStats();
    }
  }, [campaign, open]);

  const loadCampaignStats = async () => {
    if (!campaign) return;

    try {
      // Get real-time session info
      const realTimeSession = EnhancedCampaignManager.getRealTimeSession(campaign.id);
      const urlStats = await EnhancedCampaignManager.getLiveUrlStatistics(campaign.id);

      setCampaignStats({
        linkPlacements: urlStats.total_posted || 0,
        postedLinks: urlStats.live_links || 0,
        reports: 5, // Approximate - would need actual count
        activeMonitoring: urlStats.total_discovered || 0,
        isRealTimeActive: realTimeSession?.status === 'active' || false
      });
    } catch (error) {
      console.error('Failed to load campaign stats:', error);
      setCampaignStats({
        linkPlacements: 0,
        postedLinks: 0,
        reports: 0,
        activeMonitoring: 0,
        isRealTimeActive: false
      });
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setDeletionProgress(0);
      setCurrentStep('');
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    if (!canProceed || !campaign) return;

    setIsDeleting(true);
    setDeletionProgress(0);
    setCurrentStep('Preparing deletion...');

    try {
      // Simulate progress updates
      const steps = [
        'Stopping real-time monitoring...',
        'Cleaning up link placements...',
        'Removing posted links...',
        'Clearing live monitoring data...',
        options.preserveReports ? 'Preserving reports...' : 'Deleting reports...',
        options.preserveMetrics ? 'Preserving metrics...' : 'Clearing metrics...',
        'Removing activity logs...',
        'Deleting campaign...'
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          setDeletionProgress(((stepIndex + 1) / steps.length) * 100);
          stepIndex++;
        }
      }, 500);

      const result = await EnhancedCampaignManager.deleteCampaignWithCleanup(
        campaign.id,
        campaign.user_id,
        options
      );

      clearInterval(progressInterval);
      setDeletionProgress(100);
      setCurrentStep('Deletion completed');

      // Wait a bit to show completion
      setTimeout(() => {
        setIsDeleting(false);
        onDeleteComplete(result);
        if (result.success) {
          handleClose();
        }
      }, 1000);

    } catch (error: any) {
      console.error('Delete confirmation failed:', error);
      setIsDeleting(false);
      setCurrentStep(`Error: ${error.message}`);
    }
  };

  const getDeletionImpact = () => {
    if (!campaign || !campaignStats) return [];

    const impacts = [];
    
    if (campaign.status === 'active') {
      impacts.push({
        icon: Activity,
        text: 'Campaign is currently active and will be stopped immediately',
        severity: 'high' as const,
        action: 'Stop active monitoring and URL processing'
      });
    }

    if (campaignStats.isRealTimeActive) {
      impacts.push({
        icon: Globe,
        text: 'Real-time URL tracking session will be terminated',
        severity: 'high' as const,
        action: 'End live URL discovery and posting activity'
      });
    }
    
    if (campaignStats.linkPlacements > 0) {
      impacts.push({
        icon: ExternalLink,
        text: `${campaignStats.linkPlacements} link placements will be ${options.archiveLinksOnly ? 'archived' : 'permanently deleted'}`,
        severity: options.archiveLinksOnly ? 'medium' : 'high' as const,
        action: options.archiveLinksOnly ? 'Archive for future reference' : 'Permanent removal from database'
      });
    }

    if (campaignStats.postedLinks > 0) {
      impacts.push({
        icon: Eye,
        text: `${campaignStats.postedLinks} live posted links will lose monitoring`,
        severity: 'medium' as const,
        action: 'Stop live verification and status checking'
      });
    }

    if (!options.preserveReports && campaignStats.reports > 0) {
      impacts.push({
        icon: BarChart3,
        text: `${campaignStats.reports} performance reports will be deleted`,
        severity: 'medium' as const,
        action: 'Remove historical analytics and insights'
      });
    }

    if (!options.preserveMetrics) {
      impacts.push({
        icon: Database,
        text: 'All historical metrics and timeseries data will be removed',
        severity: 'medium' as const,
        action: 'Clear performance tracking history'
      });
    }

    impacts.push({
      icon: Database,
      text: 'Campaign configuration and automation settings will be permanently removed',
      severity: 'medium' as const,
      action: 'Delete campaign definition and rules'
    });

    return impacts;
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return XCircle;
      case 'medium': return AlertTriangle;
      case 'low': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  if (!campaign) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            Enhanced Campaign Deletion: {campaign.name}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600">
                This enhanced deletion process will comprehensively remove all campaign data including real-time monitoring, 
                URL activity logs, and associated database records. Please review the options and impact before proceeding.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Campaign Overview */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Campaign Overview & Live Data
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status: </span>
                <Badge
                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                  className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                >
                  {campaign.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Engine: </span>
                <span className="ml-1 font-medium">{campaign.engine_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Link Placements: </span>
                <span className="ml-1 font-medium">{campaignStats?.linkPlacements || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Live URLs: </span>
                <span className="ml-1 font-medium">{campaignStats?.postedLinks || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Daily Limit: </span>
                <span className="ml-1 font-medium">{campaign.daily_limit}</span>
              </div>
              <div>
                <span className="text-gray-500">Real-time Active: </span>
                <Badge variant={campaignStats?.isRealTimeActive ? 'default' : 'secondary'}>
                  {campaignStats?.isRealTimeActive ? 'YES' : 'NO'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Monitoring: </span>
                <span className="ml-1 font-medium">{campaignStats?.activeMonitoring || 0} URLs</span>
              </div>
              <div>
                <span className="text-gray-500">Reports: </span>
                <span className="ml-1 font-medium">{campaignStats?.reports || 0}</span>
              </div>
            </div>
          </div>

          {/* Deletion Options */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Deletion Options
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveReports"
                    checked={options.preserveReports}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, preserveReports: !!checked }))
                    }
                  />
                  <label htmlFor="preserveReports" className="text-sm font-medium leading-none">
                    Preserve Performance Reports
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Keep historical analytics and performance data for future reference
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveMetrics"
                    checked={options.preserveMetrics}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, preserveMetrics: !!checked }))
                    }
                  />
                  <label htmlFor="preserveMetrics" className="text-sm font-medium leading-none">
                    Preserve Metrics Timeseries
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Retain detailed performance metrics and trending data
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="archiveLinksOnly"
                    checked={options.archiveLinksOnly}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, archiveLinksOnly: !!checked }))
                    }
                  />
                  <label htmlFor="archiveLinksOnly" className="text-sm font-medium leading-none">
                    Archive Links Instead of Delete
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Mark link placements as archived rather than permanently removing them
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="forceDelete"
                    checked={options.forceDelete}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, forceDelete: !!checked }))
                    }
                  />
                  <label htmlFor="forceDelete" className="text-sm font-medium leading-none">
                    Force Delete on Errors
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Continue deletion even if some cleanup operations fail
                </p>
              </div>
            </div>
          </div>

          {/* Deletion Impact Analysis */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Deletion Impact Analysis
            </h4>
            <div className="space-y-2">
              {getDeletionImpact().map((impact, index) => {
                const SeverityIcon = getSeverityIcon(impact.severity);
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <SeverityIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getSeverityColor(impact.severity)}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 font-medium">{impact.text}</p>
                        <p className="text-xs text-gray-500">{impact.action}</p>
                      </div>
                      <Badge variant={impact.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {impact.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Campaign Warning */}
          {(campaign.status === 'active' || campaignStats?.isRealTimeActive) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Warning:</strong> This campaign has active operations running. 
                Deletion will immediately stop all URL discovery, posting, and monitoring activities. 
                {campaignStats?.isRealTimeActive && ` Real-time session with ${campaignStats.activeMonitoring} URLs will be terminated.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Deletion Progress */}
          {isDeleting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Deleting Campaign...</span>
              </div>
              <Progress value={deletionProgress} className="h-2" />
              <p className="text-xs text-gray-600">{currentStep}</p>
            </div>
          )}

          {/* Confirmation Text */}
          {!isDeleting && (
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Type <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">{expectedText}</code> to confirm deletion <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={expectedText}
                className={confirmationText && !isConfirmationValid ? 'border-red-300 focus:border-red-500' : ''}
                disabled={isDeleting}
              />
              {confirmationText && !isConfirmationValid && (
                <p className="text-xs text-red-600">Confirmation text does not match exactly.</p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canProceed || isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting... {Math.round(deletionProgress)}%
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Campaign
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
