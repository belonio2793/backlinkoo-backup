import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

const CORSEmailAlert: React.FC = () => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Email Service Notice:</strong> Direct API calls to Resend are blocked by CORS policy in browser environments. 
        <br />
        <strong>Solution:</strong> Deploy Netlify functions or use server-side email sending.
        <br />
        <strong>Current Status:</strong> Using mock email service for testing.
      </AlertDescription>
    </Alert>
  );
};

export default CORSEmailAlert;
