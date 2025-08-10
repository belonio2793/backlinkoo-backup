import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AutomationSystemControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Controls</CardTitle>
        <CardDescription>Control the automation system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button className="w-full">Start System</Button>
          <Button variant="destructive" className="w-full">Stop System</Button>
        </div>
      </CardContent>
    </Card>
  );
}
