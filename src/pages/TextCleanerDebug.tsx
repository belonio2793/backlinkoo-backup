import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TextCleanerButton, QuickCleanButton } from '@/components/TextCleanerButton';
import { TextCleanerControls } from '@/components/admin/TextCleanerControls';
import { useTextCleaner } from '@/hooks/useTextCleaner';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TextCleanerDebug() {
  const navigate = useNavigate();
  const { hasProblems, getStats } = useTextCleaner();
  
  // Test samples with problematic characters
  const [testSamples] = useState([
    'This text has \uFFFD replacement characters',
    'Text with null char\u0000 and BOM\uFEFF',
    'Zero-width\u200B\u200C\u200D spaces included',
    'Normal text without issues',
    'Mixed content \uFFFD with\u0000 multiple\uFEFF problems\u200B',
  ]);

  const [formInput, setFormInput] = useState('Test input with \uFFFD character');
  const [textareaInput, setTextareaInput] = useState('Textarea content\u0000 with problems\uFEFF');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <CardTitle>Text Cleaner Debug & Testing</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test and debug the automatic text cleaning functionality
                  </p>
                </div>
              </div>
              <Badge variant="outline">Debug Mode</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Test Samples */}
        <Card>
          <CardHeader>
            <CardTitle>Test Samples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testSamples.map((sample, index) => {
              const problems = hasProblems(sample);
              const stats = getStats(sample);
              
              return (
                <div key={index} className="border rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {problems ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-mono">Sample {index + 1}</span>
                      {problems && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.charCount} issues
                        </Badge>
                      )}
                    </div>
                    <TextCleanerButton
                      text={sample}
                      onCleaned={(cleaned, cleanStats) => {
                        console.log('Cleaned:', { original: sample, cleaned, stats: cleanStats });
                      }}
                      size="sm"
                    >
                      Clean Sample
                    </TextCleanerButton>
                  </div>
                  <div className="text-sm font-mono bg-muted p-2 rounded overflow-x-auto">
                    {sample}
                  </div>
                  {problems && (
                    <div className="text-xs text-muted-foreground">
                      Issues: {stats.removedChars.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Form Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Form Input Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Field</label>
                <Input
                  value={formInput}
                  onChange={(e) => setFormInput(e.target.value)}
                  placeholder="Type something with problematic characters..."
                />
                <div className="flex items-center gap-2">
                  {hasProblems(formInput) ? (
                    <Badge variant="destructive" className="text-xs">
                      Has Issues
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      Clean
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Textarea Field</label>
                <Textarea
                  value={textareaInput}
                  onChange={(e) => setTextareaInput(e.target.value)}
                  placeholder="Type something with problematic characters..."
                  className="min-h-[100px]"
                />
                <div className="flex items-center gap-2">
                  {hasProblems(textareaInput) ? (
                    <Badge variant="destructive" className="text-xs">
                      Has Issues
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      Clean
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2 flex-wrap">
              <QuickCleanButton type="forms" />
              <TextCleanerButton targetSelector="input, textarea">
                Clean All Form Fields
              </TextCleanerButton>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormInput('New text with \uFFFD problems\u0000');
                  setTextareaInput('Textarea with\uFEFF BOM and\u200B zero-width spaces');
                }}
              >
                Add Test Problems
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <QuickCleanButton type="document" />
              <QuickCleanButton type="forms" />
              <QuickCleanButton type="localStorage" />
              <QuickCleanButton type="sessionStorage" />
            </div>
          </CardContent>
        </Card>

        {/* Full Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Full Text Cleaner Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <TextCleanerControls />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
