import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PerformanceMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>System performance overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
