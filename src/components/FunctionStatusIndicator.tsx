/**
 * Function Status Indicator
 * 
 * Shows the current status of Netlify function deployment
 * for domain management functionality
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import QuickFunctionCheck from '@/utils/quickFunctionCheck';

export function FunctionStatusIndicator() {
  const [status, setStatus] = useState<{
    status: 'working' | 'limited' | 'manual';
    message: string;
    color: 'green' | 'yellow' | 'red';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const result = await QuickFunctionCheck.getStatusForUI();
      setStatus(result);
    } catch (error) {
      console.error('Function status check failed:', error);
      setStatus({
        status: 'manual',
        message: 'Status check failed',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getIcon = () => {
    if (loading) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (!status) return <XCircle className="h-3 w-3" />;
    
    switch (status.status) {
      case 'working': return <CheckCircle2 className="h-3 w-3" />;
      case 'limited': return <AlertTriangle className="h-3 w-3" />;
      case 'manual': return <XCircle className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    if (loading || !status) return 'secondary';
    
    switch (status.color) {
      case 'green': return 'default';
      case 'yellow': return 'secondary';
      case 'red': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBadgeClass = () => {
    if (loading || !status) return '';
    
    switch (status.color) {
      case 'green': return 'bg-green-50 text-green-700 border-green-200';
      case 'yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Check Failed
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className={`gap-1 ${getBadgeClass()}`}>
        {getIcon()}
        {status.status === 'working' ? 'Functions OK' : 
         status.status === 'limited' ? 'Limited' : 
         'Manual Required'}
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={checkStatus}
        className="h-6 w-6 p-0"
        title="Refresh status"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default FunctionStatusIndicator;
