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
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <X className="h-4 w-4" />
        <span>Reservation expired</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <Clock className="h-4 w-4" />
        <span>Payment required in {formatTime(timeLeft)}</span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700"
        style={{
          '--progress-foreground': timeLeft < 300000 ? 'rgb(239 68 68)' : 'rgb(245 158 11)'
        } as React.CSSProperties}
      />
    </div>
  );
}