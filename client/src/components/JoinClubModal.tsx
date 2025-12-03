import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JoinClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess?: () => void;
}

export default function JoinClubModal({ isOpen, onClose, onJoinSuccess }: JoinClubModalProps) {
  const { signOut } = useClerk();
  const { toast } = useToast();
  
  const [clubCode, setClubCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!clubCode.trim()) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/consumer/join", {
        club_code: clubCode.trim().toLowerCase(),
      });
      
      if (response.ok) {
        const result = await response.json();
        setClubName(result.tenantName);
        setJoinSuccess(true);
        
        toast({
          title: "Welcome!",
          description: `You've joined ${result.tenantName}!`,
        });
        
        setTimeout(async () => {
          await signOut();
          toast({
            title: "Please log back in",
            description: "Log in again to access your club.",
          });
        }, 2000);
        
        if (onJoinSuccess) {
          onJoinSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join club");
      }
    } catch (err) {
      console.error("Error joining club:", err);
      setError(err instanceof Error ? err.message : "Failed to join club. Please check your code and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && clubCode.trim() && !isJoining) {
      handleJoin();
    }
  };

  if (joinSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Welcome to {clubName}!</h2>
            <p className="text-muted-foreground mb-4">
              You've successfully joined the club.
            </p>
            <p className="text-sm text-muted-foreground">
              Signing you out... Please log back in to access your club.
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <DialogTitle className="text-xl">Join a Club</DialogTitle>
          </div>
          <DialogDescription>
            Enter the code provided by your club to connect your account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="club-code">Club Code</Label>
            <Input
              id="club-code"
              type="text"
              value={clubCode}
              onChange={(e) => {
                setClubCode(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="e.g., futsal-culture"
              className="text-center text-lg tracking-wider"
              disabled={isJoining}
              data-testid="input-join-club-code"
            />
            <p className="text-xs text-muted-foreground text-center">
              This is usually your club's name with dashes (e.g., "my-club-name")
            </p>
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isJoining}
              data-testid="button-skip-join"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleJoin}
              disabled={!clubCode.trim() || isJoining}
              className="flex-1"
              data-testid="button-join-club"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Club'
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2">
            You can also join a club later from your Settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
