import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { BusinessProvider } from "@/contexts/BusinessContext";
import Landing from "@/pages/landing";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/session-detail";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSessions from "@/pages/admin/sessions/index";
import AdminSessionDetail from "@/pages/admin/sessions/[id]";
import AdminPayments from "@/pages/admin/payments";
import AdminPlayers from "@/pages/admin/players";
import AdminParents from "@/pages/admin/parents";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminPendingRegistrations from "@/pages/admin/pending-registrations";
import AdminHelpRequests from "@/pages/admin/help-requests";
import AdminSettings from "@/pages/admin/settings";
import AdminIntegrations from "@/pages/admin/integrations";
import AdminDiscountCodes from "@/pages/admin/discount-codes";
import AdminAccessCodes from "@/pages/admin/access-codes";
import AdminPayment from "@/pages/admin/payment";
import AdminSessionWaitlist from "@/pages/admin/session-waitlist";
import AdminEliteFeatures from "@/pages/admin/elite-features";
import AdminPlayerDevelopment from "@/pages/admin/player-development";
import SuperAdmin from "@/pages/super-admin";
import Help from "@/pages/help";
import Profile from "@/pages/profile";
import MultiCheckout from "@/pages/multi-checkout";
import SessionPayment from "@/pages/session-payment";
import PlayerInvite from "@/pages/player-invite";
import Parent2Invite from "@/pages/parent2-invite";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/sessions" component={Sessions} />
            <Route path="/sessions/:id" component={SessionDetail} />
            <Route path="/help" component={Help} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/sessions" component={Sessions} />
            <Route path="/sessions/:id" component={SessionDetail} />
            <Route path="/session/:id/payment" component={SessionPayment} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/profile" component={Profile} />
            <Route path="/multi-checkout" component={MultiCheckout} />
            <Route path="/player-invite/:token" component={PlayerInvite} />
            <Route path="/parent2-invite/:token" component={Parent2Invite} />
            <Route path="/help" component={Help} />
            {(user?.isAdmin || user?.isAssistant) && (
              <>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                <Route path="/admin/sessions" component={AdminSessions} />
                <Route path="/admin/sessions/new" component={AdminSessionDetail} />
                <Route path="/admin/sessions/:id/waitlist" component={AdminSessionWaitlist} />
                <Route path="/admin/sessions/:id" component={AdminSessionDetail} />
                <Route path="/admin/payments" component={AdminPayments} />
                <Route path="/admin/discount-codes" component={AdminDiscountCodes} />
                <Route path="/admin/access-codes" component={AdminAccessCodes} />
                <Route path="/admin/players" component={AdminPlayers} />
                <Route path="/admin/parents" component={AdminParents} />
                <Route path="/admin/pending-registrations" component={AdminPendingRegistrations} />
                <Route path="/admin/analytics" component={AdminAnalytics} />
                <Route path="/admin/player-development" component={AdminPlayerDevelopment} />
                <Route path="/admin/help-requests" component={AdminHelpRequests} />
                <Route path="/admin/settings" component={AdminSettings} />
                <Route path="/admin/integrations" component={AdminIntegrations} />
                <Route path="/admin/elite-features" component={AdminEliteFeatures} />
                <Route path="/admin/payment" component={AdminPayment} />
              </>
            )}
            {user?.isSuperAdmin && (
              <>
                <Route path="/super-admin" component={SuperAdmin} />
                <Route path="/super-admin/:page" component={SuperAdmin} />
              </>
            )}
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BusinessProvider>
          <AuthProvider>
            <TimezoneProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </TimezoneProvider>
          </AuthProvider>
        </BusinessProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
