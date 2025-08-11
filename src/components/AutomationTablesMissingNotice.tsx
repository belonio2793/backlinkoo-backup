import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';

interface AutomationTablesMissingNoticeProps {
  onRetry?: () => void;
}

export function AutomationTablesMissingNotice({ onRetry }: AutomationTablesMissingNoticeProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-2">
              Automation System Setup Required
            </h3>
            <p className="text-orange-700 text-sm mb-4">
              The automation database tables are not yet created. The system is currently running in 
              demo mode using temporary local storage. To enable full functionality, the database 
              tables need to be set up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRetry}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Database className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://github.com/your-repo/automation-setup', '_blank')}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
