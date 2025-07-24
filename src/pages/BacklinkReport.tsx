import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const [reportUrl, setReportUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const parseUrls = (text: string): BacklinkEntry[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const backlinks: BacklinkEntry[] = [];
    
    lines.forEach((line, index) => {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length >= 3) {
        backlinks.push({
          id: `entry_${Date.now()}_${index}`,
          sourceUrl: parts[0] || '',
          targetUrl: parts[1] || '',
          anchorText: parts[2] || ''
        });
      }
    });

    return backlinks;
  };

  const generateReport = async () => {
    const backlinks = parseUrls(urlList);

    if (backlinks.length === 0) {
      toast({
        title: 'No Valid Backlinks',
        description: 'Please add backlink data in the correct format.',
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
      const reportData = {
        id: reportId,
        campaignName: `Report ${reportId}`,
        backlinks: backlinks,
        createdAt: new Date().toISOString(),
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
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <div className="border-b border-gray-300 bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline mb-2 block"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold">Backlink Reporting</h1>
          <p className="text-gray-600 mt-1">
            Generate verification reports for backlink campaigns
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Instructions */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-300">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <p className="text-sm text-gray-700 mb-2">
            Paste your backlink data in the format below (tab-separated):
          </p>
          <pre className="text-xs bg-white p-2 border border-gray-200 text-gray-600">
{`source_url	target_url	anchor_text
https://example.com/page1	https://yoursite.com	best SEO services
https://another.com/blog	https://yoursite.com/about	top marketing agency`}
          </pre>
        </div>

        {/* Input Area */}
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Backlink Data:
          </label>
          <textarea
            value={urlList}
            onChange={(e) => setUrlList(e.target.value)}
            placeholder="Paste your backlink data here (tab-separated format)..."
            className="w-full h-64 p-4 border border-gray-300 bg-white text-black font-mono text-sm resize-none focus:outline-none focus:border-gray-500"
            spellCheck={false}
          />
          <div className="mt-2 text-sm text-gray-600">
            {parseUrls(urlList).length} backlinks detected
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={generateReport}
            disabled={isGenerating || !urlList.trim()}
            className="px-6 py-3 bg-black text-white font-bold border border-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
          >
            {isGenerating ? 'Generating Report...' : 'Generate Report'}
          </button>
        </div>

        {/* Report URL */}
        {reportUrl && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-300">
            <h3 className="font-bold mb-2">Report Generated:</h3>
            <div className="mb-3">
              <input
                type="text"
                value={reportUrl}
                readOnly
                className="w-full p-2 border border-gray-300 bg-white font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyReportUrl}
                className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300"
              >
                Copy URL
              </button>
              <button
                onClick={() => window.open(reportUrl, '_blank')}
                className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800"
              >
                View Report
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-300 text-sm text-gray-600">
          <p>
            Reports are generated instantly and can be shared publicly. 
            No registration required for basic reporting functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
