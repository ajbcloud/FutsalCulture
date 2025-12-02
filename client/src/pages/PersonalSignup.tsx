import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export default function PersonalSignup() {
  const [, navigate] = useLocation();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      navigate("/join?need_code=true");
    } else {
      navigate("/login");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
