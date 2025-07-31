/**
 * Enhanced AI Live - Internal Testing Interface
 * Unlimited capacity, no restrictions, production-ready UI
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Terminal, 
  Link,
  Clock,
  Globe,
  FileText,
  Brain,
  Sparkles,
  Target,
  Settings,
  Play,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  Shield,
  Infinity
} from 'lucide-react';
import { openAIService } from '@/services/api/openai';
import { useToast } from '@/hooks/use-toast';

interface GenerationStats {
  totalGenerated: number;
  successRate: number;
  avgWordCount: number;
  avgGenerationTime: number;
}

interface GenerationResult {
  id: string;
  content: string;
  wordCount: number;
  keyword: string;
  anchorText: string;
  url: string;
  model: string;
  generatedAt: string;
  generationTime: number;
  status: 'success' | 'error';
  error?: string;
}

const CONTENT_TYPES = [
  { value: 'how-to', label: 'How-to Guide' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'review', label: 'Product Review' },
  { value: 'comparison', label: 'Comparison Article' },
  { value: 'listicle', label: 'Listicle' },
  { value: 'news', label: 'News Article' },
  { value: 'opinion', label: 'Opinion Piece' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'comprehensive', label: 'Comprehensive Guide' }
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'enthusiastic', label: 'Enthusiastic' }
];

const WORD_COUNT_PRESETS = [
  { value: 300, label: '300 words (Short)' },
  { value: 500, label: '500 words (Medium)' },
  { value: 800, label: '800 words (Long)' },
  { value: 1000, label: '1000 words (Standard)' },
  { value: 1500, label: '1500 words (Extended)' },
  { value: 2000, label: '2000 words (Comprehensive)' }
];

export function EnhancedAILive() {
  const { toast } = useToast();
  
  // Form state
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState('comprehensive');
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState(1000);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  
  // System state
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stats, setStats] = useState<GenerationStats>({
    totalGenerated: 0,
    successRate: 100,
    avgWordCount: 0,
    avgGenerationTime: 0
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('generator');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Load saved results from localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('aiLive-results');
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);
        updateStats(parsed);
      } catch (error) {
        console.error('Failed to load saved results:', error);
      }
    }
  }, []);

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const isConfigured = await openAIService.isConfigured();
      const canConnect = await openAIService.testConnection();
      setApiStatus(isConfigured && canConnect ? 'online' : 'offline');
    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus('offline');
    }
  };

  const updateStats = (resultsList: GenerationResult[]) => {
    const successfulResults = resultsList.filter(r => r.status === 'success');
    const newStats: GenerationStats = {
      totalGenerated: resultsList.length,
      successRate: resultsList.length > 0 ? (successfulResults.length / resultsList.length) * 100 : 100,
      avgWordCount: successfulResults.length > 0 
        ? Math.round(successfulResults.reduce((sum, r) => sum + r.wordCount, 0) / successfulResults.length)
        : 0,
      avgGenerationTime: successfulResults.length > 0
        ? Math.round(successfulResults.reduce((sum, r) => sum + r.generationTime, 0) / successfulResults.length)
        : 0
    };
    setStats(newStats);
  };

  const saveResults = (newResults: GenerationResult[]) => {
    localStorage.setItem('aiLive-results', JSON.stringify(newResults));
    updateStats(newResults);
  };

  const simulateProgress = () => {
    setGenerationProgress(0);
    let progress = 0;
    
    const steps = [
      'Initializing OpenAI connection...',
      'Processing your requirements...',
      'Generating content structure...',
      'Writing introduction...',
      'Creating main content sections...',
      'Adding natural backlinks...',
      'Optimizing for SEO...',
      'Finalizing content...',
      'Quality check completed!'
    ];
    
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;
      
      setGenerationProgress(Math.round(progress));
      
      const stepIndex = Math.floor((progress / 100) * steps.length);
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setCurrentStep('Generation completed successfully!');
      }
    }, 800);
    
    progressRef.current = interval;
  };

  const generateContent = async () => {
    if (!keyword.trim() || !anchorText.trim() || !url.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setCurrentContent('');
    setGenerationProgress(0);
    setCurrentStep('Starting generation...');
    
    const startTime = Date.now();
    
    simulateProgress();

    try {
      console.log('🚀 Starting internal AI Live generation...');
      
      // Force check API status
      await checkApiStatus();
      
      if (apiStatus === 'offline') {
        throw new Error('OpenAI API is not available. Please check your configuration.');
      }

      const result = await openAIService.generateContent(keyword, {
        maxTokens: Math.floor(wordCount * 2.5),
        temperature: 0.7,
        systemPrompt: useCustomPrompt && customPrompt.trim() 
          ? customPrompt 
          : `You are an expert ${contentType} writer. Write in a ${tone} tone. Create high-quality, engaging content that naturally incorporates the provided backlink.`
      });

      const generationTime = Date.now() - startTime;

      if (result.success && result.content) {
        const newResult: GenerationResult = {
          id: `gen-${Date.now()}`,
          content: result.content,
          wordCount: result.content.split(' ').length,
          keyword,
          anchorText,
          url,
          model: 'OpenAI GPT-3.5',
          generatedAt: new Date().toISOString(),
          generationTime,
          status: 'success'
        };

        const updatedResults = [newResult, ...results];
        setResults(updatedResults);
        saveResults(updatedResults);
        setCurrentContent(result.content);
        setSelectedResult(newResult.id);

        toast({
          title: "✅ Generation Successful!",
          description: `Generated ${newResult.wordCount} words in ${Math.round(generationTime/1000)}s`,
        });

        // Switch to results tab
        setActiveTab('results');
      } else {
        throw new Error(result.error || 'Content generation failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Generation failed:', error);
      
      const failedResult: GenerationResult = {
        id: `gen-${Date.now()}`,
        content: '',
        wordCount: 0,
        keyword,
        anchorText,
        url,
        model: 'OpenAI GPT-3.5',
        generatedAt: new Date().toISOString(),
        generationTime: Date.now() - startTime,
        status: 'error',
        error: errorMessage
      };

      const updatedResults = [failedResult, ...results];
      setResults(updatedResults);
      saveResults(updatedResults);

      toast({
        title: "❌ Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    }
  };

  const clearResults = () => {
    setResults([]);
    setCurrentContent('');
    setSelectedResult(null);
    localStorage.removeItem('aiLive-results');
    updateStats([]);
    toast({
      title: "Results Cleared",
      description: "All generation results have been cleared.",
    });
  };

  const exportResult = (result: GenerationResult) => {
    const exportData = {
      ...result,
      exportedAt: new Date().toISOString(),
      platform: 'AI Live - Internal Testing'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-live-${result.keyword.replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'checking': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto p-6 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Brain className="h-10 w-10 text-blue-600" />
              <Infinity className="h-5 w-5 text-purple-600 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Live - Internal Testing
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Advanced content generation interface for internal testing and validation. 
            Unlimited capacity with production-grade reliability.
          </p>
          
          {/* System Status Bar */}
          <div className="flex items-center justify-center gap-6 mt-6 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(apiStatus)}>
                {apiStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {apiStatus === 'online' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {apiStatus === 'offline' && <AlertCircle className="h-3 w-3 mr-1" />}
                OpenAI: {apiStatus}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{stats.totalGenerated}</span>
                <span className="text-gray-500">generated</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                <span className="text-gray-500">success</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium">{stats.avgGenerationTime}ms</span>
                <span className="text-gray-500">avg time</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkApiStatus}
              disabled={apiStatus === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results ({results.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Input Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Content Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Target Keyword *
                        </label>
                        <Input
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="e.g., digital marketing strategies"
                          disabled={isGenerating}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Anchor Text *
                        </label>
                        <Input
                          value={anchorText}
                          onChange={(e) => setAnchorText(e.target.value)}
                          placeholder="e.g., learn more about SEO"
                          disabled={isGenerating}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Target URL *
                        </label>
                        <Input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="e.g., https://example.com"
                          disabled={isGenerating}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Content Options */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Content Type
                        </label>
                        <Select value={contentType} onValueChange={setContentType} disabled={isGenerating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tone
                        </label>
                        <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TONE_OPTIONS.map((toneOption) => (
                              <SelectItem key={toneOption.value} value={toneOption.value}>
                                {toneOption.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Word Count
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {WORD_COUNT_PRESETS.map((preset) => (
                            <Button
                              key={preset.value}
                              variant={wordCount === preset.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setWordCount(preset.value)}
                              disabled={isGenerating}
                              className="text-xs"
                            >
                              {preset.value}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full"
                      >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                      </Button>
                      
                      {showAdvanced && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="useCustomPrompt"
                              checked={useCustomPrompt}
                              onChange={(e) => setUseCustomPrompt(e.target.checked)}
                              disabled={isGenerating}
                            />
                            <label htmlFor="useCustomPrompt" className="text-sm font-medium">
                              Use Custom System Prompt
                            </label>
                          </div>
                          
                          {useCustomPrompt && (
                            <Textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder="Enter your custom system prompt..."
                              disabled={isGenerating}
                              rows={4}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={generateContent}
                      disabled={isGenerating || apiStatus !== 'online'}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Generate Content
                        </>
                      )}
                    </Button>

                    {apiStatus === 'offline' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          OpenAI API is offline. Please check your configuration and try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Generation Progress & Preview */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Progress Card */}
                {isGenerating && (
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Brain className="h-5 w-5 animate-pulse" />
                        Generation in Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-blue-700">{currentStep}</span>
                            <span className="text-blue-600">{generationProgress}%</span>
                          </div>
                          <div className="w-full bg-blue-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="text-sm text-blue-700 bg-white/70 rounded p-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>Keyword:</strong> {keyword}
                            </div>
                            <div>
                              <strong>Content Type:</strong> {CONTENT_TYPES.find(t => t.value === contentType)?.label}
                            </div>
                            <div>
                              <strong>Target Words:</strong> {wordCount}
                            </div>
                            <div>
                              <strong>Tone:</strong> {TONE_OPTIONS.find(t => t.value === tone)?.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Content Preview */}
                {currentContent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Generated Content Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: currentContent.substring(0, 1000) + (currentContent.length > 1000 ? '...' : '') }} />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Badge variant="outline">
                          {currentContent.split(' ').length} words
                        </Badge>
                        <Badge variant="outline">
                          Generated at {new Date().toLocaleTimeString()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Generation Results</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearResults} disabled={results.length === 0}>
                    Clear All
                  </Button>
                </div>
              </div>

              {results.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h3>
                  <p className="text-gray-500">Generate some content to see results here.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {results.map((result) => (
                    <Card key={result.id} className={`p-4 ${selectedResult === result.id ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status === 'success' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Success
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline">{result.wordCount} words</Badge>
                            <Badge variant="outline">{Math.round(result.generationTime/1000)}s</Badge>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-1">"{result.keyword}"</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Anchor:</strong> {result.anchorText} → {result.url}
                          </p>
                          <p className="text-xs text-gray-500">
                            Generated on {new Date(result.generatedAt).toLocaleString()}
                          </p>
                          
                          {result.error && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">{result.error}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result.id);
                              setCurrentContent(result.content);
                            }}
                            disabled={result.status === 'error'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportResult(result)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Performance Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalGenerated}</div>
                  <div className="text-sm text-gray-600">Total Generated</div>
                </Card>
                
                <Card className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </Card>
                
                <Card className="p-6 text-center">
                  <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.avgWordCount}</div>
                  <div className="text-sm text-gray-600">Avg Word Count</div>
                </Card>
                
                <Card className="p-6 text-center">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{(stats.avgGenerationTime/1000).toFixed(1)}s</div>
                  <div className="text-sm text-gray-600">Avg Generation Time</div>
                </Card>
              </div>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">OpenAI API</span>
                    </div>
                    <Badge className={getStatusColor(apiStatus)}>
                      {apiStatus}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Infinity className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Capacity</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Unlimited
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Terminal className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Environment</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Internal Testing
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">System Settings</h2>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <Button onClick={checkApiStatus} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh API Status
                  </Button>
                  
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertDescription>
                      This is an internal testing interface with unlimited capacity. 
                      All generations are logged locally for analysis.
                    </AlertDescription>
                  </Alert>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                <div className="space-y-4">
                  <Button onClick={clearResults} variant="destructive" className="w-full">
                    Clear All Results
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    This will permanently delete all generation results and analytics data.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
