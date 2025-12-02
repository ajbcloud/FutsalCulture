import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, User, Mail, Phone, MapPin, Loader2, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const businessSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  orgName: z.string().min(2, "Club name is required"),
  city: z.string().optional(),
  state: z.string().optional(),
});

type BusinessSignupForm = z.infer<typeof businessSignupSchema>;

interface InitResponse {
  success: boolean;
  message?: string;
  token?: string;
  prefill?: {
    firstName: string;
    lastName: string;
    email: string;
    orgName: string;
  };
  tenantId?: string;
  userId?: string;
}

export default function BusinessSignupNew() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [, setLocation] = useLocation();

  const form = useForm<BusinessSignupForm>({
    resolver: zodResolver(businessSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      orgName: "",
      city: "",
      state: "",
    },
  });

  const initMutation = useMutation({
    mutationFn: async (data: BusinessSignupForm) => {
      const response = await apiRequest("POST", "/api/auth/business-signup/init", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        orgName: data.orgName,
        city: data.city,
        state: data.state,
        country: "US",
      });
      return response.json() as Promise<InitResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setLocation(`/signup/clerk?token=${data.token}`);
      }
    },
  });

  const onSubmit = (data: BusinessSignupForm) => {
    initMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Create Your Club on PlayHQ
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
            Step 1 of 2: Enter your club details
          </p>
        </div>

        <Card className={isDarkMode ? "bg-slate-800 border-slate-700" : ""}>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Building2 className={`h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                      Club Information
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="orgName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                          Club Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Central Futsal Academy"
                            className={isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}
                            data-testid="input-org-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                            City (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-gray-400"}`} />
                              <Input
                                {...field}
                                placeholder="Chicago"
                                className={`pl-10 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                                data-testid="input-city"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                            State (Optional)
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className={isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}
                                data-testid="select-state"
                              >
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className={isDarkMode ? "bg-slate-800 border-slate-700" : ""}>
                              {US_STATES.map((state) => (
                                <SelectItem 
                                  key={state.value} 
                                  value={state.value}
                                  className={isDarkMode ? "text-white focus:bg-slate-700" : ""}
                                >
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <User className={`h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                      Your Information
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              className={isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}
                              data-testid="input-first-name"
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
                          <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Smith"
                              className={isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}
                              data-testid="input-last-name"
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
                        <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-gray-400"}`} />
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              className={`pl-10 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                              data-testid="input-email"
                            />
                          </div>
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
                        <FormLabel className={isDarkMode ? "text-slate-300" : ""}>
                          Phone (Optional)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-gray-400"}`} />
                            <Input
                              {...field}
                              type="tel"
                              placeholder="(555) 123-4567"
                              className={`pl-10 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                              data-testid="input-phone"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {initMutation.error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {(initMutation.error as any)?.message || "Something went wrong. Please try again."}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={initMutation.isPending}
                  data-testid="button-next-step"
                >
                  {initMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up your club...
                    </>
                  ) : (
                    <>
                      Next: Create Your Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className={`text-xs text-center ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}>
                  You'll create your login credentials in the next step
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a
            className="underline text-blue-600 dark:text-blue-400"
            href="/login-business"
            data-testid="link-login"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
