import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedCourseInterface } from './EnhancedCourseInterface';
import { CourseProgressDashboard } from './CourseProgressDashboard';
import { StreamlinedPremiumButton } from './StreamlinedPremiumButton';
import {
  BookOpen,
  BarChart3,
  Crown,
  Play,
  Trophy
} from 'lucide-react';

interface CompleteCourseExperienceProps {
  className?: string;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export function CompleteCourseExperience({ className, isPremium, onUpgrade }: CompleteCourseExperienceProps) {
  const { isPremium: authIsPremium } = useAuth();
  const effectiveIsPremium = isPremium ?? authIsPremium;
  const [activeTab, setActiveTab] = useState('course');

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      console.log('Upgrade to Premium triggered');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="course" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Content
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Progress Dashboard
            </TabsTrigger>
          </TabsList>

          {!effectiveIsPremium && (
            <StreamlinedPremiumButton
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              context="course-header"
            >
              <Crown className="h-4 w-4 mr-2" />
              Unlock Full Course
            </StreamlinedPremiumButton>
          )}
        </div>

        <TabsContent value="course" className="mt-0">
          <EnhancedCourseInterface
            isPremium={effectiveIsPremium}
            onUpgrade={handleUpgrade}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-0">
          {effectiveIsPremium ? (
            <CourseProgressDashboard />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Premium Feature</h3>
                <p className="text-gray-600 max-w-md">
                  Unlock detailed progress tracking, achievements, learning analytics, and personalized recommendations with Premium.
                </p>
              </div>
              <StreamlinedPremiumButton
                size="lg"
                context="progress-dashboard"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </StreamlinedPremiumButton>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CompleteCourseExperience;
