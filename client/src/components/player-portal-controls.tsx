import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, MessageSquare, UserCheck } from "lucide-react";
import { Player } from "@shared/schema";

const emailInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const smsInviteSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
});

type EmailInviteForm = z.infer<typeof emailInviteSchema>;
type SMSInviteForm = z.infer<typeof smsInviteSchema>;

interface PlayerPortalControlsProps {
  player: Player;
}

export default function PlayerPortalControls({ player }: PlayerPortalControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false);

  const emailForm = useForm<EmailInviteForm>({
    resolver: zodResolver(emailInviteSchema),
    defaultValues: {
      email: player.email || "",
    },
  });

  const smsForm = useForm<SMSInviteForm>({
    resolver: zodResolver(smsInviteSchema),
    defaultValues: {
      phoneNumber: player.phoneNumber || "",
    },
  });

  // Calculate player age
  const currentYear = new Date().getFullYear();
  const playerAge = currentYear - player.birthYear;
  const isEligible = playerAge >= 13;

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ setting, value }: { setting: string; value: boolean }) => {
      const response = await apiRequest("PATCH", `/api/players/${player.id}/settings`, {
        [setting]: value
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Settings updated",
        description: "Player portal settings have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const sendEmailInviteMutation = useMutation({
    mutationFn: async (data: EmailInviteForm) => {
      const response = await apiRequest("POST", `/api/players/${player.id}/invite`, {
        method: 'email',
        email: data.email
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Email invite sent!",
        description: "Player invitation has been sent successfully",
      });
      setIsEmailDialogOpen(false);
      emailForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email invite",
        variant: "destructive",
      });
    },
  });

  const sendSMSInviteMutation = useMutation({
    mutationFn: async (data: SMSInviteForm) => {
      const response = await apiRequest("POST", `/api/players/${player.id}/invite`, {
        method: 'sms',
        phoneNumber: data.phoneNumber
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "SMS invite sent!",
        description: "Player invitation has been sent successfully",
      });
      setIsSMSDialogOpen(false);
      smsForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS invite",
        variant: "destructive",
      });
    },
  });

  // Handle direct invite sending when contact info exists
  const handleEmailInvite = () => {
    if (player.email) {
      // Send invite immediately with existing email
      sendEmailInviteMutation.mutate({ email: player.email });
    } else {
      // Open dialog to collect email
      setIsEmailDialogOpen(true);
    }
  };

  const handleSMSInvite = () => {
    if (player.phoneNumber) {
      // Send invite immediately with existing phone number
      sendSMSInviteMutation.mutate({ phoneNumber: player.phoneNumber });
    } else {
      // Open dialog to collect phone number
      setIsSMSDialogOpen(true);
    }
  };



  if (!isEligible) {
    return (
      <div className="mt-3 p-3 bg-muted border border-border rounded-lg">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-muted-foreground">
            Age {playerAge}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Player portal access available at age 13+
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-muted border border-border rounded-lg space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Badge className="bg-green-600">
          Age {playerAge} - Portal Eligible
        </Badge>
        {player.userAccountCreated && (
          <Badge variant="outline" className="border-green-600 text-green-400">
            <UserCheck className="w-3 h-3 mr-1" />
            Account Active
          </Badge>
        )}
      </div>

      {/* Portal Access Toggle */}
      <div className="flex justify-between items-center">
        <Label htmlFor={`portal-${player.id}`} className="text-foreground text-sm">
          Allow player to access portal
        </Label>
        <Switch
          id={`portal-${player.id}`}
          checked={player.canAccessPortal || false}
          onCheckedChange={(value) =>
            updateSettingsMutation.mutate({ setting: 'canAccessPortal', value })
          }
          disabled={updateSettingsMutation.isPending}
        />
      </div>

      {/* Booking & Payment Toggle */}
      <div className="flex justify-between items-center">
        <Label htmlFor={`booking-${player.id}`} className="text-foreground text-sm">
          Allow player to book and pay for sessions
        </Label>
        <Switch
          id={`booking-${player.id}`}
          checked={player.canBookAndPay || false}
          onCheckedChange={(value) =>
            updateSettingsMutation.mutate({ setting: 'canBookAndPay', value })
          }
          disabled={updateSettingsMutation.isPending}
        />
      </div>

      {/* Invite Section */}
      <div className="pt-2 border-t border-border">
        <div className="text-sm text-muted-foreground mb-2">Send account invite:</div>
        
        {player.invitedAt && (
          <div className="text-xs text-muted-foreground mb-2">
            Last invited {new Date(player.invitedAt).toLocaleDateString()} via {player.inviteSentVia}
          </div>
        )}
        
        <div className="flex space-x-2">
          {/* Email Invite Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailInvite}
            disabled={sendEmailInviteMutation.isPending}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Mail className="w-4 h-4 mr-1" />
            {player.email ? "Send Email" : "Email"}
          </Button>
          
          {/* Email Dialog */}
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Send Email Invite</DialogTitle>
              </DialogHeader>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((data) => sendEmailInviteMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="player@example.com"
                            className="bg-input border-border text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={sendEmailInviteMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sendEmailInviteMutation.isPending ? "Sending..." : "Send Invite"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEmailDialogOpen(false)}
                      className="border-border text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* SMS Invite Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSMSInvite}
            disabled={sendSMSInviteMutation.isPending}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {player.phoneNumber ? "Send SMS" : "SMS"}
          </Button>

          {/* SMS Dialog */}
          <Dialog open={isSMSDialogOpen} onOpenChange={setIsSMSDialogOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Send SMS Invite</DialogTitle>
              </DialogHeader>
              <Form {...smsForm}>
                <form onSubmit={smsForm.handleSubmit((data) => sendSMSInviteMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={smsForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="bg-input border-border text-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={sendSMSInviteMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sendSMSInviteMutation.isPending ? "Sending..." : "Send Invite"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSMSDialogOpen(false)}
                      className="border-border text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          {player.email || player.phoneNumber 
            ? "Click to send invite instantly, or edit player profile to update contact info" 
            : "Click Email or SMS to enter contact details and send invites"}
        </div>
      </div>
    </div>
  );
}