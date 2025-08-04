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
  Fire,
  BarChart3,
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
      icon: <Fire className="h-6 w-6" />,
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
          <Fire className="h-4 w-4 mr-1" />
          {courseStats.streak} day streak
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Invested</p>
                <p className="text-3xl font-bold">{courseStats.completedTime}</p>
                <p className="text-sm text-muted-foreground">of {courseStats.totalTime}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={timeProgressPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{courseStats.averageScore}%</p>
                <p className="text-sm text-muted-foreground">Quiz Performance</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Rank</p>
                <p className="text-3xl font-bold">#{courseStats.rank}</p>
                <p className="text-sm text-muted-foreground">of {courseStats.totalStudents.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements ({achievements.filter(a => a.earned).length}/{achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.earned 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        achievement.earned 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        {achievement.earned ? (
                          <Badge className="bg-green-100 text-green-800">
                            Earned {achievement.earnedDate}
                          </Badge>
                        ) : achievement.progress !== undefined ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                              className="h-2"
                            />
                          </div>
                        ) : (
                          <Badge variant="secondary">Locked</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  This Week's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyActivity.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-12">{day.day}</span>
                      <div className="flex-1 mx-4">
                        <div className="flex space-x-1">
                          {Array.from({ length: Math.max(day.lessons, 1) }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-4 flex-1 rounded-sm ${
                                i < day.lessons ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {day.lessons} lessons
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fire className="h-5 w-5" />
                  Learning Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {courseStats.streak}
                  </div>
                  <p className="text-muted-foreground">Current Streak (Days)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Longest Streak</span>
                    <span className="text-sm font-medium">12 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Active</span>
                    <span className="text-sm font-medium">Today</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Study Days</span>
                    <span className="text-sm font-medium">28 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quiz Scores</span>
                    <span className="text-sm font-medium text-green-600">↗ +5% this week</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium text-green-600">↗ +12% this month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Study Time</span>
                    <span className="text-sm font-medium text-blue-600">→ Consistent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engagement</span>
                    <span className="text-sm font-medium text-green-600">↗ +8% this week</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Best Learning Time</span>
                      <span className="text-sm font-medium">9-11 AM</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You score 15% higher during morning sessions
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Preferred Difficulty</span>
                      <span className="text-sm font-medium">Intermediate</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      67% of completed lessons are intermediate level
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Fastest Improvement</span>
                      <span className="text-sm font-medium">Technical SEO</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quiz scores improved 25% in this area
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Focus on Consistency</h4>
                  <p className="text-sm text-blue-700">
                    You learn best with daily practice. Try to maintain your 7-day streak!
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Tackle Technical SEO Next</h4>
                  <p className="text-sm text-green-700">
                    Based on your progress, you're ready for more advanced technical concepts.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Practice Makes Perfect</h4>
                  <p className="text-sm text-yellow-700">
                    Consider retaking quizzes where you scored below 85% to reinforce learning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CourseProgressDashboard;
