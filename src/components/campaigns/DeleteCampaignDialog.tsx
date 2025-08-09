import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  Activity, 
  Database, 
  ExternalLink,
  Shield,
  Clock,
  Loader2
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped' | 'completed' | 'failed';
  linksGenerated: number;
  linksLive: number;
  progress: number;
  targetUrl: string;
  dailyTarget: number;
  totalTarget: number;
}

interface DeleteCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (campaignId: string, options: DeletionOptions) => Promise<void>;
  campaign: Campaign | null;
  isDeleting?: boolean;
}

interface DeletionOptions {
  forceDelete: boolean;
  confirmationText: string;
}

export default function DeleteCampaignDialog({
  isOpen,
  onClose,
  onConfirm,
  campaign,
  isDeleting = false
}: DeleteCampaignDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [forceDelete, setForceDelete] = useState(false);

  if (!campaign) return null;

  const isActive = campaign.status === 'active';
  const hasGeneratedLinks = campaign.linksGenerated > 0;
  const expectedText = 'delete';
  const isConfirmationValid = confirmationText === expectedText;
  
  const canProceed = isConfirmationValid &&
    (!isActive || (isActive && forceDelete));

  const handleClose = () => {
    // Reset all state when closing
    setConfirmationText('');
    setForceDelete(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!canProceed) return;

    const options: DeletionOptions = {
      forceDelete,
      confirmationText
    };

    try {
      await onConfirm(campaign.id, options);
      handleClose();
    } catch (error) {
      console.error('Delete confirmation failed:', error);
      // Error handling is managed by parent component
    }
  };

  const getDeletionImpact = () => {
    const impacts = [];
    
    if (isActive) {
      impacts.push({
        icon: Activity,
        text: 'Campaign is currently active and will be stopped immediately',
        severity: 'high' as const
      });
    }
    
    if (hasGeneratedLinks) {
      impacts.push({
        icon: ExternalLink,
        text: `${campaign.linksGenerated} generated links will be archived${archiveLinks ? '' : ' (or deleted if unchecked)'}`,
        severity: 'medium' as const
      });
    }
    
    impacts.push({
      icon: Database,
      text: 'All campaign data, analytics, and queue entries will be permanently removed',
      severity: 'medium' as const
    });

    if (campaign.progress > 0 && campaign.progress < 100) {
      impacts.push({
        icon: Clock,
        text: `Campaign is ${campaign.progress}% complete - progress will be lost`,
        severity: 'medium' as const
      });
    }

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

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            Delete Campaign: {campaign.name}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600">
                This action cannot be undone. Please review the deletion impact and provide confirmation.
              </p>
              
              {/* Campaign Overview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Campaign Overview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      variant={campaign.status === 'active' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {campaign.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <span className="ml-2 font-medium">{campaign.progress}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Links Generated:</span>
                    <span className="ml-2 font-medium">{campaign.linksGenerated}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Links Live:</span>
                    <span className="ml-2 font-medium">{campaign.linksLive}</span>
                  </div>
                </div>
              </div>

              {/* Deletion Impact */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Deletion Impact
                </h4>
                <div className="space-y-2">
                  {getDeletionImpact().map((impact, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <impact.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getSeverityColor(impact.severity)}`} />
                      <span className="text-sm text-gray-700">{impact.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Active Campaign Warning */}
          {isActive && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> This campaign is currently active and processing links. 
                Deletion will immediately stop all ongoing operations and may disrupt the link building process.
              </AlertDescription>
            </Alert>
          )}

          {isActive && (
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forceDelete"
                  checked={forceDelete}
                  onCheckedChange={(checked) => setForceDelete(checked as boolean)}
                />
                <Label htmlFor="forceDelete" className="text-sm font-medium text-red-700">
                  Force delete active campaign (will immediately stop all processing)
                </Label>
              </div>
            </div>
          )}

          {/* Confirmation Text */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">{expectedText}</code> to confirm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={expectedText}
              className={confirmationText && !isConfirmationValid ? 'border-red-300 focus:border-red-500' : ''}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">Confirmation text does not match exactly.</p>
            )}
          </div>
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
                Deleting...
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
