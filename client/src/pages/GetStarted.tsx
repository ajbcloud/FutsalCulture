import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, User, ArrowRight, Home } from "lucide-react";

export default function GetStarted() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome to PlayHQ
          </h1>
          <p className="text-muted-foreground text-lg">
            How would you like to get started?
          </p>
        </div>

        <div className="flex justify-start mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
            data-testid="button-back-home"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>

        <div className="grid gap-4">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate("/club-signup")}
            data-testid="card-signup-business"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Business / Club Owner</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage your sports club, set up sessions, handle payments, and invite members.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate("/signup/unaffiliated?role=parent")}
            data-testid="card-signup-parent"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Parent / Guardian</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Register to manage your children's sports activities, book sessions, and handle payments.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate("/signup/unaffiliated?role=player")}
            data-testid="card-signup-player"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Player (18+)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Register as an adult player to book sessions and manage your own sports activities.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4 pt-4">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/login")}
              data-testid="link-login"
            >
              Sign in
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Have an invite code from a club?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/join")}
              data-testid="link-join-club"
            >
              Join with invite code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
