/**
 * AI Content Test Page
 * Clean, Builder.io-inspired interface for instant backlink generation
 */

import { useState } from 'react';
import { SimplifiedAIContentTest } from '@/components/SimplifiedAIContentTest';
import { EnhancedAIContentTest } from '@/components/EnhancedAIContentTest';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Zap, Settings } from 'lucide-react';

export default function AIContentTest() {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  if (viewMode === 'advanced') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="container mx-auto py-4">
          <div className="flex justify-center mb-4">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'simple' | 'advanced')}>
              <ToggleGroupItem value="simple" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Simple
              </ToggleGroupItem>
              <ToggleGroupItem value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <EnhancedAIContentTest />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'simple' | 'advanced')}>
          <ToggleGroupItem value="simple" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Simple
          </ToggleGroupItem>
          <ToggleGroupItem value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <SimplifiedAIContentTest />
    </div>
  );
}
