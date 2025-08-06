import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

const DatabaseSchemaFix: React.FC = () => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Database Schema Issue:</strong> The 'premium_subscriptions' table relationship is not found.
        <br />
        <strong>Status:</strong> Using 'subscribers' table as fallback. Some premium features may not display correctly.
        <br />
        <strong>Solution:</strong> Run the database schema setup scripts to create the missing tables.
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseSchemaFix;
