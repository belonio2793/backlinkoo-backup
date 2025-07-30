import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface ServiceStatusCardProps {
  service: {
    name: string;
    icon: React.ComponentType<any>;
    status: 'connected' | 'error' | 'testing' | 'not_configured';
    message: string;
    responseTime?: number;
    details?: any;
  };
  onTest?: () => void;
}

export function ServiceStatusCard({ service, onTest }: ServiceStatusCardProps) {
  const IconComponent = service.icon;

  const getStatusColor = () => {
    switch (service.status) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'not_configured':
        return 'border-orange-200 bg-orange-50';
      case 'testing':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = () => {
    switch (service.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      connected: 'bg-green-100 text-green-800 border-green-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      testing: 'bg-blue-100 text-blue-800 border-blue-300',
      not_configured: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    
    return (
      <Badge className={variants[service.status]}>
        {service.status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md border-2 ${getStatusColor()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <IconComponent className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-600 break-words">{service.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {onTest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTest}
                disabled={service.status === 'testing'}
              >
                <RefreshCw className={`h-4 w-4 ${service.status === 'testing' ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          {service.responseTime && (
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {service.responseTime}ms
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
