import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  cleanSymbols, 
  hasProblematicSymbols, 
  autoCleanDOMText, 
  cleanFormInputs,
  globalSymbolCleaner 
} from '@/utils/symbolCleaner';
import { AlertTriangle, CheckCircle, RefreshCw, Zap, Search, Trash2 } from 'lucide-react';

export const SymbolCleanerDebug: React.FC = () => {
  const [testText, setTestText] = useState('Test text with symbols: ◊ ◆ ● ○ ■ □ ∞ ⚠️ ✅ 🔥');
  const [cleanedText, setCleanedText] = useState('');
  const [detectionResult, setDetectionResult] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    textNodes: number;
    cleaned: number;
    problematicFound: string[];
  } | null>(null);

  const handleTestClean = () => {
    const cleaned = cleanSymbols(testText);
    const hasProblems = hasProblematicSymbols(testText);
    
    setCleanedText(cleaned);
    setDetectionResult(hasProblems);
  };

  const handleFullPageScan = async () => {
    setIsScanning(true);
    setScanResults(null);

    // Simulate scanning with a delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Count text nodes and find problematic symbols
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    const problematicSymbols = new Set<string>();
    let node: Node | null;

    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
      const text = node.textContent || '';
      
      // Check for problematic symbols
      for (const char of text) {
        if (hasProblematicSymbols(char)) {
          problematicSymbols.add(char);
        }
      }
    }

    // Run the cleanup
    let cleanedCount = 0;
    textNodes.forEach((textNode) => {
      const originalText = textNode.textContent || '';
      const cleanedTextContent = cleanSymbols(originalText);
      
      if (originalText !== cleanedTextContent) {
        cleanedCount++;
      }
    });

    // Auto-clean the page
    autoCleanDOMText(document.body);
    cleanFormInputs();

    setScanResults({
      textNodes: textNodes.length,
      cleaned: cleanedCount,
      problematicFound: Array.from(problematicSymbols)
    });

    setIsScanning(false);
  };

  const handleGlobalCleanerToggle = () => {
    if ((globalSymbolCleaner as any).isEnabled) {
      globalSymbolCleaner.stop();
    } else {
      globalSymbolCleaner.start();
    }
  };

  const handleForceCleanup = () => {
    globalSymbolCleaner.runFullCleanup();
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Symbol Cleaner Debug Tool
          </CardTitle>
          <CardDescription>
            Test and manage the automatic Unicode symbol cleaning system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-text">Test Text</Label>
              <Textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text with problematic symbols..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <Button onClick={handleTestClean} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Test Symbol Detection & Cleaning
            </Button>

            {detectionResult !== null && (
              <Alert className={detectionResult ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                <AlertTriangle className={`h-4 w-4 ${detectionResult ? "text-orange-600" : "text-green-600"}`} />
                <AlertDescription className={detectionResult ? "text-orange-800" : "text-green-800"}>
                  {detectionResult 
                    ? "🔍 Problematic symbols detected in text" 
                    : "✅ No problematic symbols found"
                  }
                </AlertDescription>
              </Alert>
            )}

            {cleanedText && (
              <div>
                <Label>Cleaned Result</Label>
                <div className="mt-1 p-3 bg-gray-50 border rounded-md font-mono text-sm">
                  {cleanedText || <span className="text-gray-500">No changes needed</span>}
                </div>
              </div>
            )}
          </div>

          {/* Page Scan Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Full Page Analysis</h3>
            
            <Button 
              onClick={handleFullPageScan} 
              disabled={isScanning}
              className="w-full mb-4"
              variant="outline"
            >
              {isScanning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isScanning ? "Scanning & Cleaning..." : "Scan & Clean Entire Page"}
            </Button>

            {scanResults && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{scanResults.textNodes}</div>
                    <div className="text-sm text-blue-800">Text Nodes Scanned</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{scanResults.cleaned}</div>
                    <div className="text-sm text-green-800">Nodes Cleaned</div>
                  </div>
                </div>

                {scanResults.problematicFound.length > 0 && (
                  <div>
                    <Label>Problematic Symbols Found</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scanResults.problematicFound.map((symbol, index) => (
                        <Badge key={index} variant="destructive" className="font-mono">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Page scan complete! {scanResults.cleaned > 0 
                      ? `${scanResults.cleaned} text nodes were automatically cleaned.`
                      : "No problematic symbols found on this page."
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Global Controls */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Global Symbol Cleaner</h3>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleGlobalCleanerToggle}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {(globalSymbolCleaner as any).isEnabled ? "Disable" : "Enable"} Auto-Cleaner
              </Button>
              
              <Button 
                onClick={handleForceCleanup}
                variant="outline"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Force Full Cleanup
              </Button>
            </div>

            <div className="mt-3">
              <Badge 
                variant={(globalSymbolCleaner as any).isEnabled ? "default" : "secondary"}
                className="text-xs"
              >
                Status: {(globalSymbolCleaner as any).isEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">About Symbol Cleaning</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                This tool automatically detects and removes problematic Unicode symbols that can appear due to encoding issues, 
                character set problems, or copy-paste operations from different sources.
              </p>
              <p>
                <strong>Preserved symbols:</strong> The infinity symbol (∞) used in "Backlink ∞" branding is intentionally preserved.
              </p>
              <p>
                <strong>Auto-cleaning:</strong> When enabled, the system automatically scans and cleans new content as it's added to the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SymbolCleanerDebug;
