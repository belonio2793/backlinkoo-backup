import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Target, Zap } from 'lucide-react';

interface WordCountProgressProps {
  targetWords: number;
  isGenerating: boolean;
  onComplete?: (finalCount: number) => void;
}

export function WordCountProgress({ targetWords, isGenerating, onComplete }: WordCountProgressProps) {
  const [currentWords, setCurrentWords] = useState(0);
  const [stage, setStage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentWords(0);
      setProgress(0);
      setStage('Ready to generate');
      return;
    }

    // Simulate word generation progress
    const stages = [
      { name: 'Analyzing keywords...', duration: 1000, words: 0 },
      { name: 'Creating outline...', duration: 1500, words: 50 },
      { name: 'Writing introduction...', duration: 2000, words: 150 },
      { name: 'Developing main content...', duration: 4000, words: Math.floor(targetWords * 0.7) },
      { name: 'Adding SEO optimization...', duration: 2000, words: Math.floor(targetWords * 0.9) },
      { name: 'Finalizing content...', duration: 1500, words: targetWords }
    ];

    let currentStageIndex = 0;
    let totalTime = 0;

    const runStage = (stageIndex: number) => {
      if (stageIndex >= stages.length) {
        setStage('Content generation complete!');
        setCurrentWords(targetWords);
        setProgress(100);
        if (onComplete) {
          onComplete(targetWords);
        }
        return;
      }

      const stage = stages[stageIndex];
      setStage(stage.name);

      const startWords = currentWords;
      const targetWordsForStage = stage.words;
      const startTime = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / stage.duration, 1);
        
        // Smooth word count animation
        const wordsProgress = startWords + (targetWordsForStage - startWords) * progressRatio;
        setCurrentWords(Math.floor(wordsProgress));
        
        // Overall progress calculation
        const overallProgress = ((stageIndex + progressRatio) / stages.length) * 100;
        setProgress(Math.min(overallProgress, 100));

        if (progressRatio < 1) {
          requestAnimationFrame(updateProgress);
        } else {
          // Move to next stage
          setTimeout(() => runStage(stageIndex + 1), 100);
        }
      };

      requestAnimationFrame(updateProgress);
    };

    // Start the first stage
    runStage(0);

  }, [isGenerating, targetWords, onComplete]);

  if (!isGenerating && currentWords === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Content Generation</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Zap className="h-3 w-3" />
              <span>AI Writing</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{stage}</span>
              <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-blue-100" 
            />
          </div>

          {/* Word Count */}
          <div className="flex items-center justify-between bg-white/60 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Words Generated</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {currentWords.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                of {targetWords.toLocaleString()} target
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          {isGenerating && (
            <div className="text-center text-xs text-gray-500">
              Estimated time remaining: {Math.max(0, Math.round((100 - progress) / 10))}s
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
