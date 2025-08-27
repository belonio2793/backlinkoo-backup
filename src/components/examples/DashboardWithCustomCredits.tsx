/**
 * Example Dashboard Page Integration
 * 
 * This shows how to integrate the custom credits system into an existing dashboard page
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomCreditsButton, BuyCreditsQuick } from "../CustomCreditsButton";
import { Wallet, Zap, AlertTriangle, CheckCircle } from "lucide-react";

// Mock user data - replace with actual user context
const mockUser = {
  email: "user@example.com",
  credits: 25, // Current credit balance
  subscription: "free" // or "premium"
};

export const DashboardWithCustomCredits = () => {
  const [userCredits, setUserCredits] = useState(mockUser.credits);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle successful credit purchase
  const handleCreditsPurchased = () => {
    setShowSuccess(true);
    // In real app, refresh user data from server
    // setUserCredits(newAmount);
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const isLowCredits = userCredits < 50;
  const isCriticallyLow = userCredits < 10;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your backlink campaigns and credits</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          {mockUser.subscription} Plan
        </Badge>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Credits purchased successfully! Your new credits will appear shortly.
          </AlertDescription>
        </Alert>
      )}

      {/* Credits Overview Card */}
      <Card className={isCriticallyLow ? "border-red-200" : isLowCredits ? "border-yellow-200" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{userCredits}</p>
              <p className="text-muted-foreground">Available Credits</p>
            </div>
            <div className="text-right space-y-2">
              {isCriticallyLow ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Critical
                </Badge>
              ) : isLowCredits ? (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Good
                </Badge>
              )}
            </div>
          </div>

          {/* Low Credits Warning */}
          {isLowCredits && (
            <Alert className={isCriticallyLow ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
              <AlertTriangle className={`h-4 w-4 ${isCriticallyLow ? "text-red-600" : "text-yellow-600"}`} />
              <AlertDescription className={isCriticallyLow ? "text-red-800" : "text-yellow-800"}>
                {isCriticallyLow 
                  ? "⚠️ Critical: Very low credits! You may not be able to run campaigns."
                  : "⚠️ Warning: Credits running low. Consider purchasing more to avoid interruptions."
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Credit Purchase Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Buy More Credits</h4>
              <p className="text-sm text-muted-foreground">$1.40 per credit</p>
            </div>
            
            {/* Quick Buy Options */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <BuyCreditsQuick 
                credits={50} 
                variant="outline"
                className="w-full"
              />
              <BuyCreditsQuick 
                credits={100} 
                variant="outline"
                className="w-full"
              />
              <BuyCreditsQuick 
                credits={250} 
                variant="outline"
                className="w-full"
              />
              <BuyCreditsQuick 
                credits={500} 
                variant="outline"
                className="w-full"
              />
            </div>

            {/* Custom Amount Button */}
            <CustomCreditsButton
              variant="default"
              size="lg"
              className="w-full"
              onSuccess={handleCreditsPurchased}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Buy Custom Amount
              </div>
            </CustomCreditsButton>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              disabled={userCredits < 10}
            >
              <Zap className="h-5 w-5" />
              <span>New Campaign</span>
              <span className="text-xs text-muted-foreground">10+ credits</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              disabled={userCredits < 5}
            >
              <Wallet className="h-5 w-5" />
              <span>Quick Backlink</span>
              <span className="text-xs text-muted-foreground">5+ credits</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              disabled={userCredits < 1}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Blog Post</span>
              <span className="text-xs text-muted-foreground">1+ credit</span>
            </Button>
          </div>

          {/* Insufficient Credits Notice */}
          {userCredits < 10 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 flex items-center justify-between">
                <span>💡 Need more credits to run campaigns?</span>
                <CustomCreditsButton
                  variant="default"
                  size="sm"
                  initialCredits={Math.max(10 - userCredits, 10)}
                  onSuccess={handleCreditsPurchased}
                >
                  Buy Credits
                </CustomCreditsButton>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Blog post created</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              <Badge variant="outline">-1 credit</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Campaign completed</p>
                <p className="text-sm text-muted-foreground">1 day ago</p>
              </div>
              <Badge variant="outline">-15 credits</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Credits purchased</p>
                <p className="text-sm text-muted-foreground">3 days ago</p>
              </div>
              <Badge variant="default">+100 credits</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardWithCustomCredits;
