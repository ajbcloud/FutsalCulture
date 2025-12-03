import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useUser, useOrganizationList, useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Loader2, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingChooseOrganization() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { setActive, userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: { infinite: true }
  });
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'checking' | 'joining' | 'success' | 'error' | 'no-code'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clubCode, setClubCode] = useState('');
  const [manualJoining, setManualJoining] = useState(false);
  const hasAttemptedJoin = useRef(false);
  
  const pendingCode = typeof window !== 'undefined' ? localStorage.getItem('pendingClubCode') : null;

  useEffect(() => {
    async function handleAutoJoin() {
      if (!userLoaded || !orgListLoaded) {
        return;
      }
      
      if (!clerkUser) {
        navigate("/signup-consumer");
        return;
      }
      
      if (hasAttemptedJoin.current) {
        return;
      }
      
      if (userMemberships?.data && userMemberships.data.length > 0 && setActive) {
        hasAttemptedJoin.current = true;
        try {
          await setActive({ organization: userMemberships.data[0].organization.id });
          window.location.href = "/app";
        } catch (error) {
          console.error("Error setting active organization:", error);
          setErrorMessage("Failed to activate your organization. Please try again.");
          setStatus('error');
        }
        return;
      }
      
      if (pendingCode) {
        hasAttemptedJoin.current = true;
        setStatus('joining');
        
        try {
          const response = await apiRequest("POST", "/api/beta/clerk-join-by-code", {
            tenant_code: pendingCode,
            first_name: clerkUser.firstName || '',
            last_name: clerkUser.lastName || '',
            role: 'parent'
          });
          
          if (response.ok) {
            const result = await response.json();
            localStorage.removeItem('pendingClubCode');
            
            // Activate the Clerk organization to clear the pending session task
            if (result.clerkOrgId && setActive) {
              try {
                await setActive({ organization: result.clerkOrgId });
              } catch (orgError) {
                console.error("Error setting active organization:", orgError);
                // Continue anyway - the user is in the org, they might just need to refresh
              }
            }
            
            setStatus('success');
            toast({
              title: "Welcome!",
              description: `You've joined ${result.tenantName}. Redirecting...`,
            });
            
            setTimeout(() => {
              window.location.href = "/app";
            }, 1500);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to join club");
          }
        } catch (error) {
          console.error("Error joining club:", error);
          localStorage.removeItem('pendingClubCode');
          setErrorMessage(error instanceof Error ? error.message : "Failed to join club");
          setStatus('error');
        }
      } else {
        setStatus('no-code');
      }
    }
    
    handleAutoJoin();
  }, [userLoaded, orgListLoaded, clerkUser, pendingCode, userMemberships, setActive, navigate, toast]);

  const handleManualJoin = async () => {
    if (!clubCode.trim() || !clerkUser) return;
    
    setManualJoining(true);
    
    try {
      const response = await apiRequest("POST", "/api/beta/clerk-join-by-code", {
        tenant_code: clubCode.trim().toUpperCase(),
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        role: 'parent'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Clear any stale pending code
        localStorage.removeItem('pendingClubCode');
        
        // Activate the Clerk organization to clear the pending session task
        if (result.clerkOrgId && setActive) {
          try {
            await setActive({ organization: result.clerkOrgId });
          } catch (orgError) {
            console.error("Error setting active organization:", orgError);
            // Continue anyway - the user is in the org, they might just need to refresh
          }
        }
        
        setStatus('success');
        toast({
          title: "Welcome!",
          description: `You've joined ${result.tenantName}. Redirecting...`,
        });
        
        setTimeout(() => {
          window.location.href = "/app";
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid club code");
      }
    } catch (error) {
      console.error("Error joining club:", error);
      // Clear stale code on error too
      localStorage.removeItem('pendingClubCode');
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: error instanceof Error ? error.message : "Please check your code and try again",
      });
    } finally {
      setManualJoining(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('pendingClubCode');
    await signOut();
    navigate("/");
  };

  if (status === 'checking' || status === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="text-center max-w-md">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {status === 'joining' ? 'Joining your club...' : 'Setting up your account...'}
          </h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {status === 'joining' ? 'Almost there!' : 'Please wait a moment'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome to your club!
          </h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Unable to join club
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {errorMessage}
          </p>
          
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-lg'} mb-4`}>
            <Label htmlFor="club-code" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              Enter a different club code
            </Label>
            <div className="flex gap-2">
              <Input
                id="club-code"
                type="text"
                value={clubCode}
                onChange={(e) => setClubCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                className="flex-1"
                data-testid="input-club-code"
              />
              <Button 
                onClick={handleManualJoin}
                disabled={!clubCode.trim() || manualJoining}
                data-testid="button-join-club"
              >
                {manualJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className={`text-sm ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            data-testid="button-sign-out"
          >
            Sign out and start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Join Your Club
          </h1>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Enter the code provided by your club to complete signup
          </p>
        </div>

        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
          <Label htmlFor="club-code-main" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Club Code
          </Label>
          <div className="space-y-4">
            <Input
              id="club-code-main"
              type="text"
              value={clubCode}
              onChange={(e) => setClubCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              className="text-center text-lg tracking-wider"
              data-testid="input-club-code-main"
            />
            <Button 
              onClick={handleManualJoin}
              disabled={!clubCode.trim() || manualJoining}
              className="w-full"
              data-testid="button-join-club-main"
            >
              {manualJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Club'
              )}
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Signed in as {clerkUser?.primaryEmailAddress?.emailAddress}
            </p>
            <button
              onClick={handleSignOut}
              className={`text-sm mt-2 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              data-testid="button-different-account"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
