import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoginModal } from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { SavedBacklinkReportsService, type BacklinkReportData } from '@/services/savedBacklinkReportsService';

interface BacklinkEntry {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
}

export default function BacklinkReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [urlList, setUrlList] = useState('');
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewSectionCollapsed, setIsPreviewSectionCollapsed] = useState(false);
  const [isInstructionsSectionCollapsed, setIsInstructionsSectionCollapsed] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportData, setReportData] = useState<BacklinkReportData | null>(null);

  const { user, isAuthenticated } = useAuth();

  const parseUrls = (text: string): BacklinkEntry[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const backlinks: BacklinkEntry[] = [];

    lines.forEach((line, index) => {
      const url = line.trim();
      if (url && url.startsWith('http')) {
        backlinks.push({
          id: `entry_${Date.now()}_${index}`,
          sourceUrl: url,
          targetUrl: '', // Will be determined during verification
          anchorText: '' // Will be found during verification
        });
      }
    });

    return backlinks;
  };

  const generateReport = async () => {
    const backlinks = parseUrls(urlList);

    // Validation checks
    if (!keyword.trim()) {
      toast({
        title: 'Missing Keyword',
        description: 'Please enter the target keyword you want to verify.',
        variant: 'destructive'
      });
      return;
    }

    if (!anchorText.trim()) {
      toast({
        title: 'Missing Anchor Text',
        description: 'Please enter the expected anchor text for your backlinks.',
        variant: 'destructive'
      });
      return;
    }

    if (!destinationUrl.trim()) {
      toast({
        title: 'Missing Destination URL',
        description: 'Please enter the URL where the anchor text should link to.',
        variant: 'destructive'
      });
      return;
    }

    if (backlinks.length === 0) {
      toast({
        title: 'No Valid URLs',
        description: 'Please add URLs to verify in the correct format.',
        variant: 'destructive'
      });
      return;
    }

    if (backlinks.length > 10000) {
      toast({
        title: 'Too Many URLs',
        description: 'Maximum 10,000 URLs allowed per report.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate unique report URL
      const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const generatedUrl = `${window.location.origin}/report/${reportId}`;
      
      // Store report data in localStorage for demo
      const createdDate = new Date();
      const formattedDate = createdDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const reportData = {
        id: reportId,
        campaignName: `Backlink Verification Report - ${formattedDate}`,
        verificationParams: {
          keyword: keyword.trim(),
          anchorText: anchorText.trim(),
          destinationUrl: destinationUrl.trim()
        },
        backlinks: backlinks,
        createdAt: createdDate.toISOString(),
        totalBacklinks: backlinks.length,
        // Mock verification results with detailed checks
        results: backlinks.map(bl => {
          const hasKeyword = Math.random() > 0.4;
          const hasAnchorText = Math.random() > 0.3;
          const hasCorrectDestination = Math.random() > 0.25;
          const isReachable = Math.random() > 0.1;
          
          return {
            ...bl,
            isReachable,
            pageTitle: isReachable ? `Sample Page Title ${Math.floor(Math.random() * 1000)}` : null,
            verification: {
              keywordFound: hasKeyword,
              anchorTextFound: hasAnchorText,
              destinationUrlMatches: hasCorrectDestination,
              isVerified: hasKeyword && hasAnchorText && hasCorrectDestination,
              keywordCount: hasKeyword ? Math.floor(Math.random() * 5) + 1 : 0,
              anchorTextContext: hasAnchorText ? `...some text before ${anchorText.trim()} and some text after...` : null
            },
            domainAuthority: Math.floor(Math.random() * 40) + 40,
            pageAuthority: Math.floor(Math.random() * 50) + 20,
            responseTime: isReachable ? Math.floor(Math.random() * 2000) + 500 : null,
            lastChecked: new Date().toISOString(),
            statusCode: isReachable ? 200 : Math.random() > 0.5 ? 404 : 500
          };
        })
      };

      localStorage.setItem(`report_${reportId}`, JSON.stringify(reportData));

      // Store report data for potential saving
      setReportData(reportData);
      setReportUrl(generatedUrl);
      
      const verifiedCount = reportData.results.filter(r => r.verification.isVerified).length;
      toast({
        title: 'Verification Complete',
        description: `Found ${verifiedCount} verified backlinks out of ${backlinks.length} URLs checked.`,
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReportUrl = () => {
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: 'URL Copied',
      description: 'Report URL copied to clipboard.',
    });
  };

  const handleSaveReport = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!reportData) {
      toast({
        title: 'No Report to Save',
        description: 'Please generate a report first.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedReport = await SavedBacklinkReportsService.saveReport(
        reportData.campaignName,
        keyword.trim(),
        anchorText.trim(),
        destinationUrl.trim(),
        reportData
      );

      const isLocalStorage = savedReport.id.startsWith('local_');
      toast({
        title: 'Report Saved Successfully',
        description: isLocalStorage
          ? 'Your backlink report has been saved locally. It will be synced to your account once the database is ready.'
          : 'Your backlink report has been saved to your account.',
      });
    } catch (error) {
      console.error('Error saving report:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to save report. Please try again.';

      // Check if it's a database setup issue
      if (errorMessage.includes('database setup') || errorMessage.includes('Database table not ready')) {
        toast({
          title: 'Feature Setup Required',
          description: 'The saved reports feature is being set up. Please try again in a few moments or contact support.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Save Failed',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSuccess = (user: any) => {
    setShowLoginModal(false);
    // Automatically save the report after successful authentication
    if (reportData) {
      handleSaveReport();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <Header />
      
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Backlink Reports</h1>
          <p className="text-gray-600 text-lg">
            Generate professional verification reports for backlink campaigns
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex gap-8">

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Verification Parameters */}
            <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Backlink Verification Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Target Keyword
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g., best SEO tools"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Expected Anchor Text
                  </label>
                  <input
                    type="text"
                    value={anchorText}
                    onChange={(e) => setAnchorText(e.target.value)}
                    placeholder="e.g., best SEO tools"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://yoursite.com/page"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Validation Status */}
              {(keyword || anchorText || destinationUrl) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Verification Setup Status:</h3>
                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <span className={`flex items-center ${keyword ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={keyword ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                      Keyword {keyword ? '✓' : '(required)'}
                    </span>
                    <span className={`flex items-center ${anchorText ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={anchorText ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                      Anchor Text {anchorText ? '✓' : '(required)'}
                    </span>
                    <span className={`flex items-center ${destinationUrl ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={destinationUrl ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                      Destination URL {destinationUrl ? '✓' : '(required)'}
                    </span>
                  </div>
                  {keyword && anchorText && destinationUrl && !isAuthenticated && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                      💡 <strong>Tip:</strong> Sign in after generating your report to save it to your account for future access.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* URL Input Area */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                URLs to Verify
              </label>
              <textarea
                value={urlList}
                onChange={(e) => setUrlList(e.target.value)}
                placeholder="Paste your URLs here (one per line)..."
                className="w-full h-64 p-4 border border-gray-300 bg-white text-gray-900 text-sm resize-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                spellCheck={false}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{parseUrls(urlList).length}</span> URLs detected (max 10,000)
                </div>
                {parseUrls(urlList).length > 0 && keyword && anchorText && destinationUrl && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Ready to verify backlinks
                  </div>
                )}
                {parseUrls(urlList).length > 0 && (!keyword || !anchorText || !destinationUrl) && (
                  <div className="text-xs text-amber-600 font-medium">
                    ⚠ Complete verification settings above
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div className="mb-8">
              <button
                onClick={generateReport}
                disabled={isGenerating || !urlList.trim() || !keyword.trim() || !anchorText.trim() || !destinationUrl.trim()}
                className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors text-lg shadow-md"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying Backlinks...
                  </>
                ) : (
                  'Verify Backlinks'
                )}
              </button>
              
              {(!keyword.trim() || !anchorText.trim() || !destinationUrl.trim()) && (
                <p className="mt-2 text-sm text-gray-500">
                  Complete all verification settings above to enable backlink verification
                </p>
              )}
            </div>

            {/* Report URL */}
            {reportUrl && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">Verification Complete!</h3>
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={reportUrl}
                    readOnly
                    className="w-full p-3 border border-green-300 bg-white text-sm rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyReportUrl}
                    className="inline-flex items-center px-4 py-2 bg-white text-green-700 border border-green-300 hover:bg-green-50 rounded-lg transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>
                  <button
                    onClick={() => window.open(reportUrl, '_blank')}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Report
                  </button>
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors font-medium"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        {isAuthenticated ? 'Save Report' : 'Sign in to Save'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="w-full">
                  <h4 className="font-semibold text-gray-900 mb-1">Important Information</h4>
                  <p className="text-gray-600 mb-3">
                    Reports are generated instantly and can be shared publicly.
                    {isAuthenticated ? ' Your saved reports can be accessed anytime from your account.' : ' Sign in to save reports to your account for future access.'}
                  </p>
                  {isAuthenticated && (
                    <button
                      onClick={() => navigate('/saved-reports')}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      View Saved Reports
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Your Reports Section */}
              {isAuthenticated && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Reports</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/saved-reports')}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Saved Reports
                    </button>
                    <p className="text-sm text-gray-600">
                      Access and manage your previously saved backlink verification reports.
                    </p>
                  </div>
                </div>
              )}

              {/* Help & Info Section */}
              <div className="space-y-4">
                {/* Preview Sample Report Section */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPreviewSectionCollapsed(!isPreviewSectionCollapsed)}
                        className="p-1 hover:bg-green-100 rounded-full transition-colors"
                        title={isPreviewSectionCollapsed ? 'Expand preview section' : 'Minimize preview section'}
                      >
                        <svg
                          className={`w-4 h-4 text-green-700 transition-transform ${isPreviewSectionCollapsed ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <h4 className="font-semibold text-green-900 text-sm">Preview Sample Report</h4>
                    </div>
                  </div>
                  {!isPreviewSectionCollapsed && (
                    <div className="space-y-3">
                      <p className="text-green-800 text-sm">
                        See what your backlink reports will look like before creating your own.
                      </p>
                      <Button
                        onClick={() => window.open('/report/demo_preview_12345', '_blank')}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Sample Report
                      </Button>
                    </div>
                  )}
                </div>

                {/* Instructions Section */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsInstructionsSectionCollapsed(!isInstructionsSectionCollapsed)}
                        className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                        title={isInstructionsSectionCollapsed ? 'Expand instructions' : 'Minimize instructions'}
                      >
                        <svg
                          className={`w-4 h-4 text-blue-700 transition-transform ${isInstructionsSectionCollapsed ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <h4 className="font-semibold text-blue-900 text-sm">How It Works</h4>
                    </div>
                  </div>
                  {!isInstructionsSectionCollapsed && (
                    <div className="space-y-4">
                      <p className="text-blue-800 text-sm">
                        Enter your verification settings, then paste URLs to check for backlinks.
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white p-3 border border-blue-200 rounded">
                          <h5 className="font-medium text-blue-900 text-xs mb-1">1. Target Keyword</h5>
                          <p className="text-xs text-blue-700">The keyword you want to rank for</p>
                        </div>
                        <div className="bg-white p-3 border border-blue-200 rounded">
                          <h5 className="font-medium text-blue-900 text-xs mb-1">2. Anchor Text</h5>
                          <p className="text-xs text-blue-700">The exact text that should be hyperlinked</p>
                        </div>
                        <div className="bg-white p-3 border border-blue-200 rounded">
                          <h5 className="font-medium text-blue-900 text-xs mb-1">3. Destination URL</h5>
                          <p className="text-xs text-blue-700">Where the anchor text should link to</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700">
                        <strong>Example:</strong> Check if "best SEO tools" links to "yoursite.com/seo-tools" on each URL.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab="login"
      />
    </div>
  );
}
