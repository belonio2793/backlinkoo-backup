import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  Star,
  Calendar,
  Award,
  Zap,
  Flame,
  BarChart3,Chart3,
  PieChart,
  Activity,
  Lightbulb
} from 'lucide-react';

interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  totalTime: string;
  completedTime: string;
  streak: number;
  rank: number;
  totalStudents: number;
  averageScore: number;
  certificatesEarned: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
}

export function CourseProgressDashboard() {
  const [courseStats] = useState<CourseStats>({
    totalLessons: 47,
    completedLessons: 12,
    totalTime: '53 hours',
    completedTime: '8.5 hours',
    streak: 7,
    rank: 156,
    totalStudents: 15420,
    averageScore: 89,
    certificatesEarned: 2
  });

  const [achievements] = useState<Achievement[]>([
    {
      id: 'first-lesson',
      title: 'Getting Started',
      description: 'Complete your first lesson',
      icon: <BookOpen className="h-6 w-6" />,
      earned: true,
      earnedDate: '2024-01-15'
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Study for 7 days in a row',
      icon: <Flame className={"h-6 w-6\" />,-6 w-6"} />,
      earned: true,
      earnedDate: '2024-01-22'
    },
    {
      id: 'module-master',
      title: 'Module Master',
      description: 'Complete an entire module',
      icon: <Trophy className="h-6 w-6" />,
      earned: true,
      earnedDate: '2024-01-28'
    },
    {
      id: 'speed-learner',
      title: 'Speed Learner',
      description: 'Complete 5 lessons in one day',
      icon: <Zap className="h-6 w-6" />,
      earned: false,
      progress: 3,
      maxProgress: 5
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Score 100% on 5 quizzes',
      icon: <Star className="h-6 w-6" />,
      earned: false,
      progress: 2,
      maxProgress: 5
    },
    {
      id: 'month-streak',
      title: 'Monthly Champion',
      description: 'Study for 30 days in a row',
      icon: <Calendar className="h-6 w-6" />,
      earned: false,
      progress: 7,
      maxProgress: 30
    }
  ]);

  const progressPercentage = Math.round((courseStats.completedLessons / courseStats.totalLessons) * 100);
  const timeProgressPercentage = Math.round((8.5 / 53) * 100);

  const weeklyActivity = [
    { day: 'Mon', lessons: 3 },
    { day: 'Tue', lessons: 2 },
    { day: 'Wed', lessons: 0 },
    { day: 'Thu', lessons: 4 },
    { day: 'Fri', lessons: 1 },
    { day: 'Sat', lessons: 2 },
    { day: 'Sun', lessons: 0 }
  ];

  const moduleProgress = [
    { name: 'SEO Fundamentals', completed: 6, total: 6, percentage: 100 },
    { name: 'Keyword Research', completed: 4, total: 8, percentage: 50 },
    { name: 'On-Page SEO', completed: 2, total: 10, percentage: 20 },
    { name: 'Technical SEO', completed: 0, total: 12, percentage: 0 },
    { name: 'Link Building', completed: 0, total: 8, percentage: 0 },
    { name: 'Analytics & Reporting', completed: 0, total: 5, percentage: 0 }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Learning Progress</h1>
          <p className="text-muted-foreground">Track your journey through the SEO Academy</p>
        </div>
        <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
          <Flame className={"h-4 w-4 mr-1\" />r-1\" />-1"} />
          {courseStats.streak} day streak
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Course Progress</p>
                <p className="text-3xl font-bold">{progressPercentage}%</p>
                <p className="text-sm text-muted-foreground">
                  {courseStats.completedLessons} of {courseStats.totalLessons} lessons
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={progressPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {/* Module Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Module Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moduleProgress.map((module, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{module.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {module.completed}/{module.total} lessons
                    </span>
                  </div>
                  <Progress value={module.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Complete Keyword Research Module</p>
                    <p className="text-sm text-muted-foreground">4 more lessons to go</p>
                  </div>
                </div>
                <Badge variant="outline">50% complete</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Earn First Certificate</p>
                    <p className="text-sm text-muted-foreground">Complete any full module</p>
                  </div>
                </div>
                <Badge variant="secondary">Locked</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}

export default CourseProgressDashboard;
