import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ReservationCountdownProps {
  expiresAt: string;
  onExpired: () => void;
}

export function ReservationCountdown({ expiresAt, onExpired }: ReservationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const difference = expires - now;
      
      if (difference <= 0) {
        setHasExpired(true);
        setTimeLeft(0);
        onExpired();
        return 0;
      }
      
      return difference;
    };

    // Calculate initial time
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Set up interval to update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage (assuming 1 hour = 60 minutes total)
  const totalDurationMs = 60 * 60 * 1000; // 1 hour in milliseconds
  const progressPercentage = Math.max(0, (timeLeft / totalDurationMs) * 100);

  if (hasExpired) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <X className="h-4 w-4 animate-pulse" />
        <span>Reservation expired</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
      <div className={`flex items-center gap-2 text-sm font-semibold ${
        timeLeft < 300000 ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'
      }`}>
        <Clock className={`h-4 w-4 ${timeLeft < 300000 ? 'animate-pulse' : ''}`} />
        <span>Payment due in {formatTime(timeLeft)}</span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-3 bg-amber-100 dark:bg-amber-800"
        style={{
          '--progress-foreground': timeLeft < 300000 ? 'rgb(239 68 68)' : timeLeft < 900000 ? 'rgb(245 158 11)' : 'rgb(34 197 94)'
        } as React.CSSProperties}
      />
    </div>
  );
}