import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Mail, Phone, Clock, MapPin } from "lucide-react";

const helpSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"),
  phone: z.string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[\d\s()\-+.]+$/, "Phone number can only contain digits, spaces, parentheses, hyphens, plus signs, and periods"),
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
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
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
      name: "",
      email: "",
      phone: "",
      message: "",
      captcha: "",
    },
  });

  const submitHelpMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; note: string }) => {
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

  const onSubmit = (data: HelpForm) => {
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
    
    // Remove captcha and map message to note for backend schema
    const { captcha, message, ...otherData } = data;
    const submitData = {
      ...otherData,
      note: message, // Backend expects 'note' field
    };
    submitHelpMutation.mutate(submitData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get Help</h1>
          <p className="text-zinc-400 text-lg">
            Need assistance with your Futsal Culture experience? We're here to help!
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




                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Name <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your full name" 
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
                          <FormLabel className="text-white">Phone <span className="text-red-400">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="(555) 123-4567" 
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
                    <p className="text-zinc-400">support@futsalculture.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-zinc-400">(555) 123-GOAL</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Support Hours</p>
                    <p className="text-zinc-400">Monday - Friday</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-white font-medium">Location</p>
                    <p className="text-zinc-400">South Florida</p>
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
                  <h4 className="text-white font-medium mb-2">When do sessions open for booking?</h4>
                  <p className="text-zinc-400 text-sm">Sessions open at 8:00 AM on the day of training.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">How much does each session cost?</h4>
                  <p className="text-zinc-400 text-sm">Each futsal training session costs $10.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Can I cancel a reservation?</h4>
                  <p className="text-zinc-400 text-sm">Yes, you can cancel from your dashboard before the session starts.</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">How do age groups work?</h4>
                  <p className="text-zinc-400 text-sm">Players are automatically assigned to age groups (U8, U10, etc.) based on their birth year.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}