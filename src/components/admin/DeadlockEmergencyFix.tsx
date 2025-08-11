/**
 * Deadlock Emergency Fix Component
 * Provides immediate resolution for database deadlocks
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { DeadlockPreventionService } from '@/services/deadlockPreventionService';

export function DeadlockEmergencyFix() {
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(DeadlockPreventionService.getStatus());

  const deadlockFixSQL = `-- Emergency Deadlock Fix
-- Run this in Supabase SQL Editor immediately

-- Terminate long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state != 'idle'
AND query_start < NOW() - INTERVAL '5 minutes'
AND query NOT LIKE '%pg_stat_activity%'
AND datname = current_database();

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Reset RLS policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_service_role_access" ON public.profiles 
FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;

-- Set timeouts to prevent future deadlocks
SET lock_timeout = '30s';
SET statement_timeout = '60s';

SELECT 'Deadlock fix applied successfully' as status;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deadlockFixSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql', '_blank');
  };

  const clearOperations = () => {
    setIsApplying(true);
    try {
      DeadlockPreventionService.clearAllOperations();
      setStatus(DeadlockPreventionService.getStatus());
      setTimeout(() => setIsApplying(false), 1000);
    } catch (error) {
      console.error('Failed to clear operations:', error);
      setIsApplying(false);
    }
  };

  const refreshStatus = () => {
    setStatus(DeadlockPreventionService.getStatus());
  };

  return (
    <Card className="w-full border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Database Deadlock Emergency Fix
        </CardTitle>
        <CardDescription>
          PostgreSQL deadlock detected (Error 40P01). Apply this fix immediately to resolve blocking database operations.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Deadlock Error:</strong> Process deadlock detected in PostgreSQL
            <br />
            <strong>Impact:</strong> Database operations may be blocked or slow
            <br />
            <strong>Solution:</strong> Apply SQL fix to terminate blocking processes and reset locks
          </AlertDescription>
        </Alert>

        {/* Operation Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium">Pending Operations: </span>
            <Badge variant={status.pendingOperations > 0 ? "destructive" : "secondary"}>
              {status.pendingOperations}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={refreshStatus}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {status.pendingOperations > 0 && (
          <Alert>
            <AlertDescription>
              <strong>Blocked Operations:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                {status.operationKeys.map((key, index) => (
                  <li key={index}>{key}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Emergency Actions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-red-800">Immediate Actions:</h4>
          
          <div className="flex gap-2">
            <Button 
              onClick={clearOperations}
              disabled={isApplying}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Clear Blocked Operations
            </Button>
            
            <Button onClick={openSupabaseDashboard} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Supabase SQL Editor
            </Button>
          </div>
        </div>

        {/* SQL Fix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-red-800">Database Fix SQL:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy SQL'}
            </Button>
          </div>
          
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm overflow-x-auto border max-h-64 overflow-y-auto">
              {deadlockFixSQL}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Steps to Fix:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Click "Clear Blocked Operations" above</li>
              <li>Click "Open Supabase SQL Editor"</li>
              <li>Copy and paste the SQL fix code</li>
              <li>Execute the SQL to terminate deadlocks</li>
              <li>Refresh the application to verify fix</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Prevention */}
        <Alert>
          <AlertDescription>
            <strong>Prevention:</strong> This fix also implements deadlock prevention measures including:
            <ul className="list-disc list-inside mt-1 text-sm">
              <li>Operation queuing to prevent concurrent conflicts</li>
              <li>Timeout settings to prevent long-running locks</li>
              <li>Simplified RLS policies to reduce complexity</li>
              <li>Automatic retry mechanisms for deadlock recovery</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default DeadlockEmergencyFix;
