/**
 * Template Deprecation Notice
 * Informs users that templates have been deprecated in favor of fresh AI generation
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, ArrowRight } from 'lucide-react';

export function TemplateDeprecationNotice() {
  const navigate = useNavigate();

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <strong className="text-amber-800">Templates Deprecated:</strong>
            <span className="text-amber-700 ml-2">
              All content is now generated fresh using AI to ensure uniqueness and quality.
            </span>
          </div>
          <Button 
            onClick={() => navigate('/ai-live')}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white ml-4"
          >
            <Brain className="mr-2 h-4 w-4" />
            Use AI Live Generator
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
