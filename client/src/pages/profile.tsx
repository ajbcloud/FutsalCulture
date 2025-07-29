import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Parent2InviteControls from "@/components/parent2-invite-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, X, User, Settings } from "lucide-react";
import { NotificationPreferences } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    phone: "",
    emailReminder: true,
    smsReminder: false,
  });

  // Notification preferences query
  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
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
        emailReminder: notificationPrefs.email ?? true, 
        smsReminder: notificationPrefs.sms ?? false,
      });
    }
    setIsEditing(false);
  };

  if (isLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Card className="bg-zinc-900 border-zinc-700 p-8 text-center">
            <p className="text-zinc-400">Please log in to view your profile.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-xl sm:text-2xl">Profile Information</CardTitle>
                  <p className="text-zinc-400 text-sm">Manage your account details and preferences</p>
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
                    className="border-zinc-600 text-zinc-400 hover:text-white text-sm px-3 py-2 h-9"
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
              <h3 className="text-xl font-semibold text-white flex items-center">
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
                    <Label className="text-sm font-medium text-zinc-300">
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
                        className="bg-zinc-800 border-zinc-600 text-white focus:border-blue-500"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <div className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-zinc-300 min-h-[40px] flex items-center">
                        {formData[field.key as keyof typeof formData] as string || (
                          <span className="text-zinc-500 italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
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
                    <div key={pref.key} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                      <div className="flex-1">
                        <h4 className={`font-medium ${isContactMissing ? 'text-zinc-500' : 'text-white'}`}>
                          {pref.title}
                          {isContactMissing && (
                            <span className="text-xs text-zinc-600 ml-2">
                              (Requires {pref.key === 'emailReminder' ? 'email address' : 'phone number'})
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-zinc-400 mt-1">{pref.description}</p>
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