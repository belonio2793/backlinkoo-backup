import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import RegistrationModal from '@/components/RegistrationModal';

interface BacklinkResult {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  status: 'found' | 'not_found' | 'error';
  domainAuthority: number;
  pageAuthority: number;
  responseTime: number;
  lastChecked: string;
}

interface ReportData {
  id: string;
  campaignName: string;
  clientEmail?: string;
  backlinks: any[];
  results: BacklinkResult[];
  createdAt: string;
  totalBacklinks: number;
}

export default function ReportViewer() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [modalService, setModalService] = useState<'indexing' | 'linkbuilding'>('indexing');

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const generateDemoData = (reportId: string) => {
    // Sample URLs for demo
    const sampleUrls = [
      'https://example.com/page1',
      'https://another.com/blog',
      'https://website.com/article',
      'https://domain.com/content',
      'https://sample.org/news',
      'https://test.net/info',
      'https://demo.io/features',
      'https://site.co/about'
    ];

    const backlinks = sampleUrls.map((url, index) => ({
      id: `entry_${Date.now()}_${index}`,
      sourceUrl: url,
      targetUrl: '',
      anchorText: ''
    }));

    return {
      id: reportId,
      campaignName: `Demo Report ${reportId}`,
      backlinks: backlinks,
      createdAt: new Date().toISOString(),
      totalBacklinks: backlinks.length,
      results: backlinks.map(bl => ({
        ...bl,
        status: Math.random() > 0.3 ? 'found' : 'not_found',
        domainAuthority: Math.floor(Math.random() * 40) + 40,
        pageAuthority: Math.floor(Math.random() * 50) + 20,
        responseTime: Math.floor(Math.random() * 2000) + 500,
        lastChecked: new Date().toISOString()
      }))
    };
  };

  const loadReport = async () => {
    try {
      // Load from localStorage for demo
      const stored = localStorage.getItem(`report_${reportId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setReportData(data);
      } else {
        // Generate demo data for preview URLs when localStorage data not found
        if (reportId) {
          const demoData = generateDemoData(reportId);
          setReportData(demoData);

          // Optionally store the demo data in localStorage for this session
          localStorage.setItem(`report_${reportId}`, JSON.stringify(demoData));

          toast({
            title: 'Demo Report Loaded',
            description: 'This is a demo report with sample data for preview purposes.',
          });
        } else {
          toast({
            title: 'Report Not Found',
            description: 'The requested report could not be found or may have expired.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error Loading Report',
        description: 'Failed to load the report data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReport = async () => {
    setIsRefreshing(true);
    
    // Simulate refreshing the report data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (reportData) {
      // Update with slight variations to simulate real checking
      const updatedResults = reportData.results.map(result => ({
        ...result,
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 2000) + 500,
        // Occasionally change status
        status: Math.random() > 0.9 ? 
          (result.status === 'found' ? 'not_found' : 'found') : 
          result.status
      }));

      const updatedData = {
        ...reportData,
        results: updatedResults
      };

      setReportData(updatedData);
      localStorage.setItem(`report_${reportId}`, JSON.stringify(updatedData));
    }
    
    setIsRefreshing(false);
    toast({
      title: 'Report Refreshed',
      description: 'Link status has been updated.',
    });
  };

  const shareReport = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: 'Report URL Copied',
      description: 'Share this link with your clients or team.',
    });
  };

  const downloadReport = () => {
    if (!reportData) return;

    const csvData = [
      ['URL', 'Status', 'Domain Authority', 'Page Authority', 'Response Time (ms)', 'Last Checked'],
      ...reportData.results.map(r => [
        r.sourceUrl,
        r.status,
        r.domainAuthority,
        r.pageAuthority,
        r.responseTime,
        new Date(r.lastChecked).toLocaleString()
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `url-report-${reportData.campaignName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'CSV file has been downloaded to your computer.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'not_found':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'found':
        return 'Active';
      case 'not_found':
        return 'Not Found';
      default:
        return 'Error';
    }
  };

  const calculateStats = () => {
    if (!reportData) return { found: 0, notFound: 0, avgDA: 0, avgPA: 0 };
    
    const found = reportData.results.filter(r => r.status === 'found').length;
    const notFound = reportData.results.filter(r => r.status === 'not_found').length;
    const avgDA = Math.round(reportData.results.reduce((sum, r) => sum + r.domainAuthority, 0) / reportData.results.length);
    const avgPA = Math.round(reportData.results.reduce((sum, r) => sum + r.pageAuthority, 0) / reportData.results.length);
    
    return { found, notFound, avgDA, avgPA };
  };

  const filteredResults = reportData?.results.filter(result => 
    result.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.anchorText.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleIndexingService = () => {
    setModalService('indexing');
    setShowRegistration(true);
  };

  const handleLinkBuilding = () => {
    setModalService('linkbuilding');
    setShowRegistration(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-gray-200 p-8 text-center rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
            <p className="text-gray-600 mb-6">
              The requested URL report could not be found or may have expired.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                ← Back to Home
              </button>
              <button 
                onClick={() => navigate('/backlink-report')}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium"
              >
                Create New Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-4 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Report</h1>
              <p className="text-gray-600 text-lg">
                {reportData.campaignName} - Generated {new Date(reportData.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={refreshReport}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-lg transition-colors font-medium"
              >
                <svg className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button 
                onClick={shareReport}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy URL
              </button>
              
              <button 
                onClick={downloadReport}
                className="inline-flex items-center px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 p-6 text-center rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.found}</div>
            <div className="text-sm font-medium text-gray-600">Active Links</div>
          </div>
          <div className="bg-white border border-gray-200 p-6 text-center rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.notFound}</div>
            <div className="text-sm font-medium text-gray-600">Not Found</div>
          </div>
          <div className="bg-white border border-gray-200 p-6 text-center rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.avgDA}</div>
            <div className="text-sm font-medium text-gray-600">Avg Domain Authority</div>
          </div>
          <div className="bg-white border border-gray-200 p-6 text-center rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.avgPA}</div>
            <div className="text-sm font-medium text-gray-600">Avg Page Authority</div>
          </div>
        </div>

        {/* Link Finder */}
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
          <input
            type="text"
            placeholder="Search URLs or anchor text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 bg-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
          <div className="mt-3 text-sm text-gray-600">
            Showing <span className="font-medium">{filteredResults.length}</span> of <span className="font-medium">{reportData.totalBacklinks}</span> URLs
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">URL Analysis Results</h3>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {filteredResults.map((result, index) => (
              <div key={result.id} className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mr-3">
                        {index + 1}
                      </span>
                      <a 
                        href={result.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm break-all font-medium transition-colors"
                      >
                        {result.sourceUrl}
                      </a>
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(result.status)}`}>
                    {getStatusText(result.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 ml-9">
                  <div>
                    <span className="text-xs text-gray-500 block">Domain Authority</span>
                    <span className="font-semibold text-gray-900">{result.domainAuthority}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Page Authority</span>
                    <span className="font-semibold text-gray-900">{result.pageAuthority}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Response Time</span>
                    <span className="font-semibold text-gray-900">{result.responseTime}ms</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Last Checked</span>
                    <span className="font-semibold text-gray-900">{new Date(result.lastChecked).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Premium Services Available</h3>
          <p className="text-blue-800 mb-4">Enhance your SEO efforts with our professional services</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleIndexingService}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get URLs Indexed
            </button>
            <button
              onClick={handleLinkBuilding}
              className="flex items-center justify-center px-6 py-4 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Get Tier 2 and Tier 3 Links
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-3 text-center">
            ✨ Supports up to 10,000 URLs per service • Professional results guaranteed
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Powered by Backlink ∞</h3>
          <p className="text-gray-600 mb-6">
            Professional URL analysis and SEO reporting tools for modern businesses
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/backlink-report')}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Report
            </button>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1m-6 0h6" />
              </svg>
              Visit Backlink ∞
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <RegistrationModal
      isOpen={showRegistration}
      onClose={() => setShowRegistration(false)}
      serviceType={modalService}
    />
    </>
  );
}
