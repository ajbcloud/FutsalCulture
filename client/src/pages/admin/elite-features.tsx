import { useState } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Palette, MessageSquare, Sparkles, Users, Phone, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/admin-layout';
import { useHasFeature, FeatureGuard, UpgradePrompt } from '@/hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';

interface ThemeSettings {
  id?: string;
  // Light mode colors
  lightPrimaryButton: string;
  lightSecondaryButton: string;
  lightBackground: string;
  lightText: string;
  lightHeadingColor: string;
  lightDescriptionColor: string;
  lightNavTitle: string;
  lightNavText: string;
  lightNavActiveText: string;
  // Extended light mode colors
  lightPageTitle?: string;
  lightCardBackground?: string;
  lightCardTitle?: string;
  lightFeatureTitle?: string;
  lightFeatureDescription?: string;
  lightIconColor?: string;
  lightAccentColor?: string;
  lightBorderColor?: string;
  lightInputBackground?: string;
  lightSuccessColor?: string;
  lightWarningColor?: string;
  lightErrorColor?: string;
  // Dark mode colors
  darkPrimaryButton: string;
  darkSecondaryButton: string;
  darkBackground: string;
  darkText: string;
  darkHeadingColor: string;
  darkDescriptionColor: string;
  darkNavTitle: string;
  darkNavText: string;
  darkNavActiveText: string;
  // Extended dark mode colors
  darkPageTitle?: string;
  darkCardBackground?: string;
  darkCardTitle?: string;
  darkFeatureTitle?: string;
  darkFeatureDescription?: string;
  darkIconColor?: string;
  darkAccentColor?: string;
  darkBorderColor?: string;
  darkInputBackground?: string;
  darkSuccessColor?: string;
  darkWarningColor?: string;
  darkErrorColor?: string;
  // Legacy fields for backward compatibility
  primaryButton?: string;
  secondaryButton?: string;
  background?: string;
  text?: string;
  headingColor?: string;
  descriptionColor?: string;
}

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'received' | 'under_review' | 'approved' | 'in_development' | 'released';
  statusNotes?: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EliteFeatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFeature: hasThemeCustomization } = useHasFeature(FEATURE_KEYS.THEME_CUSTOMIZATION);
  
  // Theme Settings State - Updated to match standard application colors
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    // Light mode defaults - matching standard application theme
    lightPrimaryButton: '#3b82f6',      // 1. hsl(217, 91%, 60%) - Primary brand color
    lightSecondaryButton: '#f3f4f6',    // 2. hsl(214, 32%, 96%) - Input background
    lightBackground: '#ffffff',         // 3. hsl(0, 0%, 100%) - Main background
    lightText: '#0f172a',              // 4. hsl(222, 84%, 5%) - Primary text
    lightHeadingColor: '#0f172a',      // 5. hsl(222, 84%, 5%) - Primary text for headings
    lightDescriptionColor: '#64748b',   // 6. hsl(215, 16%, 35%) - Secondary text
    lightNavTitle: '#0f172a',          // 7. Primary text for nav title
    lightNavText: '#64748b',           // 8. Secondary text for nav
    lightNavActiveText: '#ffffff',      // 9. White text on active nav items
    // Extended light mode
    lightPageTitle: '#0f172a',         // 10. Primary text for page titles
    lightCardBackground: '#ffffff',     // 11. White card backgrounds
    lightCardTitle: '#0f172a',         // 12. Primary text for card titles
    lightFeatureTitle: '#0f172a',      // 13. Primary text for features
    lightFeatureDescription: '#64748b', // 14. Secondary text for descriptions
    lightIconColor: '#3b82f6',         // 15. Primary brand color for icons
    lightAccentColor: '#22c55e',       // Success/accent color
    lightBorderColor: '#e2e8f0',       // Default borders
    lightInputBackground: '#f8fafc',   // Input backgrounds
    lightSuccessColor: '#22c55e',      // Success states
    lightWarningColor: '#f59e0b',      // Warning states
    lightErrorColor: '#dc2626',        // Error states
    // Dark mode defaults - matching dark theme
    darkPrimaryButton: '#60a5fa',      // 1. hsl(217, 91%, 70%) - Lighter brand for contrast
    darkSecondaryButton: '#475569',     // 2. Dark secondary button
    darkBackground: '#0f1629',         // 3. hsl(222, 84%, 4%) - Main dark background
    darkText: '#ffffff',               // 4. Pure white text
    darkHeadingColor: '#ffffff',       // 5. White headings in dark mode
    darkDescriptionColor: '#cbd5e1',   // 6. hsl(210, 40%, 85%) - Light gray descriptions
    darkNavTitle: '#ffffff',           // 7. White nav title
    darkNavText: '#cbd5e1',           // 8. Light gray nav text
    darkNavActiveText: '#ffffff',       // 9. White active nav text
    // Extended dark mode
    darkPageTitle: '#ffffff',          // 10. White page titles
    darkCardBackground: '#1e293b',     // 11. hsl(217, 33%, 8%) - Elevated surfaces
    darkCardTitle: '#ffffff',          // 12. White card titles
    darkFeatureTitle: '#ffffff',       // 13. White feature titles
    darkFeatureDescription: '#cbd5e1', // 14. Light gray feature descriptions
    darkIconColor: '#60a5fa',          // 15. Lighter brand color for icons
    darkAccentColor: '#34d399',        // Success/accent color for dark mode
    darkBorderColor: '#374151',        // hsl(217, 33%, 25%) - Dark borders
    darkInputBackground: '#1e293b',    // Dark input backgrounds
    darkSuccessColor: '#34d399',       // Success states for dark mode
    darkWarningColor: '#fbbf24',       // Warning states for dark mode
    darkErrorColor: '#f87171',         // Error states for dark mode
  });

  // Feature Request State
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: ''
  });

  // Fetch current theme settings
  const { data: currentTheme, isLoading: themeLoading } = useQuery({
    queryKey: ['/api/theme']
  });

  // Update theme settings when data is fetched
  React.useEffect(() => {
    if (currentTheme && typeof currentTheme === 'object') {
      const theme = currentTheme as any;
      setThemeSettings({
        // Light mode colors
        lightPrimaryButton: theme.lightPrimaryButton || '#2563eb',
        lightSecondaryButton: theme.lightSecondaryButton || '#64748b',
        lightBackground: theme.lightBackground || '#ffffff',
        lightText: theme.lightText || '#111827',
        lightHeadingColor: theme.lightHeadingColor || '#111827',
        lightDescriptionColor: theme.lightDescriptionColor || '#4b5563',
        lightNavTitle: theme.lightNavTitle || '#111827',
        lightNavText: theme.lightNavText || '#6b7280',
        lightNavActiveText: theme.lightNavActiveText || '#ffffff',
        // Extended light mode
        lightPageTitle: theme.lightPageTitle || '#111827',
        lightCardBackground: theme.lightCardBackground || '#ffffff',
        lightCardTitle: theme.lightCardTitle || '#111827',
        lightFeatureTitle: theme.lightFeatureTitle || '#111827',
        lightFeatureDescription: theme.lightFeatureDescription || '#4b5563',
        lightIconColor: theme.lightIconColor || '#6366f1',
        lightAccentColor: theme.lightAccentColor || '#8b5cf6',
        lightBorderColor: theme.lightBorderColor || '#e5e7eb',
        // Dark mode colors
        darkPrimaryButton: theme.darkPrimaryButton || '#3b82f6',
        darkSecondaryButton: theme.darkSecondaryButton || '#64748b',
        darkBackground: theme.darkBackground || '#0f172a',
        darkText: theme.darkText || '#ffffff',
        darkHeadingColor: theme.darkHeadingColor || '#3b82f6',
        darkDescriptionColor: theme.darkDescriptionColor || '#e2e8f0',
        darkNavTitle: theme.darkNavTitle || '#ffffff',
        darkNavText: theme.darkNavText || '#e2e8f0',
        darkNavActiveText: theme.darkNavActiveText || '#ffffff',
        // Extended dark mode
        darkPageTitle: theme.darkPageTitle || '#5b8def',
        darkCardBackground: theme.darkCardBackground || '#1e293b',
        darkCardTitle: theme.darkCardTitle || '#ffffff',
        darkFeatureTitle: theme.darkFeatureTitle || '#ffffff',
        darkFeatureDescription: theme.darkFeatureDescription || '#d1d9e6',
        darkIconColor: theme.darkIconColor || '#818cf8',
        darkAccentColor: theme.darkAccentColor || '#a78bfa',
        darkBorderColor: theme.darkBorderColor || '#334155',
        // Legacy fallbacks
        primaryButton: theme.primaryButton || '#2563eb',
        secondaryButton: theme.secondaryButton || '#64748b',
        background: theme.background || '#ffffff',
        text: theme.text || '#1f2937',
        headingColor: theme.headingColor || '#111827',
        descriptionColor: theme.descriptionColor || '#6b7280'
      });
    }
  }, [currentTheme]);

  // Fetch feature requests
  const { data: featureRequests, isLoading: requestsLoading } = useQuery<FeatureRequest[]>({
    queryKey: ['/api/feature-requests']
  });

  // Theme settings mutation
  const themeSettingsMutation = useMutation({
    mutationFn: async (settings: ThemeSettings) => {
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to update theme');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Theme updated successfully",
        description: "Your custom theme settings have been applied."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/theme'] });
    },
    onError: () => {
      toast({
        title: "Error updating theme",
        description: "Failed to update theme settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Feature request mutation
  const featureRequestMutation = useMutation({
    mutationFn: async (request: { title: string; description: string }) => {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Failed to submit feature request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feature request submitted",
        description: "Your feature request has been sent to our development team."
      });
      setNewRequest({ title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/feature-requests'] });
    },
    onError: () => {
      toast({
        title: "Error submitting request",
        description: "Failed to submit feature request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Theme reset mutation
  const resetThemeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/theme', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to reset theme');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Theme reset successfully",
        description: "Theme has been reset to default settings."
      });
      setThemeSettings({
        lightPrimaryButton: '#2563eb',
        lightSecondaryButton: '#64748b',
        lightBackground: '#ffffff',
        lightText: '#111827',
        lightHeadingColor: '#111827',
        lightDescriptionColor: '#4b5563',
        lightNavTitle: '#111827',
        lightNavText: '#6b7280',
        lightNavActiveText: '#ffffff',
        // Extended light mode
        lightPageTitle: '#111827',
        lightCardBackground: '#ffffff',
        lightCardTitle: '#111827',
        lightFeatureTitle: '#111827',
        lightFeatureDescription: '#4b5563',
        lightIconColor: '#6366f1',
        lightAccentColor: '#8b5cf6',
        lightBorderColor: '#e5e7eb',
        darkPrimaryButton: '#3b82f6',
        darkSecondaryButton: '#64748b',
        darkBackground: '#0f172a',
        darkText: '#ffffff',
        darkHeadingColor: '#3b82f6',
        darkDescriptionColor: '#e2e8f0',
        darkNavTitle: '#ffffff',
        darkNavText: '#e2e8f0',
        darkNavActiveText: '#ffffff',
        // Extended dark mode
        darkPageTitle: '#5b8def',
        darkCardBackground: '#1e293b',
        darkCardTitle: '#ffffff',
        darkFeatureTitle: '#ffffff',
        darkFeatureDescription: '#d1d9e6',
        darkIconColor: '#818cf8',
        darkAccentColor: '#a78bfa',
        darkBorderColor: '#334155'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/theme'] });
    },
    onError: (error: any) => {
      console.error('Theme reset error:', error);
      toast({
        title: "Error resetting theme",
        description: "Failed to reset theme settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveTheme = () => {
    themeSettingsMutation.mutate(themeSettings);
  };

  const handleResetTheme = () => {
    resetThemeMutation.mutate();
  };

  const handleFeatureRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill in both title and description.",
        variant: "destructive"
      });
      return;
    }
    featureRequestMutation.mutate(newRequest);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_development': return 'bg-purple-100 text-purple-800';
      case 'released': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Received';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'in_development': return 'In Development';
      case 'released': return 'Released';
      default: return status;
    }
  };

  // Redirect if user doesn't have Elite features access
  if (!hasThemeCustomization) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Elite Features
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upgrade to Elite plan to access these exclusive features
              </p>
            </div>
          </div>
          
          <UpgradePrompt
            feature={FEATURE_KEYS.THEME_CUSTOMIZATION}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{
                color: 'var(--theme-page-title, rgb(17, 24, 39))'
              }}
              data-testid="page-title-10"
            >
              10. Elite Features
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Exclusive customization and priority support for Elite plan users
            </p>
          </div>
        </div>

        {/* Elite Features Overview */}
        <Card 
          data-testid="card-benefits-11"
          style={{ backgroundColor: 'var(--theme-card-background, white)' }}
        >
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2"
            style={{ color: 'var(--theme-card-title, rgb(17, 24, 39))' }}
            data-testid="card-title-12"
          >
            <Users className="h-5 w-5" />
            12. Elite Plan Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Palette 
                className="h-8 w-8 mx-auto mb-2" 
                style={{ color: 'var(--theme-icon-color, #6366f1)' }}
                data-testid="icon-palette-15"
              />
              <h3 
                className="font-semibold"
                style={{ color: 'var(--theme-feature-title, rgb(17, 24, 39))' }}
                data-testid="feature-title-13"
              >
                13. Custom Colors & Themes
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-feature-description, rgb(75, 85, 99))' }}
                data-testid="feature-description-14"
              >
                14. Customize your portal's appearance with your brand colors
              </p>
            </div>
            <div className="text-center">
              <MessageSquare 
                className="h-8 w-8 mx-auto mb-2" 
                style={{ color: 'var(--theme-icon-color, #6366f1)' }}
                data-testid="icon-message-15"
              />
              <h3 
                className="font-semibold"
                style={{ color: 'var(--theme-feature-title, rgb(17, 24, 39))' }}
                data-testid="feature-title-13"
              >
                13. Feature Request Queue
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-feature-description, rgb(75, 85, 99))' }}
                data-testid="feature-description-14"
              >
                14. Submit feature requests directly to our development team
              </p>
            </div>
            <div className="text-center">
              <Phone 
                className="h-8 w-8 mx-auto mb-2" 
                style={{ color: 'var(--theme-icon-color, #6366f1)' }}
                data-testid="icon-phone-15"
              />
              <h3 
                className="font-semibold"
                style={{ color: 'var(--theme-feature-title, rgb(17, 24, 39))' }}
                data-testid="feature-title-13"
              >
                13. Priority Support
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--theme-feature-description, rgb(75, 85, 99))' }}
                data-testid="feature-description-14"
              >
                14. Direct access to phone and email priority support
              </p>
            </div>
          </div>
        </CardContent>
        </Card>

        <Tabs defaultValue="theme" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="theme">Theme Customization</TabsTrigger>
            <TabsTrigger value="features">Feature Requests</TabsTrigger>
            <TabsTrigger value="support">Priority Support</TabsTrigger>
          </TabsList>

          {/* Theme Customization Tab */}
          <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Custom Colors & Themes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="light" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="light">Light Mode</TabsTrigger>
                  <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                </TabsList>

                {/* Light Mode Settings */}
                <TabsContent value="light" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lightPrimaryButton">1. Primary Button Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">1</span>
                        <Input
                          id="lightPrimaryButton"
                          type="color"
                          value={themeSettings.lightPrimaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightPrimaryButton: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightPrimaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightPrimaryButton: e.target.value
                          }))}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightSecondaryButton">2. Secondary Button Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">2</span>
                        <Input
                          id="lightSecondaryButton"
                          type="color"
                          value={themeSettings.lightSecondaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightSecondaryButton: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightSecondaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightSecondaryButton: e.target.value
                          }))}
                          placeholder="#64748b"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightBackground">3. Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">3</span>
                        <Input
                          id="lightBackground"
                          type="color"
                          value={themeSettings.lightBackground}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightBackground: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightBackground}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightBackground: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightText">4. Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">4</span>
                        <Input
                          id="lightText"
                          type="color"
                          value={themeSettings.lightText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightText: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightHeadingColor">5. Heading Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">5</span>
                        <Input
                          id="lightHeadingColor"
                          type="color"
                          value={themeSettings.lightHeadingColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightHeadingColor: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightHeadingColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightHeadingColor: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightDescriptionColor">6. Description Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">6</span>
                        <Input
                          id="lightDescriptionColor"
                          type="color"
                          value={themeSettings.lightDescriptionColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightDescriptionColor: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightDescriptionColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightDescriptionColor: e.target.value
                          }))}
                          placeholder="#4b5563"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightNavTitle">7. Navigation Title Color (Admin Portal)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">7</span>
                        <Input
                          id="lightNavTitle"
                          type="color"
                          value={themeSettings.lightNavTitle}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightNavTitle}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavTitle: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightNavText">8. Navigation Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">8</span>
                        <Input
                          id="lightNavText"
                          type="color"
                          value={themeSettings.lightNavText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightNavText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavText: e.target.value
                          }))}
                          placeholder="#6b7280"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightNavActiveText">9. Active Navigation Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">9</span>
                        <Input
                          id="lightNavActiveText"
                          type="color"
                          value={themeSettings.lightNavActiveText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavActiveText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightNavActiveText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightNavActiveText: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* New granular color controls */}
                    <div>
                      <Label htmlFor="lightPageTitle">10. Page Title Color (Elite Features)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">10</span>
                        <Input
                          id="lightPageTitle"
                          type="color"
                          value={themeSettings.lightPageTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightPageTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightPageTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightPageTitle: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightCardBackground">11. Card Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">11</span>
                        <Input
                          id="lightCardBackground"
                          type="color"
                          value={themeSettings.lightCardBackground || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightCardBackground: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightCardBackground || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightCardBackground: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightCardTitle">12. Card Title Color (Elite Plan Benefits)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">12</span>
                        <Input
                          id="lightCardTitle"
                          type="color"
                          value={themeSettings.lightCardTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightCardTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightCardTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightCardTitle: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightFeatureTitle">13. Feature Title Color (Custom Colors & Themes)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">13</span>
                        <Input
                          id="lightFeatureTitle"
                          type="color"
                          value={themeSettings.lightFeatureTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightFeatureTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightFeatureTitle || '#111827'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightFeatureTitle: e.target.value
                          }))}
                          placeholder="#111827"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightFeatureDescription">14. Feature Description Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">14</span>
                        <Input
                          id="lightFeatureDescription"
                          type="color"
                          value={themeSettings.lightFeatureDescription || '#4b5563'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightFeatureDescription: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightFeatureDescription || '#4b5563'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightFeatureDescription: e.target.value
                          }))}
                          placeholder="#4b5563"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lightIconColor">15. Icon Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">15</span>
                        <Input
                          id="lightIconColor"
                          type="color"
                          value={themeSettings.lightIconColor || '#6366f1'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightIconColor: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.lightIconColor || '#6366f1'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            lightIconColor: e.target.value
                          }))}
                          placeholder="#6366f1"
                          className="flex-1"
                        />
                      </div>
                    </div>

                  </div>
                </TabsContent>

                {/* Dark Mode Settings */}
                <TabsContent value="dark" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="darkPrimaryButton">1. Primary Button Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">1</span>
                        <Input
                          id="darkPrimaryButton"
                          type="color"
                          value={themeSettings.darkPrimaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkPrimaryButton: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkPrimaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkPrimaryButton: e.target.value
                          }))}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkSecondaryButton">2. Secondary Button Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">2</span>
                        <Input
                          id="darkSecondaryButton"
                          type="color"
                          value={themeSettings.darkSecondaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkSecondaryButton: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkSecondaryButton}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkSecondaryButton: e.target.value
                          }))}
                          placeholder="#64748b"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkBackground">3. Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">3</span>
                        <Input
                          id="darkBackground"
                          type="color"
                          value={themeSettings.darkBackground}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkBackground: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkBackground}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkBackground: e.target.value
                          }))}
                          placeholder="#0f172a"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkText">4. Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">4</span>
                        <Input
                          id="darkText"
                          type="color"
                          value={themeSettings.darkText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkText: e.target.value
                          }))}
                          placeholder="#f8fafc"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkHeadingColor">5. Heading Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">5</span>
                        <Input
                          id="darkHeadingColor"
                          type="color"
                          value={themeSettings.darkHeadingColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkHeadingColor: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkHeadingColor}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkHeadingColor: e.target.value
                          }))}
                          placeholder="#f8fafc"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkDescriptionColor">6. Description Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">6</span>
                        <Input
                          id="darkDescriptionColor"
                          type="color"
                          value={themeSettings.darkDescriptionColor}
                          onChange={(e) => {
                            console.log('Dark description color changed to:', e.target.value);
                            setThemeSettings(prev => ({
                              ...prev,
                              darkDescriptionColor: e.target.value
                            }));
                          }}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkDescriptionColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            console.log('Dark description color changed to:', newColor);
                            setThemeSettings(prev => {
                              const updated = {
                                ...prev,
                                darkDescriptionColor: newColor
                              };
                              console.log('Updated theme settings:', updated);
                              return updated;
                            });
                          }}
                          placeholder="#cbd5e1"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkNavTitle">7. Navigation Title Color (Admin Portal)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">7</span>
                        <Input
                          id="darkNavTitle"
                          type="color"
                          value={themeSettings.darkNavTitle}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkNavTitle}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavTitle: e.target.value
                          }))}
                          placeholder="#f8fafc"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkNavText">8. Navigation Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">8</span>
                        <Input
                          id="darkNavText"
                          type="color"
                          value={themeSettings.darkNavText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkNavText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavText: e.target.value
                          }))}
                          placeholder="#cbd5e1"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkNavActiveText">9. Active Navigation Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">9</span>
                        <Input
                          id="darkNavActiveText"
                          type="color"
                          value={themeSettings.darkNavActiveText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavActiveText: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkNavActiveText}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkNavActiveText: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* New granular color controls for dark mode */}
                    <div>
                      <Label htmlFor="darkPageTitle">10. Page Title Color (Elite Features)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">10</span>
                        <Input
                          id="darkPageTitle"
                          type="color"
                          value={themeSettings.darkPageTitle || '#5b8def'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkPageTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkPageTitle || '#5b8def'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkPageTitle: e.target.value
                          }))}
                          placeholder="#5b8def"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkCardBackground">11. Card Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">11</span>
                        <Input
                          id="darkCardBackground"
                          type="color"
                          value={themeSettings.darkCardBackground || '#1e293b'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkCardBackground: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkCardBackground || '#1e293b'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkCardBackground: e.target.value
                          }))}
                          placeholder="#1e293b"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkCardTitle">12. Card Title Color (Elite Plan Benefits)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">12</span>
                        <Input
                          id="darkCardTitle"
                          type="color"
                          value={themeSettings.darkCardTitle || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkCardTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkCardTitle || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkCardTitle: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkFeatureTitle">13. Feature Title Color (Custom Colors & Themes)</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">13</span>
                        <Input
                          id="darkFeatureTitle"
                          type="color"
                          value={themeSettings.darkFeatureTitle || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkFeatureTitle: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkFeatureTitle || '#ffffff'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkFeatureTitle: e.target.value
                          }))}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkFeatureDescription">14. Feature Description Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">14</span>
                        <Input
                          id="darkFeatureDescription"
                          type="color"
                          value={themeSettings.darkFeatureDescription || '#d1d9e6'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkFeatureDescription: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkFeatureDescription || '#d1d9e6'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkFeatureDescription: e.target.value
                          }))}
                          placeholder="#d1d9e6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="darkIconColor">15. Icon Color</Label>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">15</span>
                        <Input
                          id="darkIconColor"
                          type="color"
                          value={themeSettings.darkIconColor || '#818cf8'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkIconColor: e.target.value
                          }))}
                          className="w-20 h-10 p-1 border rounded"
                        />
                        <Input
                          value={themeSettings.darkIconColor || '#818cf8'}
                          onChange={(e) => setThemeSettings(prev => ({
                            ...prev,
                            darkIconColor: e.target.value
                          }))}
                          placeholder="#818cf8"
                          className="flex-1"
                        />
                      </div>
                    </div>

                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">Theme Preview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Light Mode Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
                      <span className="text-sm font-medium">Light Mode</span>
                    </div>
                    <div 
                      className="p-6 rounded-lg border space-y-4"
                      style={{ 
                        backgroundColor: themeSettings.lightBackground,
                        color: themeSettings.lightText
                      }}
                      data-testid="light-preview-3"
                    >
                      <h4 
                        key={`light-heading-${themeSettings.lightHeadingColor}`}
                        style={{ 
                          color: `${themeSettings.lightHeadingColor} !important`,
                          fontWeight: '600',
                          fontSize: '1.125rem',
                          margin: 0,
                          padding: 0,
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.lightHeadingColor
                        }}
                        className=""
                      >
                        5. Heading Color Preview
                      </h4>
                      <p 
                        key={`light-desc-${themeSettings.lightDescriptionColor}`}
                        style={{ 
                          color: `${themeSettings.lightDescriptionColor} !important`,
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem',
                          margin: 0,
                          padding: 0,
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.lightDescriptionColor
                        }}
                        className=""
                      >
                        6. Description Color - This text shows how descriptions and body text will appear in light mode.
                      </p>
                      <div 
                        key={`light-text-${themeSettings.lightText}`}
                        style={{ 
                          color: `${themeSettings.lightText} !important`,
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.lightText
                        }}
                        className=""
                      >
                        4. Text Color - General text content uses this color.
                      </div>
                      
                      {/* Navigation Preview */}
                      <div className="mt-4 p-3 bg-gray-50 rounded border">
                        <div className="text-xs text-gray-500 mb-2">Navigation Preview:</div>
                        <div 
                          key={`light-nav-title-${themeSettings.lightNavTitle}`}
                          style={{ 
                            color: `${themeSettings.lightNavTitle} !important`,
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightNavTitle
                          }}
                        >
                          7. Admin Portal
                        </div>
                        <div className="space-y-1">
                          <div 
                            key={`light-nav-text-${themeSettings.lightNavText}`}
                            style={{ 
                              color: `${themeSettings.lightNavText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0',
                              transition: 'color 0.2s ease',
                              WebkitTextFillColor: themeSettings.lightNavText
                            }}
                          >
                            Dashboard
                          </div>
                          <div 
                            key={`light-nav-active-${themeSettings.lightPrimaryButton}-${themeSettings.lightNavActiveText}`}
                            style={{ 
                              backgroundColor: `${themeSettings.lightPrimaryButton} !important`,
                              color: `${themeSettings.lightNavActiveText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              transition: 'all 0.2s ease',
                              WebkitTextFillColor: themeSettings.lightNavActiveText
                            }}
                          >
                            9. Sessions (Active)
                          </div>
                          <div 
                            key={`light-nav-text2-${themeSettings.lightNavText}`}
                            style={{ 
                              color: `${themeSettings.lightNavText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0',
                              transition: 'color 0.2s ease',
                              WebkitTextFillColor: themeSettings.lightNavText
                            }}
                          >
                            8. Players
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          style={{ 
                            backgroundColor: themeSettings.lightPrimaryButton,
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'default'
                          }}
                        >
                          1. Primary Button Color
                        </button>
                        <button
                          style={{ 
                            backgroundColor: themeSettings.lightSecondaryButton,
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'default'
                          }}
                        >
                          2. Secondary Button Color
                        </button>
                      </div>
                      
                      {/* New Granular Preview Elements */}
                      <div className="mt-4 p-3 border rounded" style={{ backgroundColor: themeSettings.lightCardBackground || '#ffffff' }}>
                        <div className="text-xs text-gray-500 mb-2">11. Card Background & Components:</div>
                        <h5 
                          key={`light-card-title-${themeSettings.lightCardTitle}`}
                          style={{ 
                            color: `${themeSettings.lightCardTitle || '#111827'} !important`,
                            fontWeight: '600',
                            fontSize: '1rem',
                            margin: '0 0 0.5rem 0',
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightCardTitle || '#111827'
                          }}
                          className=""
                        >
                          12. Card Title Color
                        </h5>
                        <h6 
                          key={`light-feature-title-${themeSettings.lightFeatureTitle}`}
                          style={{ 
                            color: `${themeSettings.lightFeatureTitle || '#111827'} !important`,
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            margin: '0 0 0.25rem 0',
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightFeatureTitle || '#111827'
                          }}
                          className=""
                        >
                          13. Feature Title Color
                        </h6>
                        <p 
                          key={`light-feature-desc-${themeSettings.lightFeatureDescription}`}
                          style={{ 
                            color: `${themeSettings.lightFeatureDescription || '#4b5563'} !important`,
                            fontSize: '0.8rem',
                            lineHeight: '1.2rem',
                            margin: '0 0 0.5rem 0',
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightFeatureDescription || '#4b5563'
                          }}
                          className=""
                        >
                          14. Feature Description Color - Small descriptive text
                        </p>
                        <div className="flex items-center gap-2">
                          <div 
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%',
                              backgroundColor: themeSettings.lightIconColor || '#6366f1'
                            }}
                          ></div>
                          <span className="text-xs" style={{ color: themeSettings.lightFeatureDescription || '#4b5563' }}>
                            15. Icon Color Preview
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 
                          key={`light-heading-small-${themeSettings.lightHeadingColor}`}
                          style={{ 
                            color: `${themeSettings.lightHeadingColor} !important`,
                            fontWeight: '500',
                            fontSize: '1rem',
                            margin: '0 0 0.5rem 0',
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightHeadingColor
                          }}
                          className=""
                        >
                          5. Heading Color (smaller)
                        </h5>
                        <p 
                          key={`light-desc-small-${themeSettings.lightDescriptionColor}`}
                          style={{ 
                            color: `${themeSettings.lightDescriptionColor} !important`,
                            fontSize: '0.75rem',
                            lineHeight: '1rem',
                            margin: 0,
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.lightDescriptionColor
                          }}
                          className=""
                        >
                          Description Color - smaller text and details will use this color.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dark Mode Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-800 border-2 border-gray-600 rounded"></div>
                      <span className="text-sm font-medium">Dark Mode</span>
                    </div>
                    <div 
                      className="p-6 rounded-lg border border-gray-700 space-y-4"
                      style={{ 
                        backgroundColor: themeSettings.darkBackground,
                        color: themeSettings.darkText
                      }}
                    >
                      <h4 
                        key={`dark-heading-${themeSettings.darkHeadingColor}`}
                        style={{ 
                          color: `${themeSettings.darkHeadingColor} !important`,
                          fontWeight: '600',
                          fontSize: '1.125rem',
                          margin: 0,
                          padding: 0,
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.darkHeadingColor
                        }}
                        className=""
                      >
                        5. Heading Color Preview
                      </h4>
                      <p 
                        key={`dark-desc-${themeSettings.darkDescriptionColor}`}
                        style={{ 
                          color: `${themeSettings.darkDescriptionColor} !important`,
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem',
                          margin: 0,
                          padding: 0,
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.darkDescriptionColor
                        }}
                        className=""
                      >
                        6. Description Color - This text shows how descriptions and body text will appear in dark mode.
                      </p>
                      <div 
                        key={`dark-text-${themeSettings.darkText}`}
                        style={{ 
                          color: `${themeSettings.darkText} !important`,
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                          transition: 'color 0.2s ease',
                          WebkitTextFillColor: themeSettings.darkText
                        }}
                        className=""
                      >
                        4. Text Color - General text content uses this color.
                      </div>
                      
                      {/* Navigation Preview */}
                      <div className="mt-4 p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="text-xs" style={{ color: themeSettings.darkDescriptionColor, marginBottom: '0.5rem' }}>Navigation Preview:</div>
                        <div 
                          key={`dark-nav-title-${themeSettings.darkNavTitle}`}
                          style={{ 
                            color: `${themeSettings.darkNavTitle} !important`,
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkNavTitle
                          }}
                        >
                          7. Admin Portal
                        </div>
                        <div className="space-y-1">
                          <div 
                            key={`dark-nav-text-${themeSettings.darkNavText}`}
                            style={{ 
                              color: `${themeSettings.darkNavText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0',
                              transition: 'color 0.2s ease',
                              WebkitTextFillColor: themeSettings.darkNavText
                            }}
                          >
                            8. Dashboard
                          </div>
                          <div 
                            key={`dark-nav-active-${themeSettings.darkPrimaryButton}-${themeSettings.darkNavActiveText}`}
                            style={{ 
                              backgroundColor: `${themeSettings.darkPrimaryButton} !important`,
                              color: `${themeSettings.darkNavActiveText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              transition: 'all 0.2s ease',
                              WebkitTextFillColor: themeSettings.darkNavActiveText
                            }}
                          >
                            9. Sessions (Active)
                          </div>
                          <div 
                            key={`dark-nav-text2-${themeSettings.darkNavText}`}
                            style={{ 
                              color: `${themeSettings.darkNavText} !important`,
                              fontSize: '0.875rem',
                              padding: '0.25rem 0',
                              transition: 'color 0.2s ease',
                              WebkitTextFillColor: themeSettings.darkNavText
                            }}
                          >
                            8. Players
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <button
                          style={{ 
                            backgroundColor: themeSettings.darkPrimaryButton,
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'default'
                          }}
                        >
                          1. Primary Button Color
                        </button>
                        <button
                          style={{ 
                            backgroundColor: themeSettings.darkSecondaryButton,
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: 'default'
                          }}
                        >
                          2. Secondary Button Color
                        </button>
                      </div>
                      <div className="mt-4">
                        <h5 
                          key={`dark-heading-small-${themeSettings.darkHeadingColor}`}
                          style={{ 
                            color: `${themeSettings.darkHeadingColor} !important`,
                            fontWeight: '500',
                            fontSize: '1rem',
                            margin: '0 0 0.5rem 0',
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkHeadingColor
                          }}
                          className=""
                        >
                          5. Heading Color (smaller)
                        </h5>
                        <p 
                          key={`dark-desc-small-${themeSettings.darkDescriptionColor}`}
                          style={{ 
                            color: `${themeSettings.darkDescriptionColor} !important`,
                            fontSize: '0.75rem',
                            lineHeight: '1rem',
                            margin: 0,
                            padding: 0,
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkDescriptionColor
                          }}
                          className=""
                        >
                          6. Description Color - smaller text and details will use this color.
                        </p>
                      </div>
                      
                      {/* Missing elements 10-15 for dark mode */}
                      <div className="mt-4 space-y-2">
                        <div 
                          key={`dark-page-title-${themeSettings.darkPageTitle}`}
                          style={{ 
                            color: `${themeSettings.darkPageTitle || themeSettings.darkHeadingColor} !important`,
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            padding: '0.5rem 0',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkPageTitle || themeSettings.darkHeadingColor
                          }}
                        >
                          10. Page Title - main page headings
                        </div>
                        
                        <div 
                          key={`dark-card-bg-${themeSettings.darkCardBackground}`}
                          style={{ 
                            backgroundColor: themeSettings.darkCardBackground || '#1e293b',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            border: `1px solid ${themeSettings.darkBorderColor || '#374151'}`,
                            color: `${themeSettings.darkText} !important`,
                            transition: 'all 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkText
                          }}
                        >
                          11. Card Background - cards, modals, and elevated surfaces
                        </div>
                        
                        <div 
                          key={`dark-card-title-${themeSettings.darkCardTitle}-${themeSettings.darkCardBackground}`}
                          style={{ 
                            color: `${themeSettings.darkCardTitle || themeSettings.darkText} !important`,
                            backgroundColor: themeSettings.darkCardBackground || '#1e293b',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            border: `1px solid ${themeSettings.darkBorderColor || '#374151'}`,
                            transition: 'all 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkCardTitle || themeSettings.darkText
                          }}
                        >
                          12. Card Title - titles within cards and containers
                        </div>
                        
                        <div 
                          key={`dark-feature-title-${themeSettings.darkFeatureTitle}`}
                          style={{ 
                            color: `${themeSettings.darkFeatureTitle || themeSettings.darkHeadingColor} !important`,
                            padding: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkFeatureTitle || themeSettings.darkHeadingColor
                          }}
                        >
                          13. Feature Title - main feature headings
                        </div>
                        
                        <div 
                          key={`dark-feature-desc-${themeSettings.darkFeatureDescription}`}
                          style={{ 
                            color: `${themeSettings.darkFeatureDescription || themeSettings.darkDescriptionColor} !important`,
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            fontStyle: 'italic',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkFeatureDescription || themeSettings.darkDescriptionColor
                          }}
                        >
                          14. Feature Description - explanatory text and feature details
                        </div>
                        
                        <div 
                          key={`dark-icon-color-${themeSettings.darkIconColor}`}
                          style={{ 
                            color: `${themeSettings.darkIconColor || themeSettings.darkPrimaryButton} !important`,
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'color 0.2s ease',
                            WebkitTextFillColor: themeSettings.darkIconColor || themeSettings.darkPrimaryButton
                          }}
                        >
                          <svg style={{ color: themeSettings.darkIconColor || themeSettings.darkPrimaryButton }} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <svg style={{ color: themeSettings.darkIconColor || themeSettings.darkPrimaryButton }} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          15. Icon Color - icons and interactive elements
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleSaveTheme}
                    disabled={themeSettingsMutation.isPending}
                    className="flex-1"
                  >
                    {themeSettingsMutation.isPending ? 'Saving...' : 'Save Theme'}
                  </Button>
                  <Button
                    onClick={handleResetTheme}
                    disabled={resetThemeMutation.isPending}
                    variant="outline"
                  >
                    {resetThemeMutation.isPending ? 'Resetting...' : 'Reset to Default'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Feature Requests Tab */}
          <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit New Request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Submit Feature Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requestTitle">Feature Title</Label>
                  <Input
                    id="requestTitle"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Enter feature title..."
                    className="mt-1"
                    data-testid="input-feature-title"
                  />
                </div>

                <div>
                  <Label htmlFor="requestDescription">Description</Label>
                  <Textarea
                    id="requestDescription"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Describe the feature you'd like to see..."
                    rows={4}
                    className="mt-1"
                    data-testid="textarea-feature-description"
                  />
                </div>

                <Button 
                  onClick={handleFeatureRequest}
                  disabled={featureRequestMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-request"
                >
                  {featureRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </CardContent>
            </Card>

            {/* Request History */}
            <Card>
              <CardHeader>
                <CardTitle>Your Feature Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading requests...</div>
                ) : !featureRequests?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    No feature requests yet. Submit your first request!
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {featureRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{request.title}</h4>
                          <Badge 
                            className={`${getStatusColor(request.status)} text-xs`}
                            data-testid={`status-${request.status}-${request.id}`}
                          >
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {request.description}
                        </p>
                        {request.statusNotes && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm">
                            <strong>Status Notes:</strong> {request.statusNotes}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          {/* Priority Support Tab */}
          <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Priority Support Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Phone className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200">
                        Phone Support
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Call us directly for immediate assistance
                      </p>
                      <div className="font-mono text-lg text-green-800 dark:text-green-200 mt-1">
                        +1 (555) 123-4567
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Mail className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                        Priority Email
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Get priority responses within 2 hours
                      </p>
                      <div className="font-mono text-lg text-blue-800 dark:text-blue-200 mt-1">
                        elite@futsalculture.com
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Support Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span>8:00 AM - 8:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span>10:00 AM - 6:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span>12:00 PM - 6:00 PM EST</span>
                    </div>
                  </div>

                  <Separator />

                  <h3 className="font-semibold">Response Times</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Phone Calls:</span>
                      <span className="text-green-600">Immediate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority Email:</span>
                      <span className="text-blue-600">Within 2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feature Requests:</span>
                      <span className="text-purple-600">Within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Elite Support Benefits
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Dedicated support team familiar with your account</li>
                  <li>• Priority queue for all support requests</li>
                  <li>• Direct phone line access during business hours</li>
                  <li>• Advanced troubleshooting and configuration assistance</li>
                  <li>• Custom training sessions available upon request</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}