import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail, Users } from 'lucide-react';

const parent2SignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
});

type Parent2SignupForm = z.infer<typeof parent2SignupSchema>;

export default function Parent2Invite() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<Parent2SignupForm>({
    resolver: zodResolver(parent2SignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Validate token and get parent 1 info
  const { data: inviteData, isLoading, error } = useQuery({
    queryKey: [`/api/parent2-invite/validate/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Create parent 2 account
  const createAccountMutation = useMutation({
    mutationFn: async (data: Parent2SignupForm) => {
      const response = await apiRequest("POST", `/api/parent2-invite/accept/${token}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Parent 2 account created successfully!",
        description: "You now have access to the same parent portal",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create parent 2 account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Parent2SignupForm) => {
    createAccountMutation.mutate(data);
  };

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
              This parent invite link is invalid or has expired.
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
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome to Futsal Culture!</h2>
            <p className="text-zinc-400 mb-4">
              Your Parent 2 account has been created successfully. You now have access to the same parent portal features.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/login">Login to Parent Portal</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border border-zinc-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-blue-400 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <CardTitle className="text-white text-xl">
            Join as Parent 2
          </CardTitle>
          <p className="text-zinc-400 text-sm">
            You've been invited by {(inviteData as any)?.parent1?.firstName} {(inviteData as any)?.parent1?.lastName} to become a second parent for their children's futsal account.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">First Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter your first name"
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
                    <FormLabel className="text-zinc-300">Last Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter your last name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter your email address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter your phone number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createAccountMutation.isPending}
              >
                {createAccountMutation.isPending ? "Creating Account..." : "Create Parent 2 Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}