import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Target,
  Activity,
  Loader2
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';

interface LiveCampaignStatusProps {
  isCreating: boolean;
  lastCreatedCampaign?: Campaign;
  onCampaignUpdate?: (campaign: Campaign) => void;
}

interface LiveMessage {
  id: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

const LiveCampaignStatus: React.FC<LiveCampaignStatusProps> = ({ 
  isCreating, 
  lastCreatedCampaign,
  onCampaignUpdate 
}) => {
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(lastCreatedCampaign || null);
  const orchestrator = getOrchestrator();

  // Add live message
  const addLiveMessage = (message: string, level: LiveMessage['level'] = 'info') => {
    const newMessage: LiveMessage = {
      id: Date.now().toString(),
      message,
      level,
      timestamp: new Date()
    };
    setLiveMessages(prev => [...prev.slice(-9), newMessage]); // Keep last 10 messages
  };

  // Monitor active campaign
  useEffect(() => {
    if (lastCreatedCampaign) {
      setActiveCampaign(lastCreatedCampaign);
      addLiveMessage(`Campaign "${lastCreatedCampaign.keyword}" created successfully`, 'success');
    }
  }, [lastCreatedCampaign]);

  useEffect(() => {
    if (isCreating) {
      setLiveMessages([]);
      addLiveMessage('Initializing campaign creation...', 'info');
      
      const steps = [
        'Validating campaign parameters...',
        'Setting up content generation...',
        'Preparing publishing workflow...',
        'Campaign ready to start'
      ];

      steps.forEach((step, index) => {
        setTimeout(() => {
          addLiveMessage(step, 'info');
        }, (index + 1) * 1000);
      });
    }
  }, [isCreating]);

  // Monitor campaign progress
  useEffect(() => {
    if (!activeCampaign) return;

    const pollCampaign = async () => {
      try {
        const updated = await orchestrator.getCampaign(activeCampaign.id);
        if (updated && updated.status !== activeCampaign.status) {
          setActiveCampaign(updated);
          onCampaignUpdate?.(updated);
          
          switch (updated.status) {
            case 'generating':
              addLiveMessage('Content generation started', 'info');
              break;
            case 'publishing':
              addLiveMessage('Publishing content to platforms', 'info');
              break;
            case 'completed':
              addLiveMessage('Campaign completed successfully!', 'success');
              break;
            case 'failed':
              addLiveMessage(`Campaign failed: ${updated.error_message || 'Unknown error'}`, 'error');
              break;
            case 'paused':
              addLiveMessage('Campaign paused', 'warning');
              break;
          }
        }
      } catch (error) {
        console.error('Error polling campaign:', error);
      }
    };

    // Poll every 3 seconds if campaign is active
    if (['pending', 'generating', 'publishing'].includes(activeCampaign.status)) {
      const interval = setInterval(pollCampaign, 3000);
      return () => clearInterval(interval);
    }
  }, [activeCampaign, orchestrator, onCampaignUpdate]);

  const getMessageIcon = (level: LiveMessage['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'publishing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'generating': return <FileText className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isCreating && !activeCampaign && liveMessages.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCreating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Activity className="w-5 h-5" />
          )}
          Campaign Status
        </CardTitle>
        <CardDescription>
          Real-time campaign progress and activity feed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Campaign Info */}
        {activeCampaign && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(activeCampaign.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(activeCampaign.status)}
                    {activeCampaign.status}
                  </div>
                </Badge>
                <span className="font-medium">{activeCampaign.keyword}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Target URL:</span>
                <p className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                  {activeCampaign.target_url}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Anchor Text:</span>
                <p className="bg-white p-2 rounded border mt-1">
                  {activeCampaign.anchor_text}
                </p>
              </div>
            </div>

            {activeCampaign.error_message && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {activeCampaign.error_message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Live Activity Feed */}
        {liveMessages.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Activity Feed
            </h4>
            <ScrollArea className="h-48 border rounded-lg bg-white">
              <div className="p-3 space-y-2">
                {liveMessages.map((msg, index) => (
                  <div key={msg.id}>
                    <div className="flex items-start gap-2 text-sm">
                      {getMessageIcon(msg.level)}
                      <div className="flex-1">
                        <p className="text-gray-900">{msg.message}</p>
                        <p className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {index < liveMessages.length - 1 && (
                      <Separator className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveCampaignStatus;
