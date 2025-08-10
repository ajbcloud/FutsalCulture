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
  // Dark mode colors
  darkPrimaryButton: string;
  darkSecondaryButton: string;
  darkBackground: string;
  darkText: string;
  darkHeadingColor: string;
  darkDescriptionColor: string;
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
  
  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    // Light mode defaults
    lightPrimaryButton: '#2563eb',
    lightSecondaryButton: '#64748b',
    lightBackground: '#ffffff',
    lightText: '#111827',
    lightHeadingColor: '#111827',
    lightDescriptionColor: '#4b5563',
    // Dark mode defaults
    darkPrimaryButton: '#2563eb',
    darkSecondaryButton: '#64748b',
    darkBackground: '#0f172a',
    darkText: '#f8fafc',
    darkHeadingColor: '#f8fafc',
    darkDescriptionColor: '#cbd5e1'
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
        // Dark mode colors
        darkPrimaryButton: theme.darkPrimaryButton || '#2563eb',
        darkSecondaryButton: theme.darkSecondaryButton || '#64748b',
        darkBackground: theme.darkBackground || '#0f172a',
        darkText: theme.darkText || '#f8fafc',
        darkHeadingColor: theme.darkHeadingColor || '#f8fafc',
        darkDescriptionColor: theme.darkDescriptionColor || '#cbd5e1',
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
        darkPrimaryButton: '#2563eb',
        darkSecondaryButton: '#64748b',
        darkBackground: '#0f172a',
        darkText: '#f8fafc',
        darkHeadingColor: '#f8fafc',
        darkDescriptionColor: '#cbd5e1'
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Elite Features
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Exclusive customization and priority support for Elite plan users
            </p>
          </div>
        </div>

        {/* Elite Features Overview */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Elite Plan Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Palette className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Custom Colors & Themes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize your portal's appearance with your brand colors
              </p>
            </div>
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Feature Request Queue</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submit feature requests directly to our development team
              </p>
            </div>
            <div className="text-center">
              <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Priority Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Direct access to phone and email priority support
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
                      <Label htmlFor="lightPrimaryButton">Primary Button Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="lightSecondaryButton">Secondary Button Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="lightBackground">Background Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="lightText">Text Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="lightHeadingColor">Heading Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="lightDescriptionColor">Description Color</Label>
                      <div className="flex gap-2 mt-1">
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
                  </div>
                </TabsContent>

                {/* Dark Mode Settings */}
                <TabsContent value="dark" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="darkPrimaryButton">Primary Button Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="darkSecondaryButton">Secondary Button Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="darkBackground">Background Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="darkText">Text Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="darkHeadingColor">Heading Color</Label>
                      <div className="flex gap-2 mt-1">
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
                      <Label htmlFor="darkDescriptionColor">Description Color</Label>
                      <div className="flex gap-2 mt-1">
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
                            console.log('Dark description color text changed to:', e.target.value);
                            setThemeSettings(prev => ({
                              ...prev,
                              darkDescriptionColor: e.target.value
                            }));
                          }}
                          placeholder="#cbd5e1"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">Theme Preview</h3>
                <div className="text-xs text-gray-500 mb-2">
                  Debug: Dark Description Color = {themeSettings.darkDescriptionColor}
                </div>
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
                    >
                      <h4 className="font-semibold" style={{ color: themeSettings.lightHeadingColor }}>
                        Sample Portal Content
                      </h4>
                      <p 
                        style={{ 
                          color: themeSettings.lightDescriptionColor,
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem'
                        }}
                      >
                        This is how your custom theme will look in light mode with heading and description colors.
                        (Color: {themeSettings.lightDescriptionColor})
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ backgroundColor: themeSettings.lightPrimaryButton }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ backgroundColor: themeSettings.lightSecondaryButton }}
                        >
                          Secondary Button
                        </button>
                      </div>
                      <div className="mt-4">
                        <h5 className="font-medium mb-2" style={{ color: themeSettings.lightHeadingColor }}>
                          Section Heading
                        </h5>
                        <p 
                          style={{ 
                            color: themeSettings.lightDescriptionColor,
                            fontSize: '0.75rem',
                            lineHeight: '1rem'
                          }}
                        >
                          This shows how descriptions and smaller text will appear with the custom colors.
                          (Color: {themeSettings.lightDescriptionColor})
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
                      <h4 className="font-semibold" style={{ color: themeSettings.darkHeadingColor }}>
                        Sample Portal Content
                      </h4>
                      <p 
                        style={{ 
                          color: themeSettings.darkDescriptionColor,
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem'
                        }}
                      >
                        This is how your custom theme will look in dark mode with proper text visibility.
                        (Color: {themeSettings.darkDescriptionColor})
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ backgroundColor: themeSettings.darkPrimaryButton }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ backgroundColor: themeSettings.darkSecondaryButton }}
                        >
                          Secondary Button
                        </button>
                      </div>
                      <div className="mt-4">
                        <h5 className="font-medium mb-2" style={{ color: themeSettings.darkHeadingColor }}>
                          Section Heading
                        </h5>
                        <p 
                          style={{ 
                            color: themeSettings.darkDescriptionColor,
                            fontSize: '0.75rem',
                            lineHeight: '1rem'
                          }}
                        >
                          This shows how descriptions and smaller text will appear in dark mode.
                          (Color: {themeSettings.darkDescriptionColor})
                        </p>
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