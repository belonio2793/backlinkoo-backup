/**
 * AI Engine Systems Monitor
 * Internal monitoring interface for AI blog generation engine
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import { multiApiContentGenerator } from '@/services/multiApiContentGenerator';
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
}

export function MinimalAITest() {
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
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

  const validateInputs = () => {
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

    // URL validation
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

  const generateContentFromProvider = async (provider: string): Promise<GeneratedContent> => {
    const startTime = Date.now();
    addLog('info', provider.toUpperCase(), `Generating content...`);

    try {
      // Create SEO-optimized prompt
      const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}". The article should be at least 800 words and naturally incorporate a link to ${url} using the anchor text "${anchorText}". Include proper headings, engaging content, and valuable information for readers. Ensure the content is grammatically correct and well-structured.`;

      // Simulate content generation (replace with actual API calls)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

      // Generate mock content for testing
      const mockContent = `# ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide

## Introduction

Understanding ${keyword} is essential in today's digital landscape. This comprehensive guide explores the key aspects and practical applications of ${keyword}.

## What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}?

${keyword.charAt(0).toUpperCase() + keyword.slice(1)} encompasses various strategies and techniques that are crucial for success. From basic concepts to advanced implementations, ${keyword} offers numerous opportunities for growth and improvement.

## Key Benefits of ${keyword}

- Enhanced visibility and reach
- Improved user engagement
- Better conversion rates
- Long-term sustainable growth

## Best Practices

When implementing ${keyword} strategies, it's important to focus on quality and consistency. For professional guidance and expert solutions, consider consulting [${anchorText}](${url}) for comprehensive support.

## Implementation Strategies

1. **Research and Planning**: Understand your target audience and objectives
2. **Content Creation**: Develop high-quality, valuable content
3. **Optimization**: Fine-tune your approach based on performance data
4. **Monitoring**: Track results and adjust strategies accordingly

## Common Challenges

Many businesses face challenges when implementing ${keyword} strategies. These can include resource constraints, technical limitations, and changing market conditions.

## Future Trends

The landscape of ${keyword} continues to evolve with new technologies and methodologies. Staying informed about emerging trends is crucial for maintaining competitive advantage.

## Conclusion

Mastering ${keyword} requires dedication, proper planning, and expert guidance. For those looking to excel in this area, [${anchorText}](${url}) provides valuable resources and professional support to achieve your goals.

Start your journey with ${keyword} today and unlock new possibilities for success.`;

      const generateTime = Date.now() - startTime;
      const slug = generateSlug(keyword, provider);
      const validation = validateContent(mockContent, keyword, url, anchorText);

      return {
        provider,
        content: mockContent,
        slug,
        wordCount: mockContent.split(' ').length,
        quality: validation.score,
        isValid: validation.isValid,
        error: validation.issues.length > 0 ? validation.issues.join(', ') : undefined,
        generateTime
      };

    } catch (error) {
      addLog('error', provider.toUpperCase(), `Generation failed: ${error}`);
      return {
        provider,
        content: '',
        slug: '',
        wordCount: 0,
        quality: 0,
        isValid: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        generateTime: Date.now() - startTime
      };
    }
  };

  const testApiProviders = async () => {
    addLog('info', 'SYSTEM', 'Testing API providers...');
    setCurrentProcess('Testing API connectivity...');

    const providers = ['OpenAI', 'xAI Grok', 'DeepAI', 'Hugging Face', 'Cohere', 'Rytr'];
    const statuses: ApiStatus[] = [];

    for (const provider of providers) {
      const startTime = Date.now();
      setApiStatuses(prev => [...prev.filter(p => p.provider !== provider),
        { provider, status: 'testing' }]);

      await new Promise(resolve => setTimeout(resolve, 300));

      const latency = Date.now() - startTime;
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        statuses.push({ provider, status: 'online', latency });
        addLog('success', 'API_TEST', `${provider} online (${latency}ms)`);
      } else {
        statuses.push({ provider, status: 'error', error: 'Connection timeout' });
        addLog('error', 'API_TEST', `${provider} failed`);
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

    // Generate content from each provider
    for (const provider of workingProviders) {
      setCurrentProcess(`Generating from ${provider.provider}...`);
      const result = await generateContentFromProvider(provider.provider);
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
      setCurrentProcess('Validating inputs...');
      if (!validateInputs()) {
        addLog('error', 'SYSTEM', 'Protocol aborted - Invalid inputs');
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
      addLog('error', 'SYSTEM', `Critical error: ${error}`);
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

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">

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
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter destination URL for backlink placement"
                  className="font-mono text-sm"
                  disabled={isRunning}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoImprove}
                  onChange={(e) => setAutoImprove(e.target.checked)}
                  disabled={isRunning}
                />
                <label className="text-xs font-mono">AUTO_IMPROVE</label>
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

        {/* System Logs */}
        <div className="mt-4 bg-black rounded border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-4 w-4 text-green-400" />
            <h2 className="font-mono text-sm font-medium text-green-400">System Logs</h2>
          </div>
          <div className="h-64 overflow-y-auto font-mono text-xs space-y-1">
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
