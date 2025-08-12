import React from 'react';
import { MissingColumnsFix } from '@/components/system/MissingColumnsFix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertTriangle } from 'lucide-react';

export function DatabaseColumnsFix() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Database Columns Fix
            </CardTitle>
            <CardDescription>
              Fix missing columns: started_at, completed_at, auto_start in automation_campaigns table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Missing Database Columns Detected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    The automation_campaigns table is missing required columns: <code>started_at</code>, <code>completed_at</code>, and <code>auto_start</code>.
                    This will cause campaign functionality to fail.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <MissingColumnsFix />
      </div>
    </div>
  );
}

export default DatabaseColumnsFix;
