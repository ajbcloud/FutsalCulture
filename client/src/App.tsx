import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import Landing from "@/pages/landing";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/session-detail";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSessions from "@/pages/admin/sessions/index";
import AdminSessionDetail from "@/pages/admin/sessions/[id]";
import AdminPayments from "@/pages/admin/payments";
import AdminPlayers from "@/pages/admin/players";
import AdminParents from "@/pages/admin/parents";
import AdminAnalyticsWorking from "@/pages/admin/analytics-working";
import AdminPendingRegistrations from "@/pages/admin/pending-registrations";
import AdminHelpRequests from "@/pages/admin/help-requests";
import AdminSettings from "@/pages/admin/settings";
import AdminIntegrations from "@/pages/admin/integrations";
import AdminDiscountCodes from "@/pages/admin/discount-codes";
import Help from "@/pages/help";
import Profile from "@/pages/profile";
import MultiCheckout from "@/pages/multi-checkout";
import PlayerInvite from "@/pages/player-invite";
import Parent2Invite from "@/pages/parent2-invite";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
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
            <Route path="/dashboard" component={Dashboard} />
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
                <Route path="/admin/sessions/:id" component={AdminSessionDetail} />
                <Route path="/admin/payments" component={AdminPayments} />
                <Route path="/admin/discount-codes" component={AdminDiscountCodes} />
                <Route path="/admin/players" component={AdminPlayers} />
                <Route path="/admin/parents" component={AdminParents} />
                <Route path="/admin/pending-registrations" component={AdminPendingRegistrations} />
                <Route path="/admin/analytics" component={AdminAnalyticsWorking} />
                <Route path="/admin/help-requests" component={AdminHelpRequests} />
                <Route path="/admin/settings" component={AdminSettings} />
                <Route path="/admin/integrations" component={AdminIntegrations} />
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
      <AuthProvider>
        <TimezoneProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TimezoneProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
