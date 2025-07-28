import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, Mail, Lock, User } from "lucide-react";
import { useBusinessName } from "@/contexts/BusinessContext";

const playerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PlayerSignupForm = z.infer<typeof playerSignupSchema>;

export default function PlayerInvite() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const businessName = useBusinessName();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PlayerSignupForm>({
    resolver: zodResolver(playerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Validate token and get player info
  const { data: inviteData, isLoading, error } = useQuery({
    queryKey: [`/api/invite/validate/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Create player account
  const createAccountMutation = useMutation({
    mutationFn: async (data: PlayerSignupForm) => {
      const response = await apiRequest("POST", `/api/invite/accept/${token}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Account created successfully!",
        description: "You can now login to access your player portal",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlayerSignupForm) => {
    createAccountMutation.mutate(data);
  };

  // Auto-fill name if available from invite data
  useEffect(() => {
    if (inviteData?.player) {
      form.setValue("firstName", inviteData.player.firstName || "");
      form.setValue("lastName", inviteData.player.lastName || "");
      form.setValue("email", inviteData.player.email || "");
    }
  }, [inviteData, form]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-zinc-900 border border-zinc-700 max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <div className="text-red-400 mb-4">
              <Mail className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Invite</h2>
            <p className="text-zinc-400 mb-4">
              This invite link is invalid or has expired.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/">Go to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-zinc-900 border border-zinc-700 max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <div className="text-green-400 mb-4">
              <CheckCircle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Account Created!</h2>
            <p className="text-zinc-400 mb-6">
              Your player account has been successfully created. You can now login to access your portal.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <a href="/api/login">Login to Player Portal</a>
              </Button>
              <Button variant="outline" asChild className="w-full border-zinc-600 text-zinc-400 hover:text-white">
                <a href="/">Go to Homepage</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border border-zinc-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-green-400 mb-4">
            <User className="w-12 h-12 mx-auto" />
          </div>
          <CardTitle className="text-white text-2xl">
            Welcome to {businessName}
          </CardTitle>
          <p className="text-zinc-400">
            You've been invited to create your player account
          </p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-800 border-zinc-600 text-white"
                          placeholder="John"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-800 border-zinc-600 text-white"
                          placeholder="Doe"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="john@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Choose a secure password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Confirm your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={createAccountMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createAccountMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              By creating an account, you agree to our terms of service
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}