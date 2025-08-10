import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  Settings,
  Globe,
  Clock,
  BarChart3,
  Eye
} from 'lucide-react';

export function SafetyControls() {
  const [safetySettings, setSafetySettings] = useState({
    enableRateLimiting: true,
    enableIPRotation: true,
    enableCaptchaSolving: true,
    enableHumanSimulation: true,
    maxActionsPerHour: 50,
    maxActionsPerDay: 500,
    maxSitesPerHour: 20,
    minDelayBetweenActions: 30000,
    enableSafetyChecks: true
  });

  const [blacklistedDomains, setBlacklistedDomains] = useState([
    'google.com',
    'facebook.com', 
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'youtube.com',
    'amazon.com',
    'wikipedia.org'
  ]);

  const [newDomain, setNewDomain] = useState('');

  const rateLimitStats = {
    global: {
      current: 24,
      hourlyLimit: 50,
      dailyLimit: 500,
      dailyCurrent: 186
    },
    ips: [
      { ip: '192.168.1.100', current: 8, limit: 50 },
      { ip: '192.168.1.101', current: 12, limit: 50 },
      { ip: '192.168.1.102', current: 4, limit: 50 }
    ]
  };

  const addBlacklistedDomain = () => {
    if (newDomain && !blacklistedDomains.includes(newDomain)) {
      setBlacklistedDomains([...blacklistedDomains, newDomain]);
      setNewDomain('');
    }
  };

  const removeBlacklistedDomain = (domain: string) => {
    setBlacklistedDomains(blacklistedDomains.filter(d => d !== domain));
  };

  const updateSetting = (key: string, value: any) => {
    setSafetySettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Safety Controls
          </h2>
          <p className="text-gray-600">Configure safety measures and compliance settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={safetySettings.enableSafetyChecks ? 'default' : 'destructive'}>
            Safety {safetySettings.enableSafetyChecks ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </div>

      {/* Safety Status Alert */}
      {!safetySettings.enableSafetyChecks && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Safety checks are disabled. This may result in compliance violations and account bans.
          </AlertDescription>
        </Alert>
      )}

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>Control automation frequency and prevent overuse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Rate Limiting */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Rate Limiting</Label>
              <p className="text-sm text-gray-600">Automatically limit actions to prevent detection</p>
            </div>
            <Switch
              checked={safetySettings.enableRateLimiting}
              onCheckedChange={(checked) => updateSetting('enableRateLimiting', checked)}
            />
          </div>

          {/* Rate Limit Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-actions-hour">Max Actions per Hour</Label>
              <Input
                id="max-actions-hour"
                type="number"
                value={safetySettings.maxActionsPerHour}
                onChange={(e) => updateSetting('maxActionsPerHour', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-actions-day">Max Actions per Day</Label>
              <Input
                id="max-actions-day"
                type="number"
                value={safetySettings.maxActionsPerDay}
                onChange={(e) => updateSetting('maxActionsPerDay', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-sites-hour">Max Sites per Hour</Label>
              <Input
                id="max-sites-hour"
                type="number"
                value={safetySettings.maxSitesPerHour}
                onChange={(e) => updateSetting('maxSitesPerHour', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-delay">Min Delay Between Actions (ms)</Label>
              <Input
                id="min-delay"
                type="number"
                value={safetySettings.minDelayBetweenActions}
                onChange={(e) => updateSetting('minDelayBetweenActions', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Current Rate Limit Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Current Usage</h4>
            
            {/* Global Stats */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Global Hourly ({rateLimitStats.global.current}/{rateLimitStats.global.hourlyLimit})</span>
                <span>{((rateLimitStats.global.current / rateLimitStats.global.hourlyLimit) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(rateLimitStats.global.current / rateLimitStats.global.hourlyLimit) * 100} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span>Global Daily ({rateLimitStats.global.dailyCurrent}/{rateLimitStats.global.dailyLimit})</span>
                <span>{((rateLimitStats.global.dailyCurrent / rateLimitStats.global.dailyLimit) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(rateLimitStats.global.dailyCurrent / rateLimitStats.global.dailyLimit) * 100} className="h-2" />
            </div>

            {/* IP-specific Stats */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Per-IP Usage</h5>
              {rateLimitStats.ips.map((ipStat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{ipStat.ip}</span>
                  <div className="flex items-center gap-2">
                    <span>{ipStat.current}/{ipStat.limit}</span>
                    <div className="w-20">
                      <Progress value={(ipStat.current / ipStat.limit) * 100} className="h-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Human Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Human Simulation
          </CardTitle>
          <CardDescription>Mimic human behavior to avoid detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">IP Rotation</Label>
                <p className="text-sm text-gray-600">Rotate IP addresses automatically</p>
              </div>
              <Switch
                checked={safetySettings.enableIPRotation}
                onCheckedChange={(checked) => updateSetting('enableIPRotation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">CAPTCHA Solving</Label>
                <p className="text-sm text-gray-600">Automatically solve CAPTCHAs</p>
              </div>
              <Switch
                checked={safetySettings.enableCaptchaSolving}
                onCheckedChange={(checked) => updateSetting('enableCaptchaSolving', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Human Simulation</Label>
                <p className="text-sm text-gray-600">Randomize timing and behavior</p>
              </div>
              <Switch
                checked={safetySettings.enableHumanSimulation}
                onCheckedChange={(checked) => updateSetting('enableHumanSimulation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Safety Checks</Label>
                <p className="text-sm text-gray-600">Enable all safety validations</p>
              </div>
              <Switch
                checked={safetySettings.enableSafetyChecks}
                onCheckedChange={(checked) => updateSetting('enableSafetyChecks', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Blacklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Blacklist
          </CardTitle>
          <CardDescription>Domains that are automatically excluded from automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Domain */}
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBlacklistedDomain()}
            />
            <Button onClick={addBlacklistedDomain} disabled={!newDomain}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Domain List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {blacklistedDomains.map((domain) => (
              <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="font-mono text-sm">{domain}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlacklistedDomain(domain)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            {blacklistedDomains.length} domains blacklisted
          </p>
        </CardContent>
      </Card>

      {/* Safety Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800">Compliant</p>
              <p className="text-sm text-green-600">All safety measures active</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-blue-800">Rate Limited</p>
              <p className="text-sm text-blue-600">Within safe usage limits</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-purple-800">Protected</p>
              <p className="text-sm text-purple-600">{blacklistedDomains.length} domains blocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
