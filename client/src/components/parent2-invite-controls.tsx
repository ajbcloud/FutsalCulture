import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, MessageSquare, Users, UserPlus } from "lucide-react";

const emailInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const smsInviteSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
});

type EmailInviteForm = z.infer<typeof emailInviteSchema>;
type SMSInviteForm = z.infer<typeof smsInviteSchema>;

export default function Parent2InviteControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false);

  // Get current user info to check for existing parent 2 invite
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const emailForm = useForm<EmailInviteForm>({
    resolver: zodResolver(emailInviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const smsForm = useForm<SMSInviteForm>({
    resolver: zodResolver(smsInviteSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // Email invite mutation
  const sendEmailInviteMutation = useMutation({
    mutationFn: async (data: EmailInviteForm) => {
      const response = await apiRequest("POST", `/api/parent2/invite`, {
        method: 'email',
        email: data.email
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Email invite sent!",
        description: "Parent 2 invitation has been sent successfully",
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

  // SMS invite mutation
  const sendSMSInviteMutation = useMutation({
    mutationFn: async (data: SMSInviteForm) => {
      const response = await apiRequest("POST", `/api/parent2/invite`, {
        method: 'sms',
        phoneNumber: data.phoneNumber
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "SMS invite sent!",
        description: "Parent 2 invitation has been sent successfully",
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

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Add Parent 2
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-zinc-400">
          Invite a second parent to share access to your children's futsal account. They will have the same portal access and booking abilities.
        </div>

        {(currentUser as any)?.parent2InvitedAt && (
          <div className="text-xs text-green-400 bg-green-900/20 border border-green-700 rounded p-2">
            Parent 2 invite sent {new Date((currentUser as any).parent2InvitedAt).toLocaleDateString()} via {(currentUser as any).parent2InviteSentVia}
          </div>
        )}

        {/* Invite Section */}
        <div className="pt-2 border-t border-zinc-600">
          <div className="text-sm text-zinc-400 mb-2">Send account invite:</div>
          
          <div className="flex space-x-2">
            {/* Email Invite Button */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-600 text-zinc-400 hover:text-white"
                  disabled={sendEmailInviteMutation.isPending}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Send Email Invite to Parent 2</DialogTitle>
                </DialogHeader>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit((data) => sendEmailInviteMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              className="bg-zinc-800 border-zinc-700 text-white"
                              placeholder="Enter parent 2's email address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={sendEmailInviteMutation.isPending}
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

            {/* SMS Invite Button */}
            <Dialog open={isSMSDialogOpen} onOpenChange={setIsSMSDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-600 text-zinc-400 hover:text-white"
                  disabled={sendSMSInviteMutation.isPending}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  SMS
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Send SMS Invite to Parent 2</DialogTitle>
                </DialogHeader>
                <Form {...smsForm}>
                  <form onSubmit={smsForm.handleSubmit((data) => sendSMSInviteMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={smsForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-zinc-800 border-zinc-700 text-white"
                              placeholder="Enter parent 2's phone number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={sendSMSInviteMutation.isPending}
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
            Parent 2 will receive a link to create their account and gain shared access to all children and portal features.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}