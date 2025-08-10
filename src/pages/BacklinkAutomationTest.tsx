/**
 * Minimal test version of BacklinkAutomation to isolate module loading issues
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BacklinkAutomationTest() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Backlink Automation - Test Version</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a minimal test version to check if the module loads correctly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
