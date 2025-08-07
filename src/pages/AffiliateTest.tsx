import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../hooks/useAuth';
import { affiliateService } from '../services/affiliateService';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AffiliateTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState({
    auth: null as boolean | null,
    database: null as boolean | null,
    service: null as boolean | null,
    profile: null as boolean | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    const results = {
      auth: false,
      database: false,
      service: false,
      profile: false
    };

    try {
      // Test 1: Authentication
      console.log('Testing authentication...');
      if (user && user.id) {
        results.auth = true;
        console.log('✅ Authentication working');
      } else {
        console.log('❌ No authenticated user');
      }

      // Test 2: Database connection
      console.log('Testing database connection...');
      try {
        const { data, error } = await fetch('/.netlify/functions/test-connection').then(r => r.json());
        if (!error) {
          results.database = true;
          console.log('✅ Database connection working');
        } else {
          console.log('❌ Database connection failed:', error);
        }
      } catch (err) {
        console.log('❌ Database test failed:', err);
      }

      // Test 3: Affiliate service
      console.log('Testing affiliate service...');
      try {
        if (user) {
          const profile = await affiliateService.getAffiliateProfile(user.id);
          results.service = true;
          console.log('✅ Affiliate service working, profile:', profile);
          
          if (profile) {
            results.profile = true;
            console.log('✅ Affiliate profile exists');
          } else {
            console.log('ℹ️ No affiliate profile (normal for new users)');
          }
        }
      } catch (err) {
        console.log('❌ Affiliate service failed:', err);
        setError(err.message);
      }

    } catch (err) {
      console.error('Test error:', err);
      setError(err.message);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [user]);

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    if (status) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Testing...</Badge>;
    if (status) return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Pass</Badge>;
    return <Badge variant="destructive">✗ Fail</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Affiliate System Diagnostic
          </h1>
          <p className="text-gray-600">
            Testing affiliate page components and database connectivity
          </p>
        </div>

        <div className="space-y-6">
          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Tests
                <Button 
                  onClick={runTests} 
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults.auth)}
                    <div>
                      <h4 className="font-medium">User Authentication</h4>
                      <p className="text-sm text-gray-600">
                        {user ? `Logged in as ${user.email}` : 'Not authenticated'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(testResults.auth)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults.database)}
                    <div>
                      <h4 className="font-medium">Database Connection</h4>
                      <p className="text-sm text-gray-600">Supabase connectivity test</p>
                    </div>
                  </div>
                  {getStatusBadge(testResults.database)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults.service)}
                    <div>
                      <h4 className="font-medium">Affiliate Service</h4>
                      <p className="text-sm text-gray-600">Service methods working</p>
                    </div>
                  </div>
                  {getStatusBadge(testResults.service)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults.profile)}
                    <div>
                      <h4 className="font-medium">Affiliate Profile</h4>
                      <p className="text-sm text-gray-600">
                        {testResults.profile ? 'Profile exists' : 'No profile (normal for new users)'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(testResults.profile)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!testResults.auth && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to <a href="/login" className="text-blue-600 underline">log in</a> to test the affiliate system.
                  </AlertDescription>
                </Alert>
              )}

              {testResults.auth && !testResults.service && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The affiliate database tables are missing. Please run the database setup.
                  </AlertDescription>
                </Alert>
              )}

              {testResults.auth && testResults.service && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Everything looks good! You can now{' '}
                    <a href="/affiliate" className="text-blue-600 underline">access the affiliate page</a>.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AffiliateTest;
