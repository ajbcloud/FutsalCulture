import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Parent2InviteControls from "@/components/parent2-invite-controls";
import { CustomAvatar } from "@/components/custom-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, User, Settings, Cookie, Shield, BarChart3 } from "lucide-react";
import { NotificationPreferences } from "@shared/schema";
import { format } from "date-fns";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { consent, updateConsent, resetConsent } = useCookieConsent();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    phone: "",
    avatarColor: "#2563eb",
    avatarTextColor: "", // Empty string means auto-contrast
    emailReminder: true,
    smsReminder: false,
  });

  // Notification preferences query
  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
    enabled: isAuthenticated,
  });

  // Consent documents query
  const { data: consentDocuments = [], isLoading: consentLoading } = useQuery<Array<{
    id: string;
    templateId: string;
    templateType: string;
    templateTitle: string;
    subjectName: string;
    subjectRole: string;
    signedAt: Date;
    signatureData: any;
  }>>({
    queryKey: ["/api/parent/consent-documents"],
    enabled: isAuthenticated,
  });

  // Initialize form data when user or preferences load
  useEffect(() => {
    if (user && notificationPrefs) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        avatarColor: user.avatarColor || "#2563eb",
        avatarTextColor: user.avatarTextColor || "",
        emailReminder: notificationPrefs.email ?? true,
        smsReminder: notificationPrefs.sms ?? false,
      });
    }
  }, [user, notificationPrefs]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Update user profile
      await apiRequest("PUT", "/api/auth/user", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        avatarColor: data.avatarColor,
        avatarTextColor: data.avatarTextColor || null, // Send null for auto-contrast
      });
      
      // Update notification preferences - only save if contact info is available
      await apiRequest("PUT", "/api/notification-preferences", {
        email: data.email?.trim() ? data.emailReminder : false,
        sms: data.phone?.trim() ? data.smsReminder : false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user && notificationPrefs) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        avatarColor: user.avatarColor || "#2563eb",
        avatarTextColor: user.avatarTextColor || "",
        emailReminder: notificationPrefs.email ?? true, 
        smsReminder: notificationPrefs.sms ?? false,
      });
    }
    setIsEditing(false);
  };

  if (isLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Card className="bg-card border-border p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-foreground text-xl sm:text-2xl">Profile Information</CardTitle>
                  <p className="text-muted-foreground text-sm">Manage your account details and preferences</p>
                </div>
              </div>
              
              {isEditing ? (
                <div className="flex gap-2 self-start sm:self-center">
                  <Button 
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-sm px-3 py-2 h-9"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{updateProfileMutation.isPending ? "Saving..." : "Save Changes"}</span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground text-sm px-3 py-2 h-9"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Cancel</span>
                    <span className="sm:hidden">Cancel</span>
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2 h-9 self-start sm:self-center"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Profile Fields */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "firstName", label: "First Name", type: "text" },
                  { key: "lastName", label: "Last Name", type: "text" },
                  { key: "email", label: "Email Address", type: "email" },
                  { key: "phone", label: "Phone Number", type: "tel" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {field.label}
                    </Label>
                    {isEditing ? (
                      <Input
                        type={field.type}
                        value={formData[field.key as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [field.key]: e.target.value 
                        })}
                        className="bg-input border-border text-foreground focus:border-primary"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <div className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground min-h-[40px] flex items-center">
                        {formData[field.key as keyof typeof formData] as string || (
                          <span className="text-muted-foreground italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Customization */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <User className="w-5 h-5 mr-2" />
                Avatar Appearance
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">Current Avatar:</div>
                  <CustomAvatar
                    src={user?.profileImageUrl || undefined}
                    alt={`${user?.firstName} ${user?.lastName}` || "User"}
                    fallbackText={user?.firstName?.[0]?.toUpperCase() || 'A'}
                    backgroundColor={formData.avatarColor}
                    textColor={formData.avatarTextColor || undefined}
                    size="lg"
                  />
                </div>
                
                {isEditing && (
                  <div className="flex flex-col gap-4 flex-1">
                    {/* Background Color */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Background Color
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={formData.avatarColor}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            avatarColor: e.target.value 
                          })}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                          data-testid="input-avatar-color"
                        />
                        <Input
                          type="text"
                          value={formData.avatarColor}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            avatarColor: e.target.value 
                          })}
                          placeholder="#2563eb"
                          className="flex-1 bg-input border-border text-foreground focus:border-primary"
                          data-testid="input-avatar-hex"
                        />
                      </div>
                    </div>
                    
                    {/* Text Color */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Text Color (optional)
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={formData.avatarTextColor || "#ffffff"}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            avatarTextColor: e.target.value 
                          })}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                          data-testid="input-avatar-text-color"
                        />
                        <Input
                          type="text"
                          value={formData.avatarTextColor}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            avatarTextColor: e.target.value 
                          })}
                          placeholder="Auto (leave empty)"
                          className="flex-1 bg-input border-border text-foreground focus:border-primary"
                          data-testid="input-avatar-text-hex"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ 
                            ...formData, 
                            avatarTextColor: "" 
                          })}
                          className="px-3 text-xs"
                        >
                          Auto
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Leave empty for automatic contrast detection
                      </div>
                    </div>
                  </div>
                )}
                
                {!isEditing && (
                  <div className="text-sm text-muted-foreground">
                    Edit your profile to customize avatar colors
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Notification Preferences
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    key: "emailReminder",
                    title: "Email Reminders",
                    description: "Receive booking confirmations and session reminders via email"
                  },
                  {
                    key: "smsReminder", 
                    title: "SMS Reminders",
                    description: "Receive booking confirmations and session reminders via SMS"
                  }
                ].map((pref) => {
                  // Determine if toggle should be disabled based on missing contact info
                  const isContactMissing = pref.key === 'emailReminder' 
                    ? !formData.email?.trim() 
                    : !formData.phone?.trim();
                  
                  const isToggleDisabled = !isEditing || isContactMissing;
                  
                  return (
                    <div key={pref.key} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                      <div className="flex-1">
                        <h4 className={`font-medium ${isContactMissing ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {pref.title}
                          {isContactMissing && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Requires {pref.key === 'emailReminder' ? 'email address' : 'phone number'})
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{pref.description}</p>
                      </div>
                      <Switch
                        checked={!isContactMissing && (formData[pref.key as keyof typeof formData] as boolean)}
                        onCheckedChange={(checked) => {
                          if (!isContactMissing) {
                            setFormData({ ...formData, [pref.key]: checked })
                          }
                        }}
                        disabled={isToggleDisabled}
                        className={`data-[state=checked]:bg-blue-600 ${isContactMissing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cookie Preferences */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <Cookie className="w-5 h-5 mr-2" />
                Cookie Preferences
              </h3>
              
              <div className="space-y-4">
                {consent ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          id: "necessary",
                          name: "Necessary",
                          description: "Essential cookies for core functionality",
                          required: true,
                          enabled: true,
                          icon: <Shield className="w-4 h-4" />
                        },
                        {
                          id: "functional", 
                          name: "Functional",
                          description: "Enhanced features and personalization",
                          required: false,
                          enabled: consent.categories?.functional || false,
                          icon: <Settings className="w-4 h-4" />
                        },
                        {
                          id: "analytics",
                          name: "Analytics", 
                          description: "Anonymous usage analytics",
                          required: false,
                          enabled: consent.categories?.analytics || false,
                          icon: <BarChart3 className="w-4 h-4" />
                        }
                      ].map((category) => (
                        <div key={category.id} className="p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {category.icon}
                              <span className="font-medium">{category.name}</span>
                              {category.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Switch
                              checked={category.enabled}
                              disabled={category.required}
                              onCheckedChange={(enabled) => {
                                if (!category.required) {
                                  const newCategories = {
                                    ...consent.categories,
                                    [category.id]: enabled
                                  };
                                  updateConsent(newCategories);
                                  toast({
                                    title: "Cookie preferences updated",
                                    description: `${category.name} cookies ${enabled ? 'enabled' : 'disabled'}`,
                                  });
                                }
                              }}
                              data-testid={`cookie-toggle-${category.id}`}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetConsent();
                          toast({
                            title: "Cookie preferences reset",
                            description: "The cookie consent banner will appear again on your next page load",
                          });
                        }}
                        data-testid="cookie-reset"
                      >
                        Reset Preferences
                      </Button>
                      <div className="text-xs text-muted-foreground flex items-center">
                        Last updated: {new Date(consent.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 border rounded-lg text-center bg-muted/30">
                    <Cookie className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't configured your cookie preferences yet. The cookie consent banner will appear to collect your preferences.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Consent Documents Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Consent Documents
              </h3>
              <p className="text-muted-foreground">View and download your signed consent forms</p>
              
              {consentLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : consentDocuments.length === 0 ? (
                <Card className="bg-card border border-border">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No consent documents found.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Consent documents will appear here after signing them during registration.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {consentDocuments.map((document) => (
                    <Card key={document.id} className="bg-card border border-border">
                      <CardHeader>
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            📄
                          </div>
                          {document.templateTitle}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {document.templateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Signed for:</span>
                          <span className="font-medium text-foreground">{document.subjectName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Role:</span>
                          <Badge variant="secondary" className="text-xs">
                            {document.subjectRole === 'player' ? 'Player' : 'Parent'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Signed:</span>
                          <span className="text-foreground">
                            {format(new Date(document.signedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Digital signature:</span>
                            <span className="font-mono">{document.signatureData?.signedName || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Parent 2 Section */}
            <div className="space-y-6">
              <Parent2InviteControls />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}