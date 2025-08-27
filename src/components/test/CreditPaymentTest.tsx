/**
 * Credit Payment Test Component
 * Use this to test the fixed credit payment system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomCreditsButton, BuyCreditsQuick } from "../CustomCreditsButton";
import { CustomCreditsModal } from "../CustomCreditsModal";
import { CheckCircle, AlertTriangle, CreditCard, Zap } from "lucide-react";

export const CreditPaymentTest = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateTestResult = (testName: string, success: boolean) => {
    setTestResults(prev => ({ ...prev, [testName]: success }));
  };

  const testCases = [
    {
      name: "Custom Credits Modal",
      description: "Opens modal with custom credit input",
      component: (
        <CustomCreditsButton
          onSuccess={() => updateTestResult("Custom Credits Modal", true)}
        >
          Test Custom Credits Modal
        </CustomCreditsButton>
      )
    },
    {
      name: "Quick Buy 100 Credits",
      description: "Quick purchase of 100 credits ($140)",
      component: (
        <BuyCreditsQuick 
          credits={100}
          onSuccess={() => updateTestResult("Quick Buy 100 Credits", true)}
        />
      )
    },
    {
      name: "Quick Buy 250 Credits",
      description: "Quick purchase of 250 credits ($350)",
      component: (
        <BuyCreditsQuick 
          credits={250}
          onSuccess={() => updateTestResult("Quick Buy 250 Credits", true)}
        />
      )
    },
    {
      name: "Direct Modal",
      description: "Direct modal with pre-filled 500 credits",
      component: (
        <Button onClick={() => setIsModalOpen(true)}>
          Test Direct Modal (500 Credits)
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Credit Payment System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This test page verifies the fixed credit payment system. Each button should open a new Stripe checkout window.
              In development mode, payments will be simulated. In production, real Stripe checkout will open.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <div className="grid gap-6">
        {testCases.map((test, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  <p className="text-muted-foreground">{test.description}</p>
                </div>
                {testResults[test.name] !== undefined && (
                  <Badge variant={testResults[test.name] ? "default" : "secondary"}>
                    {testResults[test.name] ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {testResults[test.name] ? "Success" : "Pending"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {test.component}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(testResults).map(([testName, success]) => (
                <div key={testName} className="flex items-center justify-between">
                  <span>{testName}</span>
                  <Badge variant={success ? "default" : "secondary"}>
                    {success ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {success ? "✅ Passed" : "⏳ Pending"}
                  </Badge>
                </div>
              ))}
            </div>
            {Object.values(testResults).every(result => result) && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🎉 All tests passed! Credit payment system is working correctly.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Expected Behavior:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>✅ Button click should show loading state</li>
              <li>✅ New Stripe checkout window should open</li>
              <li>✅ No 404 errors in browser console</li>
              <li>✅ Success notification should appear</li>
              <li>✅ In development: Mock payment simulation</li>
              <li>✅ In production: Real Stripe checkout</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">If Issues Occur:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Check browser console for errors</li>
              <li>Verify popup blockers are disabled</li>
              <li>Check network tab for 404 or 500 errors</li>
              <li>Ensure Stripe keys are configured</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Direct Modal Test */}
      <CustomCreditsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCredits={500}
        onSuccess={() => {
          updateTestResult("Direct Modal", true);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default CreditPaymentTest;
