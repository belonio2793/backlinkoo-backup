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

  const loadReport = async () => {
    try {
      // Load from localStorage for demo
      const stored = localStorage.getItem(`report_${reportId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setReportData(data);
      } else {
        toast({
          title: 'Report Not Found',
          description: 'The requested report could not be found or may have expired.',
          variant: 'destructive'
        });
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
        return 'text-green-600 bg-green-100';
      case 'not_found':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
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
      <div className="min-h-screen bg-white flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white font-mono">
        <div className="max-w-4xl mx-auto p-6">
          <div className="border border-gray-300 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
            <p className="text-gray-600 mb-6">
              The requested URL report could not be found or may have expired.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300"
              >
                ← Back to Home
              </button>
              <button 
                onClick={() => navigate('/backlink-report')}
                className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800"
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
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <div className="border-b border-gray-300 bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline mb-2 block"
          >
            ← Back to Home
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">URL Report</h1>
              <p className="text-gray-600 mt-1">
                {reportData.campaignName} - Generated {new Date(reportData.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={refreshReport}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300 disabled:opacity-50"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button 
                onClick={shareReport}
                className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300"
              >
                Copy URL
              </button>
              
              <button 
                onClick={downloadReport}
                className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-gray-300 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.found}</div>
            <div className="text-sm text-gray-600">Active Links</div>
          </div>
          <div className="border border-gray-300 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.notFound}</div>
            <div className="text-sm text-gray-600">Not Found</div>
          </div>
          <div className="border border-gray-300 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgDA}</div>
            <div className="text-sm text-gray-600">Avg Domain Authority</div>
          </div>
          <div className="border border-gray-300 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgPA}</div>
            <div className="text-sm text-gray-600">Avg Page Authority</div>
          </div>
        </div>

        {/* Link Finder */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-300">
          <h3 className="font-bold mb-2">Link Finder:</h3>
          <input
            type="text"
            placeholder="Search URLs or anchor text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 bg-white font-mono text-sm"
          />
          <div className="mt-2 text-sm text-gray-600">
            {filteredResults.length} of {reportData.totalBacklinks} URLs shown
          </div>
        </div>

        {/* Services */}
        {!showRegistration && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300">
            <h3 className="font-bold mb-2">Available Services:</h3>
            <div className="flex gap-4">
              <button
                onClick={handleIndexingService}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700"
              >
                Get URLs Indexed
              </button>
              <button
                onClick={handleLinkBuilding}
                className="px-4 py-2 bg-green-600 text-white border border-green-600 hover:bg-green-700"
              >
                Build Links to URLs
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Supports up to 10,000 URLs per service
            </p>
          </div>
        )}

        {/* Registration Form */}
        {showRegistration && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300">
            <h3 className="font-bold mb-2">Register for Premium Services:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="email"
                placeholder="Email address"
                className="p-2 border border-gray-300 bg-white font-mono text-sm"
              />
              <input
                type="text"
                placeholder="Company name (optional)"
                className="p-2 border border-gray-300 bg-white font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800">
                Register & Get Quote
              </button>
              <button 
                onClick={() => setShowRegistration(false)}
                className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="border border-gray-300">
          <div className="bg-gray-100 p-2 border-b border-gray-300 font-bold">
            URL Analysis Results
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredResults.map((result, index) => (
              <div key={result.id} className="border-b border-gray-200 p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-sm">#{index + 1}</div>
                    <a 
                      href={result.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {result.sourceUrl}
                    </a>
                  </div>
                  
                  <div className={`px-2 py-1 text-xs border ${getStatusColor(result.status)}`}>
                    {getStatusText(result.status)}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>
                    <div className="font-bold">DA: {result.domainAuthority}</div>
                  </div>
                  <div>
                    <div className="font-bold">PA: {result.pageAuthority}</div>
                  </div>
                  <div>
                    <div className="font-bold">{result.responseTime}ms</div>
                  </div>
                  <div>
                    <div>{new Date(result.lastChecked).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-300 text-center">
          <h3 className="font-bold mb-2">Powered by Backlink ∞</h3>
          <p className="text-sm text-gray-600 mb-4">
            Professional URL analysis and SEO reporting tools
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/backlink-report')}
              className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800"
            >
              Create New Report
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-black border border-gray-300 hover:bg-gray-300"
            >
              Visit Backlink ∞
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
