import { useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const helpRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  note: z.string().min(10, "Please provide more details (at least 10 characters)"),
});

type HelpRequestForm = z.infer<typeof helpRequestSchema>;

const faqs = [
  {
    question: "When do session bookings open?",
    answer: "Bookings open at exactly 8:00 AM on the day of each session. Make sure to book early as spots fill quickly!"
  },
  {
    question: "What is the cost per session?",
    answer: "Each training session costs $10.00 per child. Payment is required to confirm your reservation."
  },
  {
    question: "Can I cancel a reservation?",
    answer: "Yes, you can cancel reservations from your parent dashboard. Refunds are processed manually by our admin team."
  },
  {
    question: "How do I add multiple children?",
    answer: "In your parent dashboard, you can add multiple players using the 'Add Player' button. Each child will have their own profile."
  },
  {
    question: "What age groups do you offer?",
    answer: "We offer training sessions for various age groups including U8, U10, U12, and U14. Check our sessions page for specific offerings."
  },
];

export default function Help() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const form = useForm<HelpRequestForm>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      note: "",
    },
  });

  const submitHelpRequest = useMutation({
    mutationFn: async (data: HelpRequestForm) => {
      const response = await apiRequest("POST", "/api/help-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your help request has been submitted. We'll get back to you soon!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit help request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HelpRequestForm) => {
    submitHelpRequest.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h1>
          <p className="text-xl text-gray-600">Get in touch with our support team</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How can we help?</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={5}
                            placeholder="Describe your question or issue..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitHelpRequest.isPending}
                  >
                    {submitHelpRequest.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Collapsible
                    key={index}
                    open={openFaq === index}
                    onOpenChange={(open) => setOpenFaq(open ? index : null)}
                  >
                    <CollapsibleTrigger className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
                      <span className="font-medium">{faq.question}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 text-gray-600 border-x border-b rounded-b-lg">
                      {faq.answer}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
