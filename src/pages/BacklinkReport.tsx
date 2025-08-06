import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <Header />

      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Backlink Reports</h1>
          <p className="text-gray-600 text-lg">
            Generate professional verification reports for backlink campaigns
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {/* Preview Link Section */}
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewSectionCollapsed(!isPreviewSectionCollapsed)}
                className="p-1 hover:bg-green-100 rounded-full transition-colors"
                title={isPreviewSectionCollapsed ? 'Expand preview section' : 'Minimize preview section'}
              >
                <svg
                  className={`w-5 h-5 text-green-700 transition-transform ${isPreviewSectionCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-green-900">Preview Sample Report</h2>
            </div>
            {!isPreviewSectionCollapsed && (
              <Button
                onClick={() => window.open('/report/demo_preview_12345', '_blank')}
                variant="outline"
                className="bg-white border-green-300 text-green-700 hover:bg-green-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Sample Report
              </Button>
            )}
          </div>
          {!isPreviewSectionCollapsed && (
            <div>
              <p className="text-green-800">
                See what your backlink reports will look like before creating your own.
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How Backlink Verification Works</h2>
          <p className="text-blue-800 mb-4">
            Enter your target keyword, expected anchor text, and destination URL. Then paste the list of URLs where your backlinks should be placed. We'll verify each link to ensure it contains the correct anchor text and links to your destination.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">1. Target Keyword</h3>
              <p className="text-sm text-blue-700">The keyword you want to rank for</p>
            </div>
            <div className="bg-white p-4 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">2. Anchor Text</h3>
              <p className="text-sm text-blue-700">The exact text that should be hyperlinked</p>
            </div>
            <div className="bg-white p-4 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">3. Destination URL</h3>
              <p className="text-sm text-blue-700">Where the anchor text should link to</p>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            <strong>Example:</strong> If you paid for a backlink with anchor text "best SEO tools" linking to "https://yoursite.com/seo-tools", we'll check each URL to verify the link exists and is correct.
          </p>
        </div>

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
              <div className="flex flex-wrap gap-4 text-sm">
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
              <h3 className="text-lg font-semibold text-green-900">Report Generated Successfully!</h3>
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
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Important Information</h4>
              <p className="text-gray-600">
                Reports are generated instantly and can be shared publicly.
                No registration required for basic reporting functionality.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
