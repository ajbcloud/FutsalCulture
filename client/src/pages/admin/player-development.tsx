import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHasFeature, UpgradePrompt } from '@/hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';
import AdminLayout from '@/components/admin-layout';
import { 
  User, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Mock data structure for development - will be replaced with real API calls
const mockSkillCategories = [
  { id: '1', name: 'Technical', sortOrder: 1 },
  { id: '2', name: 'Tactical', sortOrder: 2 },
  { id: '3', name: 'Physical', sortOrder: 3 },
  { id: '4', name: 'Psychological', sortOrder: 4 },
];

const mockSkills = [
  { id: '1', name: 'Ball Control', categoryId: '1', description: 'First touch and close control' },
  { id: '2', name: 'Passing', categoryId: '1', description: 'Short and long passing accuracy' },
  { id: '3', name: 'Decision Making', categoryId: '2', description: 'On-ball decision making under pressure' },
  { id: '4', name: 'Positioning', categoryId: '2', description: 'Spatial awareness and positioning' },
];

const mockPlayerAssessments = [
  { 
    id: '1', 
    playerId: 'player1', 
    playerName: 'Alex Smith',
    assessmentDate: '2025-08-05',
    assessedBy: 'Coach Johnson',
    overallComment: 'Good progress in technical skills',
    visibility: 'private'
  },
  { 
    id: '2', 
    playerId: 'player2', 
    playerName: 'Emma Davis',
    assessmentDate: '2025-08-03',
    assessedBy: 'Coach Johnson', 
    overallComment: 'Excellent tactical understanding',
    visibility: 'share_with_parent'
  },
];

const mockPlayerGoals = [
  {
    id: '1',
    playerId: 'player1',
    playerName: 'Alex Smith',
    title: 'Improve Ball Control',
    description: 'Focus on first touch and close control in training sessions',
    targetDate: '2025-09-15',
    status: 'active',
    createdBy: 'Coach Johnson'
  },
  {
    id: '2', 
    playerId: 'player2',
    playerName: 'Emma Davis',
    title: 'Leadership Development',
    description: 'Take on more leadership responsibilities during sessions',
    targetDate: '2025-08-30',
    status: 'active',
    createdBy: 'Coach Johnson'
  },
];

export default function PlayerDevelopment() {
  const { hasFeature, isLoading: featuresLoading } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  const [activeTab, setActiveTab] = useState('assessments');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // API queries for real data
  const { data: skillCategories = mockSkillCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/dev/skill-categories'],
    enabled: hasFeature,
  });

  const { data: skills = mockSkills, isLoading: skillsLoading } = useQuery({
    queryKey: ['/api/dev/skills'],
    enabled: hasFeature,
  });

  const { data: assessments = mockPlayerAssessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/dev/assessments'],
    enabled: hasFeature,
  });

  const { data: goals = mockPlayerGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/dev/goals'],
    enabled: hasFeature,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/dev/analytics'],
    enabled: hasFeature,
  });

  // Check if user has access to Player Development
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading features...</div>
      </div>
    );
  }

  if (!hasFeature) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Player Development</h1>
              <p className="text-muted-foreground">
                Comprehensive player assessment and development tracking
              </p>
            </div>
          </div>
          
          <UpgradePrompt 
            feature={FEATURE_KEYS.PLAYER_DEVELOPMENT}
            targetPlan="elite"
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Player Development</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track player progress and development with comprehensive assessments
          </p>
        </div>
        <Button data-testid="button-new-assessment" className="self-start sm:self-auto">
          <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
          <span className="text-sm md:text-base">New Assessment</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Assessments</CardTitle>
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <div className="text-lg md:text-2xl font-bold" data-testid="text-total-assessments">
              {mockPlayerAssessments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <div className="text-lg md:text-2xl font-bold" data-testid="text-active-goals">
              {mockPlayerGoals.filter(g => g.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Skill Categories</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <div className="text-lg md:text-2xl font-bold" data-testid="text-skill-categories">
              {mockSkillCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tech, Tactical, Physical, Psych
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <div className="text-lg md:text-2xl font-bold" data-testid="text-month-assessments">
              {mockPlayerAssessments.filter(a => 
                new Date(a.assessmentDate).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              New assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="assessments" data-testid="tab-assessments" className="text-xs sm:text-sm p-2">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals" className="text-xs sm:text-sm p-2">
            <span className="hidden sm:inline">Goals & Progress</span>
            <span className="sm:hidden">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills" className="text-xs sm:text-sm p-2">
            <span className="hidden sm:inline">Skills Framework</span>
            <span className="sm:hidden">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training" className="text-xs sm:text-sm p-2">
            <span className="hidden sm:inline">Training Plans</span>
            <span className="sm:hidden">Training</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements" className="text-xs sm:text-sm p-2">
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1 max-w-none sm:max-w-sm">
            <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search players, skills, or goals..."
              className="pl-7 sm:pl-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="button-filter" className="text-sm">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Filter</span>
            <span className="sm:hidden">Filter</span>
          </Button>
        </div>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base md:text-lg font-medium">Player Assessments</h3>
            <Button variant="outline" size="sm" data-testid="button-assessment-templates" className="self-start sm:self-auto text-sm">
              <span className="hidden sm:inline">Assessment Templates</span>
              <span className="sm:hidden">Templates</span>
            </Button>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {mockPlayerAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-sm md:text-base">
                      {assessment.playerName}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <Badge variant={assessment.visibility === 'private' ? 'secondary' : 'default'} className="text-xs self-start">
                        {assessment.visibility === 'private' ? 'Private' : 'Shared'}
                      </Badge>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {assessment.assessmentDate}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-xs md:text-sm">
                    Assessed by {assessment.assessedBy}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs md:text-sm mb-3 line-clamp-2">{assessment.overallComment}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-assessment-${assessment.id}`} className="text-xs">
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-edit-assessment-${assessment.id}`} className="text-xs">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base md:text-lg font-medium">Player Goals & Progress</h3>
            <Button variant="outline" size="sm" data-testid="button-new-goal" className="self-start sm:self-auto text-sm">
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              New Goal
            </Button>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {mockPlayerGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-sm md:text-base">
                      {goal.title}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'} className="text-xs self-start">
                        {goal.status}
                      </Badge>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Due: {goal.targetDate}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-xs md:text-sm">
                    {goal.playerName} • Set by {goal.createdBy}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs md:text-sm mb-3 line-clamp-2">{goal.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-goal-${goal.id}`} className="text-xs">
                      View Progress
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-edit-goal-${goal.id}`} className="text-xs">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skills Framework Tab */}
        <TabsContent value="skills" className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base md:text-lg font-medium">Skills Framework</h3>
            <Button variant="outline" size="sm" data-testid="button-manage-skills" className="self-start sm:self-auto text-sm">
              Manage Skills
            </Button>
          </div>
          
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {mockSkillCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="text-sm md:text-base">{category.name}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {mockSkills.filter(s => s.categoryId === category.id).length} skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {mockSkills
                      .filter(skill => skill.categoryId === category.id)
                      .map((skill) => (
                        <div key={skill.id} className="p-2 border rounded-md">
                          <div className="font-medium text-xs md:text-sm">{skill.name}</div>
                          <div className="text-xs text-muted-foreground">{skill.description}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Training Plans Tab */}
        <TabsContent value="training" className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base md:text-lg font-medium">Training Plans</h3>
            <Button variant="outline" size="sm" data-testid="button-new-training-plan" className="self-start sm:self-auto text-sm">
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              New Plan
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-sm md:text-base">Training Plans</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Create and manage individualized training plans for players
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No training plans created yet</p>
                <p className="text-xs md:text-sm">Create your first training plan to get started</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base md:text-lg font-medium">Player Achievements</h3>
            <Button variant="outline" size="sm" data-testid="button-manage-badges" className="self-start sm:self-auto text-sm">
              Manage Badges
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-sm md:text-base">Achievement System</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Track player milestones and award achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <Award className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No achievements awarded yet</p>
                <p className="text-xs md:text-sm">Set up achievement criteria and start tracking progress</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}