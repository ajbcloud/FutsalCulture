import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHasFeature, UpgradePrompt } from '@/hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Development</h1>
          <p className="text-muted-foreground">
            Track player progress and development with comprehensive assessments
          </p>
        </div>
        <Button data-testid="button-new-assessment">
          <Plus className="w-4 h-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assessments">
              {mockPlayerAssessments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-goals">
              {mockPlayerGoals.filter(g => g.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-skill-categories">
              {mockSkillCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Technical, Tactical, Physical, Psychological
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-month-assessments">
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments" data-testid="tab-assessments">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">
            Goals & Progress
          </TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">
            Skills Framework
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            Training Plans
          </TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Search and Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players, skills, or goals..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Player Assessments</h3>
            <Button variant="outline" size="sm" data-testid="button-assessment-templates">
              Assessment Templates
            </Button>
          </div>
          
          <div className="grid gap-4">
            {mockPlayerAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {assessment.playerName}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={assessment.visibility === 'private' ? 'secondary' : 'default'}>
                        {assessment.visibility === 'private' ? 'Private' : 'Shared with Parent'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {assessment.assessmentDate}
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    Assessed by {assessment.assessedBy}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{assessment.overallComment}</p>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" data-testid={`button-view-assessment-${assessment.id}`}>
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-edit-assessment-${assessment.id}`}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Player Goals & Progress</h3>
            <Button variant="outline" size="sm" data-testid="button-new-goal">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
          
          <div className="grid gap-4">
            {mockPlayerGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {goal.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Due: {goal.targetDate}
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    {goal.playerName} • Set by {goal.createdBy}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{goal.description}</p>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" data-testid={`button-view-goal-${goal.id}`}>
                      View Progress
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-edit-goal-${goal.id}`}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skills Framework Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Skills Framework</h3>
            <Button variant="outline" size="sm" data-testid="button-manage-skills">
              Manage Skills
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {mockSkillCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <CardDescription>
                    {mockSkills.filter(s => s.categoryId === category.id).length} skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockSkills
                      .filter(skill => skill.categoryId === category.id)
                      .map((skill) => (
                        <div key={skill.id} className="p-2 border rounded-md">
                          <div className="font-medium text-sm">{skill.name}</div>
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
        <TabsContent value="training" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Training Plans</h3>
            <Button variant="outline" size="sm" data-testid="button-new-training-plan">
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Training Plans</CardTitle>
              <CardDescription>
                Create and manage individualized training plans for players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No training plans created yet</p>
                <p className="text-sm">Create your first training plan to get started</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Player Achievements</h3>
            <Button variant="outline" size="sm" data-testid="button-manage-badges">
              Manage Badges
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Achievement System</CardTitle>
              <CardDescription>
                Track player milestones and award achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No achievements awarded yet</p>
                <p className="text-sm">Set up achievement criteria and start tracking progress</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}