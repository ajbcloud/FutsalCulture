import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface CustomAvatarProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
  backgroundColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-10 w-10"
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base"
};

export function CustomAvatar({ 
  src, 
  alt, 
  fallbackText, 
  backgroundColor = "#2563eb",
  size = "md",
  className = ""
}: CustomAvatarProps) {
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback 
        className={`${textSizes[size]} text-white font-medium`}
        style={{ backgroundColor }}
        data-testid="avatar-fallback"
      >
        {fallbackText || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}