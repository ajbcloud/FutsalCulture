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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS invite",
        variant: "destructive",
      });
    },
  });



  if (!isEligible) {
    return (
      <div className="mt-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-zinc-400">
            Age {playerAge}
          </Badge>
          <span className="text-sm text-zinc-400">
            Player portal access available at age 13+
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg space-y-4">
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
        <Label htmlFor={`portal-${player.id}`} className="text-white text-sm">
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
        <Label htmlFor={`booking-${player.id}`} className="text-white text-sm">
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
      <div className="pt-2 border-t border-zinc-600">
        <div className="text-sm text-zinc-400 mb-2">Send account invite:</div>
        
        {player.invitedAt && (
          <div className="text-xs text-zinc-500 mb-2">
            Last invited {new Date(player.invitedAt).toLocaleDateString()} via {player.inviteSentVia}
          </div>
        )}
        
        <div className="flex space-x-2">
          {/* Email Invite Dialog */}
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-400 hover:text-white"
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Send Email Invite</DialogTitle>
              </DialogHeader>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((data) => sendEmailInviteMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="player@example.com"
                            className="bg-zinc-800 border-zinc-600 text-white"
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
                      className="border-zinc-600 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* SMS Invite Dialog */}
          <Dialog open={isSMSDialogOpen} onOpenChange={setIsSMSDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-400 hover:text-white"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                SMS
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Send SMS Invite</DialogTitle>
              </DialogHeader>
              <Form {...smsForm}>
                <form onSubmit={smsForm.handleSubmit((data) => sendSMSInviteMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={smsForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="bg-zinc-800 border-zinc-600 text-white"
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
                      className="border-zinc-600 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="text-xs text-amber-400 mt-2">
          Click Email or SMS to enter contact details and send invites
        </div>
      </div>
    </div>
  );
}