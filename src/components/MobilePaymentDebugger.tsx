import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import MobilePaymentHandler from '@/utils/mobilePaymentHandler';

export function MobilePaymentDebugger() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    checkMobileCompatibility();
  }, []);

  const checkMobileCompatibility = () => {
    setIsLoading(true);
    
    // Get device and compatibility info
    const compatInfo = MobilePaymentHandler.checkPaymentCompatibility();
    setDeviceInfo(compatInfo.deviceInfo);
    setCompatibility(compatInfo);
    
    // Run diagnostic tests
    runDiagnosticTests();
    
    setIsLoading(false);
  };

  const runDiagnosticTests = () => {
    const tests = [
      {
        name: 'User Agent Detection',
        test: () => {
          const ua = navigator.userAgent;
          return {
            success: !!ua,
            message: ua ? `Detected: ${ua.substring(0, 100)}...` : 'Failed to detect user agent',
            details: { userAgent: ua }
          };
        }
      },
      {
        name: 'Popup Support Test',
        test: () => {
          try {
            const popup = window.open('', 'test', 'width=1,height=1');
            if (popup) {
              popup.close();
              return { success: true, message: 'Popups are supported' };
            } else {
              return { success: false, message: 'Popups are blocked' };
            }
          } catch (error) {
            return { success: false, message: `Popup error: ${error}` };
          }
        }
      },
      {
        name: 'Touch Support',
        test: () => {
          const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          return {
            success: hasTouch,
            message: hasTouch ? 'Touch events supported' : 'No touch support detected',
            details: { maxTouchPoints: navigator.maxTouchPoints }
          };
        }
      },
      {
        name: 'Network Connection',
        test: () => {
          const connection = (navigator as any).connection;
          if (connection) {
            return {
              success: true,
              message: `Connection: ${connection.effectiveType || 'unknown'}`,
              details: {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
              }
            };
          }
          return {
            success: false,
            message: 'Network API not available'
          };
        }
      },
      {
        name: 'Local Storage',
        test: () => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return { success: true, message: 'Local storage is available' };
          } catch (error) {
            return { success: false, message: 'Local storage blocked or unavailable' };
          }
        }
      },
      {
        name: 'Cookies Support',
        test: () => {
          try {
            document.cookie = 'test=test';
            const cookieEnabled = document.cookie.indexOf('test=test') !== -1;
            // Clean up
            document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            return {
              success: cookieEnabled,
              message: cookieEnabled ? 'Cookies are enabled' : 'Cookies are disabled'
            };
          } catch (error) {
            return { success: false, message: 'Cookie test failed' };
          }
        }
      }
    ];

    const results = tests.map(test => {
      try {
        const result = test.test();
        return { ...test, ...result };
      } catch (error) {
        return {
          ...test,
          success: false,
          message: `Test failed: ${error}`,
          error: error
        };
      }
    });

    setTestResults(results);
  };

  const testPaymentRedirect = async () => {
    try {
      const testUrl = 'https://httpbin.org/status/200';
      await MobilePaymentHandler.handlePaymentRedirect({
        url: testUrl,
        onSuccess: () => {
          console.log('Test redirect successful');
        },
        onError: (error) => {
          console.error('Test redirect failed:', error);
        }
      });
    } catch (error) {
      console.error('Payment redirect test failed:', error);
    }
  };

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Smartphone className="h-5 w-5" />;
    
    if (deviceInfo.isIOS) return <span className="text-lg">🍎</span>;
    if (deviceInfo.isAndroid) return <span className="text-lg">🤖</span>;
    return <Smartphone className="h-5 w-5" />;
  };

  const getBrowserIcon = () => {
    if (!deviceInfo) return <ExternalLink className="h-5 w-5" />;
    
    if (deviceInfo.isSafari) return <span className="text-lg">🧭</span>;
    if (deviceInfo.isChrome) return <span className="text-lg">🔵</span>;
    return <ExternalLink className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Payment Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkMobileCompatibility} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing...' : 'Run Tests'}
            </Button>
            <Button 
              onClick={testPaymentRedirect} 
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Redirect
            </Button>
          </div>
        </CardContent>
      </Card>

      {deviceInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getDeviceIcon()}
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={deviceInfo.isMobile ? "default" : "secondary"}>
                    {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                  </Badge>
                  {deviceInfo.isIOS && <Badge variant="outline">iOS {deviceInfo.version}</Badge>}
                  {deviceInfo.isAndroid && <Badge variant="outline">Android</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {getBrowserIcon()}
                  <span className="text-sm">
                    {deviceInfo.isSafari && 'Safari'}
                    {deviceInfo.isChrome && 'Chrome'}
                    {!deviceInfo.isSafari && !deviceInfo.isChrome && 'Other Browser'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {compatibility && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payment Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {compatibility.supported ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {compatibility.supported ? 'Payments Supported' : 'Payment Issues Detected'}
                </span>
              </div>
              
              {compatibility.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-amber-600">Warnings:</h4>
                  {compatibility.warnings.map((warning: string, index: number) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Diagnostic Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MobilePaymentDebugger;
