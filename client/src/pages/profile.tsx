import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Bell, Phone, Mail, Settings } from "lucide-react";
import { NotificationPreferences } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Profile data queries
  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
    enabled: isAuthenticated,
  });

  // Update notification preferences mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      return await apiRequest("POST", "/api/notification-preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });

  if (isLoading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You must be logged in to view your profile.
            </p>
            <Button asChild className="w-full">
              <a href="/api/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNotificationToggle = (field: keyof NotificationPreferences, value: boolean) => {
    if (!notificationPrefs) return;
    
    updateNotificationMutation.mutate({
      [field]: value,
    });
  };

  return (
    <div className="min-h-screen bg-[#18181b]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">
                    {user?.firstName} {user?.lastName}
                  </CardTitle>
                  <p className="text-zinc-400 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {user?.email}
                  </p>
                  {user?.phoneNumber && (
                    <p className="text-zinc-400 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {user?.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">First Name</Label>
                  <Input
                    value={user?.firstName || ""}
                    disabled={!isEditing}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Last Name</Label>
                  <Input
                    value={user?.lastName || ""}
                    disabled={!isEditing}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled={!isEditing}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Phone Number</Label>
                  <Input
                    value={user?.phoneNumber || ""}
                    disabled={!isEditing}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="Not provided"
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email Reminders</Label>
                    <p className="text-sm text-zinc-400">
                      Receive booking confirmations and session reminders via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs?.email || false}
                    onCheckedChange={(checked) => handleNotificationToggle("email", checked)}
                    disabled={updateNotificationMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">SMS Reminders</Label>
                    <p className="text-sm text-zinc-400">
                      Receive booking confirmations and session reminders via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs?.sms || false}
                    onCheckedChange={(checked) => handleNotificationToggle("sms", checked)}
                    disabled={updateNotificationMutation.isPending}
                  />
                </div>
              </div>
              
              {updateNotificationMutation.isPending && (
                <div className="text-center py-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}