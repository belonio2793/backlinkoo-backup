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

    if (backlinks.length === 0) {
      toast({
        title: 'No Valid URLs',
        description: 'Please add URLs in the correct format.',
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
        campaignName: `Report Generated ${formattedDate}`,
        backlinks: backlinks,
        createdAt: createdDate.toISOString(),
        totalBacklinks: backlinks.length,
        // Mock verification results
        results: backlinks.map(bl => ({
          ...bl,
          status: Math.random() > 0.3 ? 'found' : 'not_found',
          domainAuthority: Math.floor(Math.random() * 40) + 40,
          pageAuthority: Math.floor(Math.random() * 50) + 20,
          responseTime: Math.floor(Math.random() * 2000) + 500,
          lastChecked: new Date().toISOString()
        }))
      };

      localStorage.setItem(`report_${reportId}`, JSON.stringify(reportData));
      
      setReportUrl(generatedUrl);
      
      toast({
        title: 'Report Generated',
        description: 'Your backlink verification report is ready.',
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
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h2>
          <p className="text-blue-800 mb-4">
            Paste your list of URLs below and click generate report to create a professional verification report.
          </p>
          <pre className="text-sm bg-white p-4 border border-blue-200 text-gray-700 rounded-lg">
{`https://example.com/page1
https://another.com/blog
https://website.com/article
https://domain.com/content`}
          </pre>
        </div>

        {/* Input Area */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            URL List
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
            {parseUrls(urlList).length > 0 && (
              <div className="text-xs text-green-600 font-medium">
                ✓ Ready to generate
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <button
            onClick={generateReport}
            disabled={isGenerating || !urlList.trim()}
            className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors text-lg shadow-md"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              'Generate Report'
            )}
          </button>
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
