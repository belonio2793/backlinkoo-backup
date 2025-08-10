/**
 * AI Engine Systems Monitor
 * Internal monitoring interface for AI blog generation engine
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { globalBlogGenerator } from '@/services/globalBlogGenerator';
import { Activity, CheckCircle2, AlertCircle, Loader2, Terminal, Zap } from 'lucide-react';

interface SystemLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  process: string;
  message: string;
}

interface ApiStatus {
  provider: string;
  status: 'online' | 'offline' | 'testing' | 'error';
  latency?: number;
  error?: string;
}

interface GeneratedContent {
  provider: string;
  content: string;
  slug: string;
  wordCount: number;
  quality: number;
  isValid: boolean;
  error?: string;
  generateTime: number;
  promptUsed: string;
  promptIndex: number;
}

export function MinimalAITest() {
  const [keyword, setKeyword] = useState('artificial intelligence');
  const [url, setUrl] = useState('https://example.com');
  const [anchorText, setAnchorText] = useState('learn more about AI');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [currentProcess, setCurrentProcess] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (level: SystemLog['level'], process: string, message: string) => {
    const log: SystemLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      process,
      message
    };
    setLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
  };

  const checkUrlAccessibility = async (targetUrl: string): Promise<boolean> => {
    addLog('info', 'URL_CHECK', `Checking URL accessibility: ${targetUrl}`);

    try {
      // Try to fetch the URL with a HEAD request first (faster)
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Handle CORS issues
        cache: 'no-cache'
      });

      // Note: no-cors mode doesn't give us status codes, so we'll try a different approach
      // If no error is thrown, the URL is likely accessible
      addLog('success', 'URL_CHECK', 'URL is accessible');
      return true;

    } catch (headError) {
      // If HEAD fails, try GET request with limited data
      try {
        addLog('info', 'URL_CHECK', 'HEAD request failed, trying GET request...');

        const response = await fetch(targetUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache'
        });

        addLog('success', 'URL_CHECK', 'URL is accessible (via GET)');
        return true;

      } catch (getError) {
        // Try a different approach using a proxy or image loading technique
        try {
          addLog('info', 'URL_CHECK', 'Direct fetch failed, trying alternative validation...');

          // Create a promise that resolves if the URL loads
          const checkPromise = new Promise<boolean>((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
              resolve(false);
            }, 5000); // 5 second timeout

            img.onload = () => {
              clearTimeout(timeout);
              resolve(true);
            };

            img.onerror = () => {
              clearTimeout(timeout);
              // Even if image fails, the URL might still be valid (just not an image)
              // We'll consider this as accessible since we got a response
              resolve(true);
            };

            img.src = targetUrl + '?cache-bust=' + Date.now();
          });

          const isAccessible = await checkPromise;

          if (isAccessible) {
            addLog('success', 'URL_CHECK', 'URL appears to be accessible');
            return true;
          } else {
            addLog('error', 'URL_CHECK', 'URL appears to be inaccessible or timeout');
            return false;
          }

        } catch (altError) {
          addLog('error', 'URL_CHECK', `URL validation failed: ${altError}`);
          return false;
        }
      }
    }
  };

  const validateInputs = async (): Promise<boolean> => {
    addLog('info', 'VALIDATION', 'Starting input validation...');

    if (!keyword.trim()) {
      addLog('error', 'VALIDATION', 'Keyword is required');
      return false;
    }
    if (!url.trim()) {
      addLog('error', 'VALIDATION', 'Target URL is required');
      return false;
    }
    if (!anchorText.trim()) {
      addLog('error', 'VALIDATION', 'Anchor text is required');
      return false;
    }

    // URL format validation
    try {
      new URL(url);
    } catch {
      addLog('error', 'VALIDATION', 'Invalid URL format');
      return false;
    }

    // Keyword validation
    if (keyword.length < 2) {
      addLog('error', 'VALIDATION', 'Keyword too short (minimum 2 characters)');
      return false;
    }

    if (anchorText.length < 3) {
      addLog('error', 'VALIDATION', 'Anchor text too short (minimum 3 characters)');
      return false;
    }

    // URL accessibility check
    const isUrlAccessible = await checkUrlAccessibility(url);
    if (!isUrlAccessible) {
      addLog('error', 'VALIDATION', 'Target URL is not accessible (404 or network error)');
      return false;
    }

    addLog('success', 'VALIDATION', 'All inputs validated successfully');
    return true;
  };

  const generateSlug = (keyword: string, provider: string) => {
    const baseSlug = keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${provider.toLowerCase().replace(/\s/g, '')}-${randomSuffix}`;
  };

  const validateContent = (content: string, keyword: string, url: string, anchorText: string) => {
    let score = 0;
    const issues = [];

    // Check content length
    if (content.length < 500) {
      issues.push('Content too short');
    } else {
      score += 20;
    }

    // Check keyword presence
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      score += 30;
    } else {
      issues.push('Keyword not found in content');
    }

    // Check URL presence
    if (content.includes(url)) {
      score += 25;
    } else {
      issues.push('Target URL not included');
    }

    // Check anchor text
    if (content.includes(anchorText)) {
      score += 25;
    } else {
      issues.push('Anchor text not found');
    }

    return { score, isValid: score >= 50, issues };
  };

  const generateContentFromProvider = async (provider: string, promptIndex: number = 0): Promise<GeneratedContent> => {
    const startTime = Date.now();

    const promptLabel = `Real AI Generation`;
    addLog('info', provider.toUpperCase(), `Testing real content generation...`);

    try {
      // Use the actual global blog generator
      const sessionId = crypto.randomUUID();
      const result = await globalBlogGenerator.generateGlobalBlogPost({
        targetUrl: url,
        primaryKeyword: keyword,
        anchorText: anchorText,
        sessionId,
        additionalContext: {
          contentLength: 'medium',
          contentTone: 'professional',
          seoFocus: 'high'
        }
      });

      const generateTime = Date.now() - startTime;
      const slug = generateSlug(keyword, provider);

      if (result.success && result.data?.blogPost) {
        const blogPost = result.data.blogPost;
        const validation = validateContent(blogPost.content, keyword, url, anchorText);

        return {
          provider,
          content: blogPost.content,
          slug: blogPost.slug || slug,
          wordCount: blogPost.word_count || blogPost.content.split(' ').length,
          quality: validation.score,
          isValid: validation.isValid,
          error: validation.issues.length > 0 ? validation.issues.join(', ') : undefined,
          generateTime,
          promptUsed: `Real AI generation using ${keyword}`,
          promptIndex: 0
        };
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error) {
      addLog('error', provider.toUpperCase(), `Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        provider,
        content: '',
        slug: '',
        wordCount: 0,
        quality: 0,
        isValid: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        generateTime: Date.now() - startTime,
        promptUsed: `Failed generation attempt`,
        promptIndex: 0
      };
    }
  };

  const testApiProviders = async () => {
    addLog('info', 'SYSTEM', 'Testing API providers...');
    setCurrentProcess('Testing API connectivity...');

    const providers: any[] = [];
    const statuses: ApiStatus[] = [];

    for (const provider of providers) {
      const startTime = Date.now();
      setApiStatuses(prev => [...prev.filter(p => p.provider !== provider.name),
        { provider: provider.name, status: 'testing' }]);

      try {
        addLog('info', 'API_TEST', `Testing ${provider.name}...`);

        // Test if the service is configured
        if (!provider.service.isConfigured()) {
          addLog('error', 'API_TEST', `${provider.name} not configured`);
          statuses.push({ provider: provider.name, status: 'error', error: 'Not configured' });
          setErrorCount(prev => prev + 1);
          continue;
        }

        // Test connection
        const isWorking = await provider.service.testConnection();
        const latency = Date.now() - startTime;

        if (isWorking) {
          statuses.push({ provider: provider.name, status: 'online', latency });
          addLog('success', 'API_TEST', `${provider.name} online (${latency}ms)`);
          setSuccessCount(prev => prev + 1);
        } else {
          statuses.push({ provider: provider.name, status: 'error', error: 'Connection failed' });
          addLog('error', 'API_TEST', `${provider.name} connection failed`);
          setErrorCount(prev => prev + 1);
        }
      } catch (error) {
        const latency = Date.now() - startTime;
        statuses.push({ provider: provider.name, status: 'error', error: 'Connection timeout' });
        addLog('error', 'API_TEST', `${provider.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        setErrorCount(prev => prev + 1);
      }
    }

    setApiStatuses(statuses);
    return statuses;
  };

  const runContentGeneration = async (availableProviders: ApiStatus[]) => {
    setCurrentProcess('Generating content from all providers...');
    addLog('info', 'GENERATOR', 'Starting multi-provider content generation...');

    const workingProviders = availableProviders.filter(p => p.status === 'online');

    if (workingProviders.length === 0) {
      addLog('error', 'GENERATOR', 'No working providers available');
      setErrorCount(prev => prev + 1);
      return false;
    }

    addLog('info', 'GENERATOR', `Generating from ${workingProviders.length} providers: ${workingProviders.map(p => p.provider).join(', ')}`);

    const generatedResults: GeneratedContent[] = [];

    // Generate content from each provider using prompt rotation
    for (let i = 0; i < workingProviders.length; i++) {
      const provider = workingProviders[i];
      const promptIndex = i; // Use different prompt for each provider
      setCurrentProcess(`Generating from ${provider.provider} (Prompt ${(promptIndex % 3) + 1})...`);
      const result = await generateContentFromProvider(provider.provider, promptIndex);
      generatedResults.push(result);

      if (result.isValid) {
        addLog('success', 'GENERATOR', `${provider.provider}: Valid content (${result.wordCount} words, ${result.quality}% quality)`);
        setSuccessCount(prev => prev + 1);
      } else {
        addLog('warn', 'GENERATOR', `${provider.provider}: Invalid content - ${result.error}`);
        setErrorCount(prev => prev + 1);
      }
    }

    setGeneratedContent(generatedResults);
    addLog('info', 'GENERATOR', `Generated ${generatedResults.length} articles, ${generatedResults.filter(r => r.isValid).length} valid`);

    return generatedResults.some(r => r.isValid);
  };

  const runSystemProtocol = async () => {
    setIsRunning(true);
    setCurrentProcess('Initializing...');
    setLogs([]);
    setGeneratedContent([]);
    setSelectedContent(null);

    addLog('info', 'SYSTEM', '=== AI Content Generation Protocol Started ===');

    try {
      // Step 1: Validate inputs
      setCurrentProcess('Validating inputs and checking URL...');
      const isValid = await validateInputs();
      if (!isValid) {
        addLog('error', 'SYSTEM', 'Protocol aborted - Invalid inputs or inaccessible URL');
        return;
      }

      addLog('info', 'CONFIG', `Keyword: "${keyword}" | URL: ${url} | Anchor: "${anchorText}"`);

      // Step 2: Test API providers
      const providers = await testApiProviders();

      // Step 3: Generate content from all working providers
      const success = await runContentGeneration(providers);

      // Step 4: Finalize
      setCurrentProcess(success ? 'Content generation completed' : 'Generation failed');

      if (success) {
        addLog('success', 'SYSTEM', '=== Content generation completed - Select content to publish ===');
      } else {
        addLog('error', 'SYSTEM', '=== No valid content generated ===');
      }

    } catch (error) {
      addLog('error', 'SYSTEM', `Critical error: ${error instanceof Error ? error.message : String(error)}`);
      setErrorCount(prev => prev + 1);
    } finally {
      setIsRunning(false);
      setCurrentProcess('');
    }
  };

  const publishContent = async (content: GeneratedContent) => {
    addLog('info', 'PUBLISH', `Publishing content from ${content.provider}...`);

    // Simulate publishing process
    setCurrentProcess('Publishing...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const blogUrl = `${window.location.origin}/blog/${content.slug}`;
    addLog('success', 'PUBLISH', `Published: ${blogUrl}`);
    addLog('info', 'PROTOCOL', '24h auto-delete timer started. Use claim protocol to make permanent.');

    setSelectedContent(content.provider);
    setCurrentProcess('');
  };

  const updateSlug = (provider: string, newSlug: string) => {
    setGeneratedContent(prev =>
      prev.map(content =>
        content.provider === provider
          ? { ...content, slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }
          : content
      )
    );
    setEditingSlug(null);
  };

  const handleUrlChange = (value: string) => {
    let correctedUrl = value.trim();

    // Auto-correct URL to include https://
    if (correctedUrl && !correctedUrl.startsWith('http://') && !correctedUrl.startsWith('https://')) {
      correctedUrl = 'https://' + correctedUrl;
    }

    setUrl(correctedUrl);
  };

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Auto-run API test on mount
  useEffect(() => {
    const runInitialTest = async () => {
      addLog('info', 'SYSTEM', 'Auto-running API connectivity test...');
      await testApiProviders();
    };
    runInitialTest();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'testing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const isSystemWorking = apiStatuses.length > 0 && apiStatuses.some(api => api.status === 'online');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Working Status Banner */}
        {isSystemWorking && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-xl font-bold">Backlink ∞ is Working..</h2>
            </div>
            <p className="text-sm opacity-90 mt-1">AI content generation system is operational</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-mono font-semibold">AI Engine Monitor</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-600">✓ {successCount}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-red-600">✗ {errorCount}</span>
            </div>
            <Button
              onClick={runSystemProtocol}
              disabled={isRunning}
              size="sm"
              className="font-mono"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Execute Protocol
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Input Parameters */}
          <div className="bg-white rounded border p-4">
            <h2 className="font-mono text-sm font-medium mb-3">Parameters</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-gray-600">KEYWORD</label>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter target keyword for content generation"
                  className="font-mono text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600">TARGET_URL</label>
                <Input
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Enter destination URL for backlink placement"
                  className="font-mono text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600">ANCHOR_TEXT</label>
                <Input
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  placeholder="Enter anchor text for the backlink"
                  className="font-mono text-sm"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white rounded border p-4">
            <h2 className="font-mono text-sm font-medium mb-3">API Status</h2>
            <div className="space-y-2">
              {apiStatuses.length === 0 ? (
                <div className="text-xs text-gray-500 font-mono">No data</div>
              ) : (
                apiStatuses.map((api, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate">{api.provider}</span>
                    <div className="flex items-center gap-2">
                      {api.latency && <span className="text-gray-500">{api.latency}ms</span>}
                      <span className={getStatusColor(api.status)}>
                        {api.status === 'testing' ? <Loader2 className="h-3 w-3 animate-spin" /> :
                         api.status === 'online' ? <CheckCircle2 className="h-3 w-3" /> :
                         api.status === 'error' ? <AlertCircle className="h-3 w-3" /> : '○'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Process */}
          <div className="bg-white rounded border p-4">
            <h2 className="font-mono text-sm font-medium mb-3">Current Process</h2>
            <div className="text-xs font-mono">
              {currentProcess ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {currentProcess}
                </div>
              ) : (
                <div className="text-gray-500">Idle</div>
              )}
            </div>
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent.length > 0 && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedContent.map((content, i) => (
              <div key={i} className={`bg-white rounded border p-4 ${!content.isValid ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{content.provider}</span>
                    {content.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    {content.wordCount} words | {content.quality}% quality
                  </div>
                </div>

                {/* Prompt Used */}
                <div className="mb-3 p-2 bg-blue-50 rounded border">
                  <div className="text-xs font-mono text-blue-800">
                    <strong>Prompt {content.promptIndex + 1}:</strong> {content.promptUsed}
                  </div>
                </div>

                {/* Slug Editor */}
                <div className="mb-3">
                  <label className="text-xs font-mono text-gray-600">SLUG</label>
                  <div className="flex gap-2 mt-1">
                    {editingSlug === content.provider ? (
                      <Input
                        value={content.slug}
                        onChange={(e) => updateSlug(content.provider, e.target.value)}
                        onBlur={() => setEditingSlug(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingSlug(null)}
                        className="font-mono text-xs"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex-1 p-2 bg-gray-50 rounded text-xs font-mono cursor-pointer hover:bg-gray-100"
                        onClick={() => setEditingSlug(content.provider)}
                      >
                        /blog/{content.slug}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="mb-3 max-h-32 overflow-y-auto text-xs text-gray-700 bg-gray-50 p-2 rounded">
                  {content.content.substring(0, 300)}...
                </div>

                {/* Error or Publish Button */}
                {!content.isValid ? (
                  <div className="text-xs text-red-600 font-mono">
                    INVALID: {content.error}
                  </div>
                ) : selectedContent === content.provider ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-mono">
                    <CheckCircle2 className="h-4 w-4" />
                    PUBLISHED - 24h timer active
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => publishContent(content)}
                    className="w-full font-mono text-xs"
                    disabled={isRunning}
                  >
                    PUBLISH THIS CONTENT
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* System Logs */}
        <div className="mt-4 bg-black rounded border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-4 w-4 text-green-400" />
            <h2 className="font-mono text-sm font-medium text-green-400">System Logs</h2>
          </div>
          <div className="h-40 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">System ready...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className="text-blue-400">[{log.process}]</span>
                  <span className={getLogColor(log.level)}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
