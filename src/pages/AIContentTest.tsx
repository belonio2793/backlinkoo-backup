/**
 * AI Content Test Page
 * Clean, Builder.io-inspired interface for instant backlink generation
 */

import { useState } from 'react';
import { SimplifiedAIContentTest } from '@/components/SimplifiedAIContentTest';
import { EnhancedAIContentTest } from '@/components/EnhancedAIContentTest';
import { Button } from '@/components/ui/button';
import { Settings, Zap } from 'lucide-react';

export default function AIContentTest() {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  if (viewMode === 'advanced') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="container mx-auto py-4">
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('simple')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Switch to Simple View
            </Button>
          </div>
          <EnhancedAIContentTest />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode('advanced')}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4" />
          Advanced
        </Button>
      </div>
      <SimplifiedAIContentTest />
    </div>
  );
}
