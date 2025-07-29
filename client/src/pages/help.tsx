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
import { Mail, Phone, Clock, MapPin } from "lucide-react";

const helpSchema = z.object({
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
  priority: z.string()
    .min(1, "Priority is required"),
  message: z.string()
    .min(1, "Message is required")
    .min(20, "Message must be at least 20 characters")
    .max(1000, "Message must be less than 1000 characters")
    .regex(/^(?!.*(.)\1{5,}).*$/, "Message contains suspicious patterns"),
  captcha: z.string()
    .min(1, "Please solve the math problem")
    .regex(/^\d+$/, "Please enter only the numeric answer"),
});

type HelpForm = z.infer<typeof helpSchema>;

export default function Help() {
  const businessName = useBusinessName();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
  // Fetch admin settings for contact information
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });
  
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
  
  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);
  
  const form = useForm<HelpForm>({
    resolver: zodResolver(helpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      priority: "medium",
      message: "",
      captcha: "",
    },
  });

  const submitHelpMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; phone?: string; subject: string; category: string; priority: string; message: string; source?: string }) => {
      const response = await apiRequest("POST", "/api/help", data);
      return response.json();
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
    
    // Remove captcha for submission and add source
    const { captcha, ...submitData } = data;
    submitHelpMutation.mutate({ ...submitData, source });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get Help</h1>
          <p className="text-zinc-400 text-lg">
            Need assistance with PlayHQ or your sports organization management? We're here to help!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-600/20 border border-green-600 rounded-lg p-6 mb-4">
                    <h3 className="text-green-400 font-semibold mb-2">Message Sent!</h3>
                    <p className="text-zinc-400">
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
                            <FormLabel className="text-white">First Name <span className="text-red-400">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field} 
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
                            <FormLabel className="text-white">Last Name <span className="text-red-400">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field} 
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
                          <FormLabel className="text-white">Email <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your.email@example.com" 
                              {...field} 
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
                          <FormLabel className="text-white">Phone</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="(555) 123-4567" 
                              {...field} 
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
                          <FormLabel className="text-white">Subject <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Brief description of your request" 
                              {...field} 
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Category <span className="text-red-400">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600">
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="booking">Booking</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="account">Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Priority <span className="text-red-400">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600">
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
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Message <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please describe your issue or question in detail (minimum 20 characters)" 
                              rows={5}
                              {...field} 
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
                          <FormLabel className="text-white">
                            Security Check: {captchaQuestion} <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="Enter your answer (numbers only)" 
                              {...field} 
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
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
            <Card className="bg-zinc-900 border border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-zinc-400">support@playhq.app</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-zinc-400">(833) PLAY-HQS</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Support Hours</p>
                    <p className="text-zinc-400">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-white font-medium">Headquarters</p>
                    <p className="text-zinc-400">Miami, Florida</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">What is PlayHQ?</h4>
                  <p className="text-zinc-400 text-sm">PlayHQ is a comprehensive sports management platform that helps organizations manage sessions, players, payments, and communications all in one place.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">How do I access my organization's portal?</h4>
                  <p className="text-zinc-400 text-sm">Each organization on PlayHQ has its own custom portal. Your organization admin will provide you with the specific access link.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Can I manage multiple organizations?</h4>
                  <p className="text-zinc-400 text-sm">Yes! PlayHQ supports multi-tenant management, allowing you to oversee multiple sports organizations from a single platform.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">What payment methods are supported?</h4>
                  <p className="text-zinc-400 text-sm">PlayHQ integrates with Stripe to support all major credit cards, digital wallets, and secure payment processing.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Is my data secure?</h4>
                  <p className="text-zinc-400 text-sm">Absolutely. PlayHQ uses enterprise-grade security with SSL encryption, secure authentication, and regular security audits to protect your data.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}