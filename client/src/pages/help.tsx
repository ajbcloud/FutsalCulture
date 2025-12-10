import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusinessName } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useHasFeature } from "@/hooks/use-feature-flags";
import { FEATURE_KEYS } from "@shared/feature-flags";
import { Mail, Phone, Clock, MapPin, Sparkles, Crown, MessageSquare, History, Building2, HelpCircle } from "lucide-react";
import { Link } from "wouter";

interface TenantInfo {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  location?: {
    city?: string | null;
    state?: string | null;
    country?: string | null;
  };
}

// Base schema for all users
const baseHelpSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z.string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"),
  phone: z.string()
    .optional()
    .refine((val) => !val || (val.length >= 10 && val.length <= 20), "Phone number must be 10-20 characters")
    .refine((val) => !val || /^[\d\s()\-+.]+$/.test(val), "Phone number can only contain digits, spaces, parentheses, hyphens, plus signs, and periods"),
  subject: z.string()
    .min(1, "Subject is required")
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters"),
  category: z.string()
    .min(1, "Category is required"),
  message: z.string()
    .min(1, "Message is required")
    .min(20, "Message must be at least 20 characters")
    .max(1000, "Message must be less than 1000 characters")
    .regex(/^(?!.*(.)\1{5,}).*$/, "Message contains suspicious patterns"),
  captcha: z.string()
    .min(1, "Please solve the math problem")
    .regex(/^\d+$/, "Please enter only the numeric answer"),
});

// Schema for admin/players (includes priority)
const adminHelpSchema = baseHelpSchema.extend({
  priority: z.string()
    .min(1, "Priority is required"),
});

// Schema for parents (no priority field)
const parentHelpSchema = baseHelpSchema;

type HelpForm = z.infer<typeof adminHelpSchema>;

export default function Help() {
  const businessName = useBusinessName();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { hasFeature: hasPlayerDevelopment } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  const { hasFeature: hasFeatureRequests } = useHasFeature(FEATURE_KEYS.FEATURE_REQUESTS);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isParent, setIsParent] = useState(false);
  
  // Fetch tenant settings for contact information
  const { data: settings } = useQuery({
    queryKey: ["/api/tenant/settings"],
    queryFn: async () => {
      const response = await fetch("/api/tenant/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });
  
  // Fetch tenant info when user is logged in
  const { data: tenantInfo } = useQuery<TenantInfo>({
    queryKey: ["/api/tenant/info"],
    queryFn: async () => {
      const response = await fetch("/api/tenant/info");
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isAuthenticated && !!user?.tenantId,
  });
  
  // Determine if we should show club contact info
  const hasClubContact = tenantInfo?.contactEmail || tenantInfo?.contactName;
  
  // Generate random math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    switch(operator) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
      default: answer = num1 + num2;
    }
    
    setCaptchaQuestion(`${num1} ${operator} ${num2} = ?`);
    setCaptchaAnswer(answer.toString());
  };
  
  // Generate captcha on component mount and determine user type
  useEffect(() => {
    generateCaptcha();
    
    // Determine if user is a parent (not admin/assistant and not a player)
    if (user) {
      const checkUserType = async () => {
        try {
          // Check if user is admin/assistant
          if (user.isAdmin || user.isAssistant) {
            setIsParent(false);
            return;
          }
          
          // Check if user is a player
          const playersResponse = await fetch("/api/players");
          if (playersResponse.ok) {
            const players = await playersResponse.json();
            const isPlayerUser = players.some((player: any) => player.userId === user.id);
            setIsParent(!isPlayerUser); // If not a player, then is a parent
          } else {
            setIsParent(true); // Default to parent if can't determine
          }
        } catch (error) {
          console.error("Error determining user type:", error);
          setIsParent(true); // Default to parent if error occurs
        }
      };
      
      checkUserType();
    } else {
      // For non-authenticated users, show parent view
      setIsParent(true);
    }
  }, [user]);
  
  const form = useForm<HelpForm>({
    resolver: zodResolver(isParent ? parentHelpSchema : adminHelpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      priority: isParent ? undefined : "medium",
      message: "",
      captcha: "",
    },
  });

  const submitHelpMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; phone?: string; subject: string; category: string; priority?: string; message: string; source?: string }) => {
      const response = await apiRequest("/api/help", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      generateCaptcha(); // Generate new captcha for next submission
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: HelpForm) => {
    // Verify captcha before submitting
    if (data.captcha !== captchaAnswer) {
      toast({
        title: "Captcha Error",
        description: "Please solve the math problem correctly.",
        variant: "destructive",
      });
      generateCaptcha(); // Generate new captcha
      form.setValue("captcha", ""); // Clear captcha field
      return;
    }
    
    // Determine source based on authentication status and user type
    let source = "main_page"; // default for non-authenticated users
    if (user) {
      try {
        // Check if the current user is a player
        const playersResponse = await fetch("/api/players");
        if (playersResponse.ok) {
          const players = await playersResponse.json();
          const isPlayer = players.some((player: any) => player.userId === user.id);
          source = isPlayer ? "player_portal" : "parent_portal";
        } else {
          // Fallback to parent portal if we can't determine
          source = "parent_portal";
        }
      } catch (error) {
        console.error("Error determining user type:", error);
        // Fallback to parent portal if error occurs
        source = "parent_portal";
      }
    }
    
    // Remove captcha for submission and add source, set default priority for parents
    const { captcha, ...submitData } = data;
    const finalData = {
      ...submitData,
      source,
      priority: isParent ? "medium" : submitData.priority, // Default priority for parents
    };
    submitHelpMutation.mutate(finalData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4">Get Help</h1>
            <p className="text-muted-foreground text-lg">
              {hasClubContact 
                ? `Need assistance with ${tenantInfo?.name || 'your club'} or the PlayHQ platform? We're here to help!`
                : "Need assistance with PlayHQ or your sports organization management? We're here to help!"
              }
            </p>
          </div>
          
          {isAuthenticated && (
            <div className="flex-shrink-0 ml-8">
              <Link href="/my-help-requests">
                <Button variant="outline" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  My Help Requests
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-xl">
                {hasClubContact ? `Message ${tenantInfo?.name || 'Your Club'}` : 'Send us a message'}
              </CardTitle>
              {hasClubContact && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your request will be sent to the club administrators
                </p>
              )}
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-600/20 border border-green-600 rounded-lg p-6 mb-4">
                    <h3 className="text-green-400 font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for contacting us. We'll respond within 24 hours.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">




                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">First Name <span className="text-red-400">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field} 
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                                required
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
                            <FormLabel className="text-foreground">Last Name <span className="text-red-400">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field} 
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                                required
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
                          <FormLabel className="text-foreground">Email <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your.email@example.com" 
                              {...field} 
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                              required
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
                          <FormLabel className="text-foreground">Phone</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="(555) 123-4567" 
                              {...field} 
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Subject <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Brief description of your request" 
                              {...field} 
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={isParent ? "w-full" : "grid grid-cols-2 gap-4"}>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Category <span className="text-red-400">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="booking">Booking</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="account">Account</SelectItem>
                                {hasFeatureRequests && <SelectItem value="feature_request">Feature Request</SelectItem>}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!isParent && (
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Priority <span className="text-red-400">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border-border">
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Message <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please describe your issue or question in detail (minimum 20 characters)" 
                              rows={5}
                              {...field} 
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="captcha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            Security Check: {captchaQuestion} <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="Enter your answer (numbers only)" 
                              {...field} 
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={submitHelpMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {submitHelpMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>



          {/* Contact Information */}
          <div className="space-y-6">
            {/* Club Contact - Show when user is logged in under a tenant */}
            {hasClubContact && (
              <Card className="bg-card border border-blue-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-foreground text-xl">Contact {tenantInfo?.name || 'Your Club'}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    For questions about sessions, schedules, or payments
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tenantInfo?.contactName && (
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-foreground font-medium">Contact Person</p>
                        <p className="text-muted-foreground">{tenantInfo.contactName}</p>
                      </div>
                    </div>
                  )}
                  
                  {tenantInfo?.contactEmail && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-foreground font-medium">Email</p>
                        <a 
                          href={`mailto:${tenantInfo.contactEmail}`}
                          className="text-blue-400 hover:underline"
                        >
                          {tenantInfo.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {tenantInfo?.location?.city && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-foreground font-medium">Location</p>
                        <p className="text-muted-foreground">
                          {[tenantInfo.location.city, tenantInfo.location.state, tenantInfo.location.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* PlayHQ Platform Support - Always shown, secondary when club contact exists */}
            <Card className={`bg-card border ${hasClubContact ? 'border-border' : 'border-blue-500/30'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-foreground text-xl">
                    {hasClubContact ? 'PlayHQ Platform Support' : 'Contact Information'}
                  </CardTitle>
                </div>
                {hasClubContact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    For account issues, app bugs, or billing questions
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-foreground font-medium">Email</p>
                    <a href="mailto:support@playhq.app" className="text-blue-400 hover:underline">
                      support@playhq.app
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-foreground font-medium">Phone</p>
                    <p className="text-muted-foreground">(833) PLAY-HQS</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-foreground font-medium">Support Hours</p>
                    <p className="text-muted-foreground">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-foreground font-medium">Headquarters</p>
                    <p className="text-muted-foreground">Miami, Florida</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-xl">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-foreground font-medium mb-2">What is PlayHQ?</h4>
                  <p className="text-muted-foreground text-sm">PlayHQ is a comprehensive sports management platform that helps organizations manage sessions, players, payments, and communications all in one place.</p>
                </div>
                
                <div>
                  <h4 className="text-foreground font-medium mb-2">How do I access my organization's portal?</h4>
                  <p className="text-muted-foreground text-sm">Each organization on PlayHQ has its own custom portal. Your organization admin will provide you with the specific access link.</p>
                </div>
                
                <div>
                  <h4 className="text-foreground font-medium mb-2">Can I manage multiple organizations?</h4>
                  <p className="text-muted-foreground text-sm">Yes! PlayHQ supports multi-tenant management, allowing you to oversee multiple sports organizations from a single platform.</p>
                </div>
                
                <div>
                  <h4 className="text-foreground font-medium mb-2">What payment methods are supported?</h4>
                  <p className="text-muted-foreground text-sm">PlayHQ integrates with Braintree to support all major credit cards, digital wallets, and secure payment processing.</p>
                </div>
                
                <div>
                  <h4 className="text-foreground font-medium mb-2">Is my data secure?</h4>
                  <p className="text-muted-foreground text-sm">Absolutely. PlayHQ uses enterprise-grade security with SSL encryption, secure authentication, and regular security audits to protect your data.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}