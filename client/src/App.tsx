import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TerminologyProvider } from "@/contexts/TerminologyContext";

import { BusinessProvider } from "@/contexts/BusinessContext";
import ErrorBoundary from "@/components/error-boundary";
import CookieConsentBanner from "@/components/ui/cookie-consent";
import { TrialStatusIndicator } from "@/components/trial-status-indicator";
import HomePlayHQ from "@/pages/HomePlayHQ";
import FutsalLanding from "@/pages/FutsalLanding";
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
import AdminPayment from "@/pages/admin/payment";
import AdminSessionWaitlist from "@/pages/admin/session-waitlist";
import AdminCommunications from "@/pages/admin/communications";
import AdminInvitations from "@/pages/admin/invitations";

import AdminPlayerDevelopment from "@/pages/admin/player-development";
import SuperAdmin from "@/pages/super-admin";
import Help from "@/pages/help";
import MyHelpRequests from "@/pages/my-help-requests";
import Profile from "@/pages/profile";
import MultiCheckout from "@/pages/multi-checkout";
import SessionPayment from "@/pages/session-payment";
import NotFound from "@/pages/not-found";
import SignupStart from "@/pages/SignupStart";
import SignupParentFlow from "@/pages/SignupParentFlow";
import SignupPlayerFlow from "@/pages/SignupPlayerFlow";
import GetStarted from "@/pages/GetStarted";
import Join from "@/pages/Join";
import PersonalSignup from "@/pages/PersonalSignup";
import Signup from "@/pages/Signup";
import SignupBusiness from "@/pages/SignupBusiness";
import BusinessSignupNew from "@/pages/BusinessSignupNew";
import SignupConsumer from "@/pages/SignupConsumer";
import Login from "@/pages/Login";
import LoginBusiness from "@/pages/LoginBusiness";
import LoginConsumer from "@/pages/LoginConsumer";
import AppUnassigned from "@/pages/AppUnassigned";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyEmailSent from "@/pages/VerifyEmailSent";
import SetPassword from "@/pages/SetPassword";
import ResetPassword from "@/pages/ResetPassword";
import AcceptInvite from "@/pages/accept-invite";
import PlayerInvite from "@/pages/player-invite";
import Parent2Invite from "@/pages/parent2-invite";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Status from "./pages/Status";
import HouseholdManagement from "./pages/household-management";
import CreditHistory from "./pages/credit-history";
import PaymentHistory from "./pages/payment-history";
import AdminCredits from "./pages/admin/credits";
import AdminSmsCredits from "./pages/admin/sms-credits";
import AdminBilling from "./pages/admin/billing";
import AdminQuickBooksIntegration from "./pages/admin/quickbooks-integration";
import AdminFinancialReports from "./pages/admin/financial-reports";
import Checkout from "./pages/checkout";
import CheckoutSuccess from "./pages/checkout-success";
import PublicSessions from "./pages/PublicSessions";
import PublicSessionDetail from "./pages/PublicSessionDetail";
import ClerkBusinessSignup from "./pages/ClerkBusinessSignup";
import ClerkBusinessSignupCallback from "./pages/ClerkBusinessSignupCallback";

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
        <Route path="/" component={HomePlayHQ} />
        <Route path="/landing" component={FutsalLanding} />
        <Route path="/app" component={Dashboard} />
        <Route path="/app-unassigned" component={AppUnassigned} />
        <Route path="/signups" component={SignupStart} />
        <Route path="/get-started" component={GetStarted} />
        <Route path="/join" component={Join} />
        <Route path="/signup" component={Signup} />
        <Route path="/signup-business" component={BusinessSignupNew} />
        <Route path="/signup-business/*" component={BusinessSignupNew} />
        <Route path="/signup-business-old" component={SignupBusiness} />
        <Route path="/signup/clerk" component={ClerkBusinessSignup} />
        <Route path="/signup/clerk/callback" component={ClerkBusinessSignupCallback} />
        <Route path="/signup-consumer" component={SignupConsumer} />
        <Route path="/signup-consumer/*" component={SignupConsumer} />
        <Route path="/login" component={Login} />
        <Route path="/login-business" component={LoginBusiness} />
        <Route path="/login-business/*" component={LoginBusiness} />
        <Route path="/login-consumer" component={LoginConsumer} />
        <Route path="/login-consumer/*" component={LoginConsumer} />
        <Route path="/login/*" component={Login} />
        <Route path="/forgot" component={ForgotPassword} />
        <Route path="/verify-email-sent" component={VerifyEmailSent} />
        <Route path="/set-password" component={SetPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/accept-invite" component={AcceptInvite} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/status" component={Status} />
        <Route path="/browse/:tenantSlug" component={PublicSessions} />
        <Route path="/browse/:tenantSlug/session/:sessionId" component={PublicSessionDetail} />
        <Route path="/profile" component={Profile} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:id" component={SessionDetail} />
        <Route path="/session/:id/payment" component={SessionPayment} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/multi-checkout" component={MultiCheckout} />
        <Route path="/player-invite/:token" component={PlayerInvite} />
        <Route path="/parent2-invite/:token" component={Parent2Invite} />
        <Route path="/help" component={Help} />
        <Route path="/my-help-requests" component={MyHelpRequests} />
        <Route path="/household">
          <Redirect to="/dashboard?tab=household" />
        </Route>
        <Route path="/credits/history" component={CreditHistory} />
        <Route path="/payments/history" component={PaymentHistory} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        {(user?.isAdmin || user?.isAssistant) && (
          <>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/sessions" component={AdminSessions} />
            <Route path="/admin/sessions/new" component={AdminSessionDetail} />
            <Route path="/admin/sessions/:id/waitlist" component={AdminSessionWaitlist} />
            <Route path="/admin/sessions/:id" component={AdminSessionDetail} />
            <Route path="/admin/payments" component={AdminPayments} />
            <Route path="/admin/discount-codes">
              <Redirect to="/admin/invitations" />
            </Route>
            <Route path="/admin/access-codes">
              <Redirect to="/admin/invitations" />
            </Route>
            <Route path="/admin/players" component={AdminPlayers} />
            <Route path="/admin/parents" component={AdminParents} />
            <Route path="/admin/invitations" component={AdminInvitations} />
            <Route path="/admin/pending-registrations" component={AdminPendingRegistrations} />
            <Route path="/admin/communications" component={AdminCommunications} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/player-development" component={AdminPlayerDevelopment} />
            <Route path="/admin/help-requests" component={AdminHelpRequests} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/admin/integrations" component={AdminIntegrations} />
            <Route path="/admin/integrations/quickbooks" component={AdminQuickBooksIntegration} />
            <Route path="/admin/reports/financial" component={AdminFinancialReports} />
            <Route path="/admin/credits" component={AdminCredits} />
            <Route path="/admin/sms-credits" component={AdminSmsCredits} />
            <Route path="/admin/billing" component={AdminBilling} />
            <Route path="/admin/payment" component={AdminPayment} />
          </>
        )}
        {user?.isSuperAdmin && (
          <>
            <Route path="/super-admin" component={SuperAdmin} />
            <Route path="/super-admin/:page" component={SuperAdmin} />
            <Route path="/super-admin/:page/:tab" component={SuperAdmin} />
            <Route path="/super-admin/:page/:tab/:subTab" component={SuperAdmin} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>

      {/* Cookie Consent Banner - shows globally */}
      <CookieConsentBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BusinessProvider>
          <AuthProvider>
            <TerminologyProvider>
              <TimezoneProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <Toaster />
                    <Router />
                  </ErrorBoundary>
                </TooltipProvider>
              </TimezoneProvider>
            </TerminologyProvider>
          </AuthProvider>
        </BusinessProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;