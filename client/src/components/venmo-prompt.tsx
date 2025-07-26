import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FutsalSession, Player } from "@shared/schema";
import { calculateAgeGroup } from "@shared/utils";

interface VenmoPromptProps {
  isOpen: boolean;
  onClose: () => void;
  signupData: {
    id: string;
    reservationExpiresAt: string;
    player: Player;
    session: FutsalSession;
  } | null;
}

export default function VenmoPrompt({ isOpen, onClose, signupData }: VenmoPromptProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!signupData?.reservationExpiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(signupData.reservationExpiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [signupData?.reservationExpiresAt]);

  if (!signupData || !signupData.player || !signupData.session) return null;

  const { player, session } = signupData;
  
  // Ensure session has required properties
  if (!session.startTime || !session.gender || !player.firstName || !player.birthYear) {
    console.error("Missing required properties in signup data:", signupData);
    return null;
  }
  
  const sessionDate = new Date(session.startTime);
  const ageGroup = calculateAgeGroup(player.birthYear);
  const genderPrefix = session.gender === "boys" ? "B" : "G";
  
  // Format: [PlayerFirstName] [PlayerAgeGroup] [CurrentDate]
  const currentDate = format(new Date(), 'MM/dd');
  const venmoNote = `${player.firstName} ${genderPrefix}${ageGroup} ${currentDate}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(venmoNote);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Payment note copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the note manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Spot Reserved!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reservation Status */}
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 font-medium">Reserved Until</p>
                  <p className="text-white text-lg">
                    {format(new Date(signupData.reservationExpiresAt), 'h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">Time Left</p>
                  <div className="flex items-center gap-1 text-white text-lg">
                    <Clock className="w-4 h-4" />
                    {timeLeft}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <div>
            <h3 className="text-white font-medium mb-2">Session Details</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p><strong>{player.firstName}</strong> - {session.title}</p>
              <p>{format(sessionDate, 'EEEE, MMMM d')} at {format(sessionDate, 'h:mm a')}</p>
              <p>{session.location}</p>
              <p className="text-white font-medium">${(session.priceCents / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="space-y-4">
            <h3 className="text-white font-medium text-center">Complete Payment via Venmo</h3>
            
            {/* Payment Details */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Make payments to:</p>
                  <p className="text-white font-mono text-lg font-semibold">@DMC-Futsal_Culture</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm text-center mb-2">Copy and paste into Message:</p>
                  <div className="flex items-center gap-2 bg-black/50 p-3 rounded border">
                    <code className="text-green-400 font-mono text-sm flex-1 text-center">
                      {venmoNote}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className={`p-1 h-auto ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">${(session.priceCents / 100).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 py-3"
                  onClick={() => window.open("https://account.venmo.com/u/DMC-Futsal_Culture", '_blank')}
                >
                  Pay Online
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 py-3"
                  onClick={() => window.open("venmo://u/DMC-Futsal_Culture", '_blank')}
                >
                  Pay by App
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full border-zinc-600"
              >
                I'll Pay Later
              </Button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="text-yellow-400 text-sm text-center">
                <strong>Important:</strong> Your spot is held for 1 hour. Please complete 
                Venmo payment or the reservation will be automatically cancelled.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}