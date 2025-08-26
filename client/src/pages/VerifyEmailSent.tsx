import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailSent() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  
  // Get email from URL params
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  async function resend() {
    setBusy(true);
    try {
      const response = await apiRequest("POST", "/api/auth/resend_verification", {
        email: email
      });
      
      if (response.ok) {
        setDone(true);
        toast({
          title: "Email sent!",
          description: "We've sent another verification email. Please check your inbox.",
        });
      } else {
        throw new Error("Failed to resend email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {done ? (
              <CheckCircle className="h-6 w-6 text-primary" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and set your password. 
              The link will expire in 48 hours.
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button 
              onClick={resend} 
              disabled={busy || done}
              className="w-full"
              variant={done ? "secondary" : "default"}
              data-testid="button-resend-email"
            >
              {done ? "Email Sent!" : busy ? "Sending..." : "Resend Email"}
            </Button>
          </div>
          
          <div className="text-center">
            <a 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-login"
            >
              Already verified? Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}