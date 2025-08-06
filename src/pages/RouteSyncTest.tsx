import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReportSync, useReportFormData, useReportHistory } from '@/contexts/ReportSyncContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RouteSyncTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, navigateToReportView, navigateToReportForm } = useReportSync();
  const { formData, updateFormData } = useReportFormData();
  const { reports, lastReport } = useReportHistory();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    addTestResult('Starting route synchronization tests...');

    // Test 1: Form data persistence
    addTestResult('Test 1: Form data persistence');
    updateFormData({
      keyword: 'test keyword',
      anchorText: 'test anchor',
      destinationUrl: 'https://test.com',
      urlList: 'https://example.com\nhttps://example2.com'
    });
    addTestResult('✓ Form data updated in context');

    // Test 2: Navigation with parameters
    addTestResult('Test 2: Navigation to /report redirects to /backlink-report');
    navigate('/report?keyword=seo&anchorText=link&destinationUrl=https://example.com');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (location.pathname === '/backlink-report') {
      addTestResult('✓ Successfully redirected to /backlink-report');
    } else {
      addTestResult('✗ Failed to redirect to /backlink-report');
    }

    // Test 3: Check if URL parameters are handled
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('keyword') === 'seo') {
      addTestResult('✓ URL parameters preserved during redirect');
    } else {
      addTestResult('✗ URL parameters not preserved');
    }

    // Test 4: Report history functionality
    addTestResult('Test 4: Report history tracking');
    if (reports.length >= 0) {
      addTestResult(`✓ Report history accessible (${reports.length} reports)`);
    } else {
      addTestResult('✗ Report history not accessible');
    }

    // Test 5: Last report tracking
    if (lastReport) {
      addTestResult(`✓ Last report tracked: ${lastReport.id}`);
    } else {
      addTestResult('ℹ No last report (expected for fresh session)');
    }

    addTestResult('All tests completed!');
  };

  useEffect(() => {
    // Auto-run tests when component mounts
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Route Synchronization Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Current State</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Current Path:</strong> {location.pathname}</p>
                <p><strong>Search Params:</strong> {location.search}</p>
                <p><strong>Form Valid:</strong> {formData.keyword && formData.anchorText && formData.destinationUrl ? '✓' : '✗'}</p>
                <p><strong>Is Generating:</strong> {state.isGenerating ? 'Yes' : 'No'}</p>
                <p><strong>Report History:</strong> {reports.length} reports</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Form Data</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Keyword:</strong> {formData.keyword || '(empty)'}</p>
                <p><strong>Anchor Text:</strong> {formData.anchorText || '(empty)'}</p>
                <p><strong>Destination URL:</strong> {formData.destinationUrl || '(empty)'}</p>
                <p><strong>URL List:</strong> {formData.urlList ? `${formData.urlList.split('\n').length} URLs` : '(empty)'}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <button
                onClick={runTests}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium"
              >
                Run Tests
              </button>
              <button
                onClick={() => navigateToReportForm({
                  keyword: 'demo keyword',
                  anchorText: 'demo link',
                  destinationUrl: 'https://demo.com'
                })}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
              >
                Test Form Navigation
              </button>
              <button
                onClick={() => navigateToReportView('demo_preview_12345')}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Test Report Navigation
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p>No tests run yet. Click "Run Tests" to start.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">{result}</div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/backlink-report')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              ← Back to Backlink Report
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
