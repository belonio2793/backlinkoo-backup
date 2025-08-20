// Placeholder DNS setup instructions component - DNS features removed
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DNSSetupInstructionsProps {
  domain?: string;
  className?: string;
}

const DNSSetupInstructions: React.FC<DNSSetupInstructionsProps> = ({ 
  domain, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          DNS setup features have been removed from this application.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DNSSetupInstructions;
