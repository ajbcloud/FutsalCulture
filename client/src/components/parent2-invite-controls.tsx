import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Send, Mail, MessageSquare, CheckCircle } from "lucide-react";

interface Parent2InviteControlsProps {
  userId: string;
  currentParent2?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    inviteStatus?: string;
  } | null;
}

export default function Parent2InviteControls({ userId, currentParent2 }: Parent2InviteControlsProps) {
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms'>('email');
  const [contactInfo, setContactInfo] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { method: 'email' | 'sms'; contactInfo: string }) => {
      const response = await apiRequest("POST", `/api/parent2-invite`, {
        method: data.method,
        [data.method === 'email' ? 'email' : 'phoneNumber']: data.contactInfo,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation sent!",
        description: `Second adult invitation has been sent via ${inviteMethod}.`,
        variant: "default",
      });
      
      // Reset form
      setContactInfo('');
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "Unable to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (!contactInfo.trim()) {
      toast({
        title: "Missing information",
        description: `Please enter ${inviteMethod === 'email' ? 'an email address' : 'a phone number'}.`,
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (inviteMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
    }

    sendInviteMutation.mutate({ method: inviteMethod, contactInfo });
  };

  // If parent 2 already exists and is active
  if (currentParent2 && currentParent2.firstName) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Second Adult/Guardian</CardTitle>
          </div>
          <CardDescription>
            Another adult/guardian is connected to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{currentParent2.firstName} {currentParent2.lastName}</p>
                <p className="text-sm text-gray-600">{currentParent2.email}</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Add Second Adult/Guardian</CardTitle>
        </div>
        <CardDescription>
          Invite another adult or guardian to help manage your children's activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-method">Invitation Method</Label>
          <Select value={inviteMethod} onValueChange={(value: 'email' | 'sms') => setInviteMethod(value)}>
            <SelectTrigger data-testid="select-invite-method">
              <SelectValue placeholder="Select invitation method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </SelectItem>
              <SelectItem value="sms">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-info">
            {inviteMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </Label>
          <Input
            id="contact-info"
            type={inviteMethod === 'email' ? 'email' : 'tel'}
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder={inviteMethod === 'email' ? 'parent@example.com' : '+1234567890'}
            data-testid="input-contact-info"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> The invited parent/guardian will be able to view and manage 
            all players associated with your account, including booking sessions and making payments.
          </p>
        </div>

        <Button 
          onClick={handleSendInvite}
          disabled={sendInviteMutation.isPending || !contactInfo.trim()}
          className="w-full"
          data-testid="button-send-invite"
        >
          <Send className="w-4 h-4 mr-2" />
          {sendInviteMutation.isPending 
            ? 'Sending...' 
            : `Send Invitation via ${inviteMethod === 'email' ? 'Email' : 'SMS'}`
          }
        </Button>
      </CardContent>
    </Card>
  );
}